"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePeerRoom, type RoomEvent, type UsePeerRoomResult } from "./use-peer-room";
import { applyAction, createLobbyState } from "@/lib/game/engine";
import { loadChronicle, saveChronicle } from "@/lib/game/chronicle";
import {
  isAppMessage,
  type AppMessage,
  type GameAction,
  type GameState,
} from "@/lib/game/types";

export interface UseGameResult
  extends Omit<UsePeerRoomResult, "sendApp"> {
  game: GameState | null;
  dispatch: (action: GameAction) => void;
}

/**
 * The game layer on top of the peer room. The room host (beacon owner) is
 * the game authority: it runs the engine reducer for every action — its own
 * and those arriving over the mesh — and broadcasts the full GameState.
 * Everyone else just renders the latest state and sends actions. Because
 * every client keeps the last state, a migrated host resumes the game
 * seamlessly, and every client checkpoints the Chronicle to localStorage.
 */
export function useGame(
  roomId: string,
  displayName: string,
  create: boolean,
  onEvent?: (event: RoomEvent) => void,
): UseGameResult {
  const [game, setGame] = useState<GameState | null>(null);

  const gameRef = useRef<GameState | null>(null);
  const isHostRef = useRef(false);
  const selfIdRef = useRef<string | null>(null);
  const sendAppRef = useRef<(data: unknown, toPeerId?: string) => void>(() => {});

  const adopt = useCallback(
    (state: GameState) => {
      gameRef.current = state;
      setGame(state);
      saveChronicle(roomId, state.chronicle);
    },
    [roomId],
  );

  /** Host-only: run the reducer and broadcast the result. */
  const hostApply = useCallback(
    (playerId: string, action: GameAction) => {
      const current = gameRef.current;
      if (!current) return;
      const next = applyAction(current, playerId, action);
      if (next === current) return;
      adopt(next);
      sendAppRef.current({ t: "state", state: next } satisfies AppMessage);
    },
    [adopt],
  );

  const onApp = useCallback(
    (peerId: string, data: unknown) => {
      if (!isAppMessage(data)) return;
      switch (data.t) {
        case "action":
          // The connection's peer id is the trusted identity — never the
          // playerId claimed inside the message.
          if (isHostRef.current) hostApply(peerId, data.action);
          break;
        case "state": {
          const seq = gameRef.current?.seq ?? 0;
          if (data.state.seq > seq) adopt(data.state);
          break;
        }
        case "hello":
          break;
      }
    },
    [adopt, hostApply],
  );

  const room = usePeerRoom(roomId, displayName, create, onEvent, onApp);
  const { status, isHost, selfId, members, sendApp } = room;

  useEffect(() => {
    isHostRef.current = isHost;
    selfIdRef.current = selfId;
    sendAppRef.current = sendApp;
  }, [isHost, selfId, sendApp]);

  // Host bootstrap: create the lobby from the saved Chronicle when hosting a
  // fresh room; a migrated host simply keeps the last broadcast state.
  useEffect(() => {
    if (!isHost || status !== "connected") return;
    if (!gameRef.current) {
      adopt(createLobbyState(loadChronicle(roomId)));
    }
  }, [isHost, status, roomId, adopt]);

  // Host presence sync: mirror the mesh membership into the game state and
  // rebroadcast, which also brings late joiners fully up to date.
  useEffect(() => {
    if (!isHost || !selfId || !gameRef.current) return;
    hostApply(selfId, {
      type: "presence",
      players: members.map((m) => ({
        playerId: m.peerId,
        name: m.name || "…",
        connected: m.status === "connected",
      })),
    });
    // Presence may be a no-op state-wise; still rebroadcast for new peers.
    sendApp({ t: "state", state: gameRef.current } satisfies AppMessage);
  }, [isHost, selfId, members, hostApply, sendApp, game]);

  // Host timer ticker: monitors mission and debate deadlines
  useEffect(() => {
    if (!isHost || status !== "connected") return;
    const interval = setInterval(() => {
      const g = gameRef.current;
      const self = selfIdRef.current;
      if (!g || !self || g.stage !== "playing" || g.timerPaused) return;

      const now = Date.now();
      if (g.missionDeadline && now >= g.missionDeadline) {
        hostApply(self, { type: "mission-timeout" });
        return;
      }

      if (g.phase === "debate" && g.debateDeadline && now >= g.debateDeadline) {
        hostApply(self, { type: "debate-timeout" });
        return;
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isHost, status, hostApply]);

  const dispatch = useCallback(
    (action: GameAction) => {
      const self = selfIdRef.current;
      if (!self) return;
      if (isHostRef.current) {
        hostApply(self, action);
      } else {
        sendAppRef.current({
          t: "action",
          playerId: self,
          action,
        } satisfies AppMessage);
      }
    },
    [hostApply],
  );

  return { ...room, game, dispatch };
}
