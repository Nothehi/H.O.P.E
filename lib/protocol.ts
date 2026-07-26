/**
 * Wire protocol for H.O.P.E. rooms.
 *
 * Rooms are a host-based mesh on top of PeerJS:
 * - One member owns the room "beacon" peer (a well-known PeerJS id derived
 *   from the room id). New joiners connect to the beacon first and receive
 *   the current member list, then open direct DataConnections to every
 *   member (full mesh). All room traffic flows peer-to-peer over the mesh;
 *   the beacon only performs introductions.
 * - When the beacon owner leaves, the lexicographically-first remaining
 *   member claims the beacon id so the room stays joinable (host migration).
 */

export interface MemberInfo {
  peerId: string;
  name: string;
}

/** Sent by the beacon to a new joiner over the intro connection. */
export type BeaconPayload = {
  type: "peer-list";
  members: MemberInfo[];
};

/** Messages exchanged over mesh connections between members. */
export type MeshPayload =
  | { type: "hello"; name: string }
  | { type: "chat"; id: string; name: string; text: string; sentAt: number }
  | { type: "ping" }
  | { type: "pong" }
  /** Opaque application traffic (the game layer) carried over the mesh. */
  | { type: "app"; data: unknown };

export type WirePayload = BeaconPayload | MeshPayload;

export interface ChatMessage {
  id: string;
  peerId: string;
  name: string;
  text: string;
  sentAt: number;
  own: boolean;
}

export type MemberStatus = "connecting" | "connected" | "disconnected";

export interface Member extends MemberInfo {
  status: MemberStatus;
  isSelf: boolean;
}

export type RoomStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error"
  | "closed";

const ROOM_ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateRoomId(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let id = "";
  for (const b of bytes) id += ROOM_ID_ALPHABET[b % ROOM_ID_ALPHABET.length];
  return id;
}

export function normalizeRoomId(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export function isValidRoomId(id: string): boolean {
  return /^[a-z0-9-]{4,32}$/.test(id);
}

/** Well-known PeerJS id of a room's beacon. */
export function beaconId(roomId: string): string {
  return `wt-room-${roomId}-beacon`;
}

/** Random PeerJS id for a mesh member, namespaced per room. */
export function meshId(roomId: string): string {
  return `wt-room-${roomId}-${generateRoomId(10)}`;
}

/** Mesh ids embed the room id, so rooms can never cross-talk. */
export function belongsToRoom(peerId: string, roomId: string): boolean {
  return peerId.startsWith(`wt-room-${roomId}-`);
}

export function isWirePayload(data: unknown): data is WirePayload {
  if (typeof data !== "object" || data === null) return false;
  const type = (data as { type?: unknown }).type;
  return (
    type === "peer-list" ||
    type === "hello" ||
    type === "chat" ||
    type === "ping" ||
    type === "pong" ||
    type === "app"
  );
}
