"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Peer from "peerjs";
import type { DataConnection } from "peerjs";
import {
  beaconId,
  belongsToRoom,
  isWirePayload,
  meshId,
  type ChatMessage,
  type Member,
  type MemberInfo,
  type MeshPayload,
  type RoomStatus,
} from "@/lib/protocol";
import { peerOptions } from "@/lib/peer-config";

const HEARTBEAT_INTERVAL_MS = 5_000;
const HEARTBEAT_TIMEOUT_MS = 15_000;
const BEACON_CLAIM_DELAY_MS = 1_500;

export interface RoomEvent {
  kind: "join" | "leave" | "room-closed" | "beacon-claimed";
  name?: string;
  /** The peer that fully joined (open connection), for "join" events. */
  peerId?: string;
}

export interface UsePeerRoomResult {
  status: RoomStatus;
  error: string | null;
  selfId: string | null;
  isHost: boolean;
  members: Member[];
  messages: ChatMessage[];
  sendChat: (text: string) => void;
  /** Send app-layer data to one peer, or broadcast to all open peers. */
  sendApp: (data: unknown, toPeerId?: string) => void;
}

interface PeerEntry {
  conn: DataConnection;
  name: string;
  open: boolean;
  lastSeen: number;
}

/**
 * Owns the entire PeerJS lifecycle for one room membership: the mesh peer,
 * the beacon (when this client hosts or inherits the room), heartbeats, and
 * host migration. Components only consume the returned state.
 */
