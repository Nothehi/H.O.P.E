/**
 * H.O.P.E. — game state model.
 *
 * Everything here must be JSON-serializable: the host broadcasts the full
 * GameState over the mesh after every action. Cards, agendas, puzzles and
 * endings are referenced by id; their definitions live in content.ts.
 * Hidden information (card backs, clues, agendas, bids) is present in the
 * state but gated by the UI — the trust model is a group of friends at a
 * table, same as the physical game.
 */

export const ROLES = [
  "commander",
  "engineer",
  "medic",
  "soldier",
  "technician",
  "psychologist",
  "pilot",
  "scientist",
] as const;
export type Role = (typeof ROLES)[number];

export type ResourceKey = "oxygen" | "hull" | "morale" | "bond";

export interface Resources {
  oxygen: number;
  hull: number;
  morale: number;
  bond: number;
  max: Record<ResourceKey, number>;
}

export interface StickerDef {
  id: string;
  label: string;
  positive: boolean;
  /** Resource track or ship zone the sticker is placed on. */
  target: ResourceKey | string;
  /** Permanent change to a resource track's maximum. */
  maxDelta?: number;
}

export interface PlacedSticker extends StickerDef {
  voyage: number;
  round: number;
}

export interface CardEffects {
  oxygen?: number;
  hull?: number;
  morale?: number;
  bond?: number;
  sticker?: StickerDef;
  /** Flag set in state upon resolution. */
  flagSet?: { key: string; value: boolean };
  /** Envelope id torn open when this outcome resolves. */
  envelope?: string;
  /** Extra narrative shown on resolution. */
  aftermath?: string;
}

export interface DilemmaCard {
  id: string;
  title: string;
  zone: string;
  narrative: string;
  optionA: string;
  optionB: string;
  effectsA: CardEffects;
  effectsB: CardEffects;
  image?: string;
  /** Hidden firewall log fragment — only the Technician sees it while peeking. */
  hiddenLog?: string;
}

export interface EnvelopeDef {
  id: string;
  title: string;
  text: string;
  addCards?: string[];
  sticker?: StickerDef;
}


export interface AgendaDef {
  id: string;
  title: string;
  description: string;
  points: number;
}

export interface EndingDef {
  id: string;
  title: string;
  text: string;
  survived: boolean;
}

export interface LedgerEntry {
  voyage: number;
  round: number;
  cardTitle: string;
  choice: "A" | "B";
  choiceText: string;
  signedBy: string;
}

/** The legacy campaign record — persists across voyages (sessions). */
export interface Chronicle {
  name: string;
  createdAt: number;
  voyage: number;
  stickers: PlacedSticker[];
  ledger: LedgerEntry[];
  envelopesOpened: string[];
  /** Cards permanently added to the deck by envelopes. */
  addedCards: string[];
  /** Cards permanently retired (resolved dilemmas never return). */
  retiredCards: string[];
  heroHistory: { voyage: number; name: string; points: number }[];
  lastEnding?: string;
}

export interface Seat {
  playerId: string;
  name: string;
  role: Role | null;
  connected: boolean;
  tokens: number;
  heroPoints: number;
  agendaId: string | null;
  clueIds?: string[];
  signCount: number;
}

export interface Bid {
  choice: "A" | "B" | "pass";
  tokens: number;
  locked: boolean;
}

export interface ResolutionSummary {
  cardId: string;
  winner: "A" | "B";
  tally: { A: number; B: number };
  leaderName: string | null;
  effects: CardEffects;
  envelopeOpened: string | null;
  notes: string[];
}

export type Stage = "lobby" | "playing" | "ended";
export type Phase = "reveal" | "peek" | "debate" | "resolution";

export const FINAL_ROUND = 10;

export interface FinalScore {
  playerId: string;
  name: string;
  role: Role | null;
  heroPoints: number;
  agendaId: string | null;
  agendaMet: boolean;
  total: number;
}

export const DEFAULT_DEBATE_SECONDS = 90;
export const DEFAULT_MISSION_SECONDS = 25 * 60;

export interface GameState {
  seq: number;
  stage: Stage;
  phase: Phase;
  round: number;
  officerSeat: number;
  seats: Seat[];
  resources: Resources;
  flags: Record<string, boolean>;
  deck: string[];
  currentCardId: string | null;
  peekDone: boolean;
  bids: Record<string, Bid>;
  lastResolution: ResolutionSummary | null;
  puzzle?: null;
  /** Envelope revealed this round (text shown to everyone). */
  openedEnvelopeId: string | null;
  chronicle: Chronicle;
  endingId: string | null;
  finalScores: FinalScore[] | null;
  missionDeadline?: number | null;
  debateDeadline?: number | null;
  timerPaused?: boolean;
  pausedRemainingMissionMs?: number | null;
  pausedRemainingDebateMs?: number | null;
}

export type GameAction =
  | { type: "choose-role"; role: Role | null }
  | { type: "start-game" }
  | { type: "draw-card" }
  | { type: "peek-done" }
  | { type: "set-bid"; choice: "A" | "B" | "pass"; tokens: number }
  | { type: "unlock-bid" }
  | { type: "continue" }
  | { type: "return-to-lobby" }
  | { type: "debate-timeout" }
  | { type: "mission-timeout" }
  | { type: "toggle-timer-pause" }
  | { type: "add-time"; seconds: number }
  | {
      type: "presence";
      players: { playerId: string; name: string; connected: boolean }[];
    };

/** App-level messages carried over the mesh "app" channel. */
export type AppMessage =
  | { t: "hello"; playerId: string; name: string }
  | { t: "action"; playerId: string; action: GameAction }
  | { t: "state"; state: GameState };

export function isAppMessage(data: unknown): data is AppMessage {
  if (typeof data !== "object" || data === null) return false;
  const t = (data as { t?: unknown }).t;
  return t === "hello" || t === "action" || t === "state";
}