export function usePeerRoom(
  roomId: string,
  displayName: string,
  create: boolean,
  onEvent?: (event: RoomEvent) => void,
  onApp?: (peerId: string, data: unknown) => void,
): UsePeerRoomResult {
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const peerRef = useRef<Peer | null>(null);
  const beaconRef = useRef<Peer | null>(null);
  const entriesRef = useRef<Map<string, PeerEntry>>(new Map());
  const onEventRef = useRef(onEvent);
  const onAppRef = useRef(onApp);
  useEffect(() => {
    onEventRef.current = onEvent;
    onAppRef.current = onApp;
  }, [onEvent, onApp]);

  useEffect(() => {
    if (!roomId || !displayName) return;

    let disposed = false;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    let claimTimer: ReturnType<typeof setTimeout> | null = null;
    const entries = entriesRef.current;

    const emit = (event: RoomEvent) => onEventRef.current?.(event);

    const syncMembers = (self: Peer | null) => {
      const list: Member[] = [];
      if (self?.id) {
        list.push({
          peerId: self.id,
          name: displayName,
          status: "connected",
          isSelf: true,
        });
      }
      for (const [peerId, entry] of entries) {
        list.push({
          peerId,
          name: entry.name,
          status: entry.open ? "connected" : "connecting",
          isSelf: false,
        });
      }
      list.sort((a, b) => a.peerId.localeCompare(b.peerId));
      setMembers(list);
    };

    const fail = (message: string) => {
      if (disposed) return;
      setError(message);
      setStatus("error");
    };

    /**
     * If the beacon owner left, exactly one member should try to take over:
     * the one with the lexicographically-first mesh id. Others do nothing —
     * if the beacon is actually still alive, the claim fails with
     * `unavailable-id` and is silently dropped.
     */
    const maybeClaimBeacon = async (self: Peer) => {
      if (disposed || beaconRef.current) return;
      const ids = [self.id, ...entries.keys()].sort();
      if (ids[0] !== self.id) return;

      if (claimTimer) clearTimeout(claimTimer);
      claimTimer = setTimeout(async () => {
        if (disposed || beaconRef.current) return;
        const { default: PeerCtor } = await import("peerjs");
        const candidate = new PeerCtor(beaconId(roomId), peerOptions());
        candidate.on("open", () => {
          if (disposed) {
            candidate.destroy();
            return;
          }
          beaconRef.current = candidate;
          attachBeaconHandlers(candidate, self);
          setIsHost(true);
          emit({ kind: "beacon-claimed" });
        });
        candidate.on("error", (err) => {
          // "unavailable-id" means the beacon is still owned — expected.
          if (err.type !== "unavailable-id") candidate.destroy();
        });
      }, BEACON_CLAIM_DELAY_MS);
    };

    const removePeer = (self: Peer, peerId: string, announce: boolean) => {
      const entry = entries.get(peerId);
      if (!entry) return;
      entries.delete(peerId);
      entry.conn.close();
      syncMembers(self);
      if (announce && entry.open) emit({ kind: "leave", name: entry.name });
      void maybeClaimBeacon(self);
    };

    const handlePayload = (
      self: Peer,
      conn: DataConnection,
      data: unknown,
    ) => {
      if (!isWirePayload(data)) return;
      const entry = entries.get(conn.peer);
      if (entry) entry.lastSeen = Date.now();

      switch (data.type) {
        case "hello": {
          if (entry) {
            const firstHello = entry.name === "";
            entry.name = data.name;
            syncMembers(self);
            if (firstHello)
              emit({ kind: "join", name: data.name, peerId: conn.peer });
          }
          break;
        }
        case "chat": {
          setMessages((prev) =>
            prev.some((m) => m.id === data.id)
              ? prev
              : [
                  ...prev,
                  {
                    id: data.id,
                    peerId: conn.peer,
                    name: data.name,
                    text: data.text,
                    sentAt: data.sentAt,
                    own: false,
                  },
                ],
          );
          break;
        }
        case "ping":
          conn.send({ type: "pong" } satisfies MeshPayload);
          break;
        case "pong":
          break;
        case "app":
          onAppRef.current?.(conn.peer, data.data);
          break;
        case "peer-list":
          // Only valid on beacon intro connections; ignore on the mesh.
          break;
      }
    };

    /** Register a mesh connection (either direction) and wire its events. */
    const trackConnection = (self: Peer, conn: DataConnection) => {
      if (!belongsToRoom(conn.peer, roomId) || conn.peer === self.id) {
        conn.close();
        return;
      }
      const existing = entries.get(conn.peer);
      if (existing) {
        // Simultaneous dial from both sides: keep the connection initiated
        // by the lexicographically smaller peer id, drop the other.
        const keepIncoming = conn.peer < self.id;
        if (!keepIncoming) {
          conn.close();
          return;
        }
        existing.conn.close();
      }

      const entry: PeerEntry = {
        conn,
        name: existing?.name ?? "",
        open: false,
        lastSeen: Date.now(),
      };
      entries.set(conn.peer, entry);
      syncMembers(self);

      conn.on("open", () => {
        entry.open = true;
        entry.lastSeen = Date.now();
        conn.send({ type: "hello", name: displayName } satisfies MeshPayload);
        syncMembers(self);
      });
      conn.on("data", (data) => handlePayload(self, conn, data));
      conn.on("close", () => removePeer(self, conn.peer, true));
      conn.on("error", () => removePeer(self, conn.peer, true));
    };

    const dial = (self: Peer, target: MemberInfo) => {
      if (entries.has(target.peerId) || target.peerId === self.id) return;
      const conn = self.connect(target.peerId, { reliable: true });
      const entry: PeerEntry = {
        conn,
        name: target.name,
        open: false,
        lastSeen: Date.now(),
      };
      entries.set(target.peerId, entry);
      syncMembers(self);

      conn.on("open", () => {
        entry.open = true;
        entry.lastSeen = Date.now();
        conn.send({ type: "hello", name: displayName } satisfies MeshPayload);
        syncMembers(self);
        if (entry.name)
          emit({ kind: "join", name: entry.name, peerId: target.peerId });
      });
      conn.on("data", (data) => handlePayload(self, conn, data));
      conn.on("close", () => removePeer(self, target.peerId, true));
      conn.on("error", () => removePeer(self, target.peerId, true));
    };

    /** Beacon duty: introduce joiners to the room, then hang up. */
    const attachBeaconHandlers = (beacon: Peer, self: Peer) => {
      beacon.on("connection", (conn) => {
        conn.on("open", () => {
          const members: MemberInfo[] = [
            { peerId: self.id, name: displayName },
            ...[...entries.entries()]
              .filter(([, e]) => e.open)
              .map(([peerId, e]) => ({ peerId, name: e.name })),
          ];
          conn.send({ type: "peer-list", members });
          setTimeout(() => conn.close(), 2_000);
        });
      });
      beacon.on("disconnected", () => beacon.reconnect());
    };

    const start = async () => {
      const { default: PeerCtor } = await import("peerjs");
      if (disposed) return;
      setStatus("connecting");

      const self = new PeerCtor(meshId(roomId), peerOptions());
      peerRef.current = self;

      // Join path: ask the beacon for the member list, then mesh out.
      const joinViaBeacon = (self2: Peer) => {
        const intro = self2.connect(beaconId(roomId), { reliable: true });
        const introTimeout = setTimeout(() => {
          intro.close();
          fail("Could not reach the room. Check the room ID and try again.");
        }, 10_000);

        intro.on("data", (data) => {
          if (!isWirePayload(data) || data.type !== "peer-list") return;
          clearTimeout(introTimeout);
          setStatus("connected");
          syncMembers(self2);
          for (const member of data.members) dial(self2, member);
          intro.close();
        });
        intro.on("error", () => {
          clearTimeout(introTimeout);
          fail("Room not found. It may have been closed.");
        });
      };

      self.on("open", (id) => {
        if (disposed) return;
        setSelfId(id);

        if (create) {
          const beacon = new PeerCtor(beaconId(roomId), peerOptions());
          beacon.on("open", () => {
            if (disposed) return;
            beaconRef.current = beacon;
            attachBeaconHandlers(beacon, self);
            setIsHost(true);
            setStatus("connected");
            syncMembers(self);
          });
          beacon.on("error", (err) => {
            if (err.type === "unavailable-id") {
              // The room already exists (e.g. the creator refreshed after
              // host migration, or an id collision): join it instead.
              beacon.destroy();
              if (!disposed) joinViaBeacon(self);
            }
          });
        } else {
          joinViaBeacon(self);
        }
      });

      self.on("connection", (conn) => trackConnection(self, conn));

      self.on("disconnected", () => {
        // Lost the signaling broker; mesh connections keep working, but
        // reconnect so new peers can still find us.
        if (!disposed && !self.destroyed) self.reconnect();
      });

      self.on("error", (err) => {
        if (err.type === "peer-unavailable") {
          // PeerJS reports unreachable peers on the Peer, not the connection.
          if (String(err.message).includes(beaconId(roomId))) {
            fail("Room not found. Check the room ID — it may have been closed.");
          }
          // Otherwise a mesh dial failed (peer left between intro and dial);
          // the heartbeat sweep cleans up the stale entry.
          return;
        }
        if (
          err.type === "network" ||
          err.type === "server-error" ||
          err.type === "socket-error" ||
          err.type === "socket-closed"
        ) {
          fail("Lost connection to the signaling server. Retrying…");
          setTimeout(() => {
            if (!disposed && !self.destroyed) {
              self.reconnect();
              setError(null);
              setStatus("connected");
            }
          }, 3_000);
          return;
        }
        fail(`Connection error: ${err.type}`);
      });

      heartbeat = setInterval(() => {
        const now = Date.now();
        for (const [peerId, entry] of entries) {
          if (!entry.open) {
            // A dial that never opened (peer left mid-join): drop it quietly.
            if (now - entry.lastSeen > HEARTBEAT_TIMEOUT_MS) {
              removePeer(self, peerId, false);
            }
            continue;
          }
          if (now - entry.lastSeen > HEARTBEAT_TIMEOUT_MS) {
            removePeer(self, peerId, true);
          } else {
            entry.conn.send({ type: "ping" } satisfies MeshPayload);
          }
        }
      }, HEARTBEAT_INTERVAL_MS);
    };

    void start();

    return () => {
      disposed = true;
      if (heartbeat) clearInterval(heartbeat);
      if (claimTimer) clearTimeout(claimTimer);
      for (const entry of entries.values()) entry.conn.close();
      entries.clear();
      beaconRef.current?.destroy();
      beaconRef.current = null;
      peerRef.current?.destroy();
      peerRef.current = null;
      setMembers([]);
      setSelfId(null);
      setIsHost(false);
      setStatus("idle");
    };
  }, [roomId, displayName, create]);

  const sendChat = useCallback(
    (text: string) => {
      const self = peerRef.current;
      const trimmed = text.trim();
      if (!self?.id || !trimmed) return;

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        peerId: self.id,
        name: displayName,
        text: trimmed,
        sentAt: Date.now(),
        own: true,
      };
      setMessages((prev) => [...prev, message]);

      const payload: MeshPayload = {
        type: "chat",
        id: message.id,
        name: message.name,
        text: message.text,
        sentAt: message.sentAt,
      };
      for (const entry of entriesRef.current.values()) {
        if (entry.open) entry.conn.send(payload);
      }
    },
    [displayName],
  );

  const sendApp = useCallback((data: unknown, toPeerId?: string) => {
    const payload: MeshPayload = { type: "app", data };
    if (toPeerId) {
      const entry = entriesRef.current.get(toPeerId);
      if (entry?.open) entry.conn.send(payload);
      return;
    }
    for (const entry of entriesRef.current.values()) {
      if (entry.open) entry.conn.send(payload);
    }
  }, []);

  return { status, error, selfId, isHost, members, messages, sendChat, sendApp };
}
