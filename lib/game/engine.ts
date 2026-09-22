/**
 * H.O.P.E. — game engine.
 *
 * A pure reducer run only by the room host (the beacon owner): clients send
 * GameActions over the mesh, the host applies them here and broadcasts the
 * resulting GameState to everyone. Nothing in this file touches the network
 * or the DOM.
 */

import {
  AGENDAS,
  AGENDA_IDS,
  BASE_DECK,
  CARDS,
  ENVELOPES,
  FINAL_CARD_ID,
  MIRACLE_REQ,
  agendaMet,
} from "./content";
import {
  DEFAULT_DEBATE_SECONDS,
  DEFAULT_MISSION_SECONDS,
  FINAL_ROUND,
  type Bid,
  type CardEffects,
  type Chronicle,
  type GameAction,
  type GameState,
  type ResourceKey,
  type Resources,
  type Seat,
} from "./types";

const START_TOKENS = 10;
const MAX_TOKENS = 15;

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function newChronicle(name: string): Chronicle {
  return {
    name,
    createdAt: Date.now(),
    voyage: 0,
    stickers: [],
    ledger: [],
    envelopesOpened: [],
    addedCards: [],
    retiredCards: [],
    heroHistory: [],
  };
}

function startResources(): Resources {
  return {
    oxygen: 10,
    hull: 10,
    morale: 10,
    bond: 2,
    max: { oxygen: 15, hull: 15, morale: 15, bond: 10 },
  };
}

export function createLobbyState(chronicle: Chronicle): GameState {
  return {
    seq: 1,
    stage: "lobby",
    phase: "reveal",
    round: 0,
    officerSeat: 0,
    seats: [],
    resources: startResources(),
    flags: {},
    deck: [],
    currentCardId: null,
    peekDone: false,
    bids: {},
    lastResolution: null,
    puzzle: null,
    openedEnvelopeId: null,
    chronicle,
    endingId: null,
    finalScores: null,
    missionDeadline: null,
    debateDeadline: null,
    timerPaused: false,
  };
}

function newSeat(playerId: string, name: string): Seat {
  return {
    playerId,
    name,
    role: null,
    connected: true,
    tokens: START_TOKENS,
    heroPoints: 0,
    agendaId: null,
    clueIds: [],
    signCount: 0,
  };
}

function seatOf(state: GameState, playerId: string): Seat | undefined {
  return state.seats.find((s) => s.playerId === playerId);
}

function hasSticker(state: GameState, stickerId: string): boolean {
  return state.chronicle.stickers.some((s) => s.id === stickerId);
}

function connectedSeats(state: GameState): Seat[] {
  return state.seats.filter((s) => s.connected);
}

/** Officer may act; if the officer seat is disconnected, anyone may. */
function canModerate(state: GameState, playerId: string): boolean {
  const officer = state.seats[state.officerSeat];
  if (!officer || !officer.connected) return !!seatOf(state, playerId);
  return officer.playerId === playerId;
}

function clampResource(state: GameState, key: ResourceKey, delta: number) {
  const r = state.resources;
  r[key] = Math.max(0, Math.min(r.max[key], r[key] + delta));
}

function placeSticker(
  state: GameState,
  sticker: NonNullable<CardEffects["sticker"]>,
  notes: string[],
) {
  if (hasSticker(state, sticker.id)) return;
  state.chronicle.stickers.push({
    ...sticker,
    voyage: state.chronicle.voyage,
    round: state.round,
  });
  if (
    sticker.maxDelta &&
    (["oxygen", "hull", "morale", "bond"] as const).includes(
      sticker.target as ResourceKey,
    )
  ) {
    const key = sticker.target as ResourceKey;
    state.resources.max[key] = Math.max(
      1,
      state.resources.max[key] + sticker.maxDelta,
    );
    clampResource(state, key, 0);
  }
  notes.push(`Chronicle sticker placed: ${sticker.label} (${sticker.target}).`);
}

function openEnvelope(
  state: GameState,
  envelopeId: string,
  notes: string[],
): void {
  const env = ENVELOPES[envelopeId];
  if (!env) return;
  if (state.chronicle.envelopesOpened.includes(envelopeId)) {
    notes.push(`${env.title} was already opened in a previous voyage.`);
    return;
  }
  state.chronicle.envelopesOpened.push(envelopeId);
  state.openedEnvelopeId = envelopeId;
  notes.push(`Sealed envelope torn open: ${env.title}.`);
  if (env.addCards) {
    for (const cardId of env.addCards) {
      if (!state.chronicle.addedCards.includes(cardId)) {
        state.chronicle.addedCards.push(cardId);
      }
      // Shuffle the new card into the remaining deck at a random position.
      const at = Math.floor(Math.random() * (state.deck.length + 1));
      state.deck.splice(at, 0, cardId);
    }
    notes.push("New dilemma cards have been shuffled into the deck — permanently.");
  }
  if (env.sticker) placeSticker(state, env.sticker, notes);
}

function startVoyage(state: GameState) {
  const chronicle = state.chronicle;
  chronicle.voyage += 1;

  // Legacy deck: base cards plus everything envelopes added, minus every
  // card a past resolution retired. If attrition leaves fewer cards than a
  // voyage needs, the oldest retired cards resurface as "echoes".
  const retired = new Set(chronicle.retiredCards);
  const pool = [...BASE_DECK, ...chronicle.addedCards].filter(
    (id) => !retired.has(id),
  );
  while (pool.length < 5 && chronicle.retiredCards.length > 0) {
    const revived = chronicle.retiredCards.shift()!;
    pool.push(revived);
  }
  state.deck = shuffle(pool);

  state.resources = startResources();
  state.flags = {};
  for (const sticker of chronicle.stickers) {
    if (
      sticker.maxDelta &&
      sticker.target in state.resources.max
    ) {
      const key = sticker.target as ResourceKey;
      state.resources.max[key] = Math.max(
        1,
        state.resources.max[key] + sticker.maxDelta,
      );
    }
  }

  const agendas = shuffle(AGENDA_IDS);
  state.seats.forEach((seat, i) => {
    seat.tokens = START_TOKENS;
    seat.heroPoints = 0;
    seat.signCount = 0;
    seat.agendaId = agendas[i % agendas.length];
  });

  state.stage = "playing";
  state.round = 1;
  state.officerSeat = 0;
  state.phase = "reveal";
  state.currentCardId = null;
  state.peekDone = false;
  state.bids = {};
  state.lastResolution = null;
  state.openedEnvelopeId = null;
  state.endingId = null;
  state.finalScores = null;
  state.missionDeadline = Date.now() + DEFAULT_MISSION_SECONDS * 1000;
  state.debateDeadline = null;
  state.timerPaused = false;
}

function endGame(state: GameState, endingId: string) {
  state.stage = "ended";
  state.endingId = endingId;
  state.chronicle.lastEnding = endingId;
  state.missionDeadline = null;
  state.debateDeadline = null;
  state.timerPaused = false;

  state.finalScores = state.seats
    .map((seat) => {
      const met = agendaMet(seat.agendaId, seat, state);
      const bonus =
        met && seat.agendaId ? (AGENDAS[seat.agendaId]?.points ?? 0) : 0;
      return {
        playerId: seat.playerId,
        name: seat.name,
        role: seat.role,
        heroPoints: seat.heroPoints,
        agendaId: seat.agendaId,
        agendaMet: met,
        total: seat.heroPoints + bonus,
      };
    })
    .sort((a, b) => b.total - a.total);

  const hero = state.finalScores[0];
  if (hero) {
    state.chronicle.heroHistory.push({
      voyage: state.chronicle.voyage,
      name: hero.name,
      points: hero.total,
    });
  }
}

/** After resources change, did the ship die? */
function checkCatastrophe(state: GameState): boolean {
  const r = state.resources;
  if (r.oxygen <= 0) return endGame(state, "suffocation"), true;
  if (r.hull <= 0) return endGame(state, "breakup"), true;
  if (r.morale <= 0) return endGame(state, "mutiny"), true;
  return false;
}

function applyEffects(
  state: GameState,
  effects: CardEffects,
  notes: string[],
) {
  if (effects.oxygen) clampResource(state, "oxygen", effects.oxygen);
  if (effects.hull) clampResource(state, "hull", effects.hull);
  if (effects.morale) clampResource(state, "morale", effects.morale);
  if (effects.bond) clampResource(state, "bond", effects.bond);
  if (effects.flagSet) {
    state.flags[effects.flagSet.key] = effects.flagSet.value;
    notes.push(`State Flag set: ${effects.flagSet.key} = ${effects.flagSet.value}`);
  }
  if (effects.sticker) placeSticker(state, effects.sticker, notes);
  if (effects.envelope) openEnvelope(state, effects.envelope, notes);
}

function resolveDilemma(state: GameState, timeoutPenalty = false) {
  state.debateDeadline = null;
  const card = state.currentCardId ? CARDS[state.currentCardId] : null;
  if (!card) return;

  let tallyA = 0;
  let tallyB = 0;
  for (const seat of connectedSeats(state)) {
    const bid = state.bids[seat.playerId];
    if (!bid || !bid.locked) continue;
    if (bid.choice === "A") tallyA += bid.tokens;
    if (bid.choice === "B") tallyB += bid.tokens;
  }

  let winner: "A" | "B";
  if (tallyA !== tallyB) {
    winner = tallyA > tallyB ? "A" : "B";
  } else {
    // Tie (including all-pass): the Officer of the Watch's bid breaks it;
    // with no officer preference the ship defaults to option A.
    const officer = state.seats[state.officerSeat];
    const officerBid = officer ? state.bids[officer.playerId] : undefined;
    winner =
      officerBid && officerBid.choice !== "pass" ? officerBid.choice : "A";
  }

  const notes: string[] = [];
  if (timeoutPenalty) {
    clampResource(state, "morale", -1);
    clampResource(state, "oxygen", -1);
    notes.push(
      "⚠️ پایان زمان مذاکره: بلاتکلیفی و تاخیر در رای‌گیری موجب افت ۱ واحد روحیه و ۱ واحد اکسیژن شد.",
    );
  }
  let leader: Seat | null = null;
  let leaderTokens = -1;

  for (const seat of state.seats) {
    const bid = state.bids[seat.playerId];
    if (!bid || !bid.locked || !seat.connected) continue;
    if (bid.choice === winner) {
      seat.tokens = Math.max(0, seat.tokens - bid.tokens);
      seat.heroPoints += 1;
      if (bid.tokens > leaderTokens) {
        leader = seat;
        leaderTokens = bid.tokens;
      }
    } else if (bid.choice === "pass") {
      seat.tokens = Math.min(MAX_TOKENS, seat.tokens + 2);
    } else {
      seat.tokens = Math.min(MAX_TOKENS, seat.tokens + 1);
    }
  }

  if (leader) {
    leader.heroPoints += 2;
    leader.signCount += 1;
    state.chronicle.ledger.push({
      voyage: state.chronicle.voyage,
      round: state.round,
      cardTitle: card.title,
      choice: winner,
      choiceText: winner === "A" ? card.optionA : card.optionB,
      signedBy: leader.name,
    });
    notes.push(
      `${leader.name} led the winning vote and signs the ship's ledger — total responsibility for what follows.`,
    );
  } else {
    notes.push("No one championed the winning side. The ledger line stays blank.");
  }

  let effects = winner === "A" ? card.effectsA : card.effectsB;

  // Special card dynamic resolution hooks:
  if (card.id === "solar-storm" && winner === "B") {
    // 30% failure risk for Vahid Kazemi's extravehicular calibration
    const failed = Math.random() < 0.3;
    if (failed) {
      effects = {
        hull: -3,
        morale: -2,
        sticker: {
          id: "st-cazemi-grounded",
          label: "کاظمیِ زمین‌گیر",
          positive: false,
          target: "Bridge",
        },
        aftermath:
          "طوفان پیش‌بینی‌ناپذیر آنتن را متلاشی کرد؛ وحید کاظمی با سوختگی درجه دو به درمانگاه منتقل شد و آنتن هم از دست رفت. او تا پایان کمپین دیگر داوطلب هیچ کاری نخواهد شد.",
      };
      notes.push(
        "شکست عملیات پرریسک بیرونی (۳۰٪ احتمال خطا): وحید کاظمی دچار سوختگی شدید شد و برچسب «کاظمیِ زمین‌گیر» ثبت گردید.",
      );
    }
  }

  // The final dilemma resolves into an ending instead of a next round.
  if (card.id === FINAL_CARD_ID) {
    applyEffects(state, effects, notes);
    state.lastResolution = {
      cardId: card.id,
      winner,
      tally: { A: tallyA, B: tallyB },
      leaderName: leader?.name ?? null,
      effects,
      envelopeOpened: state.openedEnvelopeId,
      notes,
    };
    if (winner === "A") {
      endGame(state, "purge-escape");
    } else {
      let hullReq: number = hasSticker(state, "st-pods-charged")
        ? MIRACLE_REQ.hull - 2
        : MIRACLE_REQ.hull;
      if (hasSticker(state, "st-trust-engineer")) {
        hullReq = Math.max(1, hullReq - 1);
        notes.push("مهندس ارشد به پاس اعتمادی که در مانور قبلی به او داشتید، با تنظیم بهینه سازه، نیاز بدنه فرود را ۱ واحد کاهش داد.");
      }
      let oxyReq: number = MIRACLE_REQ.oxygen;
      if (hasSticker(state, "st-trust-pilot")) {
        oxyReq = Math.max(1, oxyReq - 1);
        notes.push("خلبان باتجربه به پاس اعتمادی که به او داشتید، شخصاً سکان کپسول‌ها را گرفت و با مانور سرشی مصرف اکسیژن را ۱ واحد کاهش داد.");
      }
      if (hasSticker(state, "st-cazemi-grounded")) {
        notes.push("وحید کاظمی به دلیل سوختگی و انزوای گذشته نتوانست در مهار نوسان موتورها کمکی کند.");
      }
      if (hasSticker(state, "st-whistleblower-source")) {
        notes.push("شبکه سوت‌زنی مهندسی، افت فشار پنهان سرور آمارا را ۳ دقیقه زودتر هشدار داد.");
      }
      const r = state.resources;
      const ok =
        r.bond >= MIRACLE_REQ.bond &&
        r.hull >= hullReq &&
        r.oxygen >= oxyReq;
      if (hasSticker(state, "st-pods-charged")) {
        notes.push("The pre-charged pods lower the strain of the half-power burn.");
      }
      endGame(state, ok ? "miracle-escape" : "burning-sky");
    }
    return;
  }

  state.openedEnvelopeId = null;
  applyEffects(state, effects, notes);

  // Legacy: a resolved dilemma never returns to the deck.
  if (!state.chronicle.retiredCards.includes(card.id)) {
    state.chronicle.retiredCards.push(card.id);
  }

  state.lastResolution = {
    cardId: card.id,
    winner,
    tally: { A: tallyA, B: tallyB },
    leaderName: leader?.name ?? null,
    effects,
    envelopeOpened: state.openedEnvelopeId,
    notes,
  };
  state.phase = "resolution";

  checkCatastrophe(state);
}

function maybeResolve(state: GameState) {
  if (state.stage !== "playing" || state.phase !== "debate") return;
  const seats = connectedSeats(state);
  if (seats.length === 0) return;
  const allLocked = seats.every((s) => state.bids[s.playerId]?.locked);
  if (allLocked) resolveDilemma(state);
}

function beginRound(state: GameState) {
  state.currentCardId = null;
  state.peekDone = false;
  state.bids = {};
  state.openedEnvelopeId = null;
  state.debateDeadline = null;

  // Rotate the Officer of the Watch to the next connected seat.
  if (state.seats.length > 0) {
    let next = state.officerSeat;
    for (let i = 0; i < state.seats.length; i++) {
      next = (next + 1) % state.seats.length;
      if (state.seats[next].connected) break;
    }
    state.officerSeat = next;
  }

  state.phase = "reveal";
}

function applyPresence(
  state: GameState,
  players: { playerId: string; name: string; connected: boolean }[],
) {
  const seen = new Set<string>();
  for (const p of players) {
    seen.add(p.playerId);
    let seat = seatOf(state, p.playerId);
    if (!seat) {
      // A returning player gets their old seat back by display name; this
      // survives tab refreshes, where the mesh peer id changes.
      const orphan = state.seats.find(
        (s) => !s.connected && s.name === p.name && !seen.has(s.playerId),
      );
      if (orphan) {
        delete state.bids[orphan.playerId];
        orphan.playerId = p.playerId;
        seat = orphan;
        seen.add(p.playerId);
      } else if (state.stage === "lobby") {
        seat = newSeat(p.playerId, p.name);
        state.seats.push(seat);
      } else {
        continue; // mid-game newcomers spectate
      }
    }
    seat.connected = p.connected;
    seat.name = p.name;
  }
  for (const seat of state.seats) {
    if (!seen.has(seat.playerId)) seat.connected = false;
  }
  if (state.stage === "lobby") {
    state.seats = state.seats.filter((s) => s.connected);
  }

  // Don't let a departure wedge the round.
  if (state.stage === "playing") {
    if (
      state.phase === "peek" &&
      !connectedSeats(state).some((s) => s.role === "technician")
    ) {
      state.peekDone = true;
      state.phase = "debate";
    }
    maybeResolve(state);
  }
}

/**
 * Apply one action from one player. Returns a new state (never mutates the
 * input); illegal or out-of-turn actions return the input state unchanged.
 */
export function applyAction(
  prev: GameState,
  playerId: string,
  action: GameAction,
): GameState {
  const state: GameState = structuredClone(prev);

  switch (action.type) {
    case "presence": {
      applyPresence(state, action.players);
      break;
    }

    case "choose-role": {
      if (state.stage !== "lobby") return prev;
      const seat = seatOf(state, playerId);
      if (!seat) return prev;
      if (
        action.role &&
        state.seats.some((s) => s.role === action.role && s.playerId !== playerId)
      ) {
        return prev;
      }
      seat.role = action.role;
      break;
    }

    case "start-game": {
      if (state.stage !== "lobby") return prev;
      if (!seatOf(state, playerId)) return prev;
      if (connectedSeats(state).length < 1) return prev;
      startVoyage(state);
      break;
    }

    case "draw-card": {
      if (state.stage !== "playing" || state.phase !== "reveal") return prev;
      if (!canModerate(state, playerId)) return prev;
      if (state.round === FINAL_ROUND) {
        state.currentCardId = FINAL_CARD_ID;
      } else {
        const cardId = state.deck.shift();
        if (!cardId) return prev;
        state.currentCardId = cardId;
      }
      const technicianOnline = connectedSeats(state).some(
        (s) => s.role === "technician",
      );
      state.peekDone = !technicianOnline;
      state.phase = technicianOnline ? "peek" : "debate";
      if (!technicianOnline) {
        state.debateDeadline = Date.now() + DEFAULT_DEBATE_SECONDS * 1000;
      }
      break;
    }

    case "peek-done": {
      if (state.stage !== "playing" || state.phase !== "peek") return prev;
      const seat = seatOf(state, playerId);
      if (seat?.role !== "technician") return prev;
      state.peekDone = true;
      state.phase = "debate";
      state.debateDeadline = Date.now() + DEFAULT_DEBATE_SECONDS * 1000;
      break;
    }

    case "set-bid": {
      if (state.stage !== "playing" || state.phase !== "debate") return prev;
      const seat = seatOf(state, playerId);
      if (!seat || !seat.connected) return prev;
      const tokens =
        action.choice === "pass"
          ? 0
          : Math.max(0, Math.min(seat.tokens, Math.floor(action.tokens)));
      const bid: Bid = { choice: action.choice, tokens, locked: true };
      state.bids[playerId] = bid;
      maybeResolve(state);
      break;
    }

    case "unlock-bid": {
      if (state.stage !== "playing" || state.phase !== "debate") return prev;
      const bid = state.bids[playerId];
      if (!bid) return prev;
      bid.locked = false;
      break;
    }

    case "continue": {
      if (state.stage !== "playing") return prev;
      if (!canModerate(state, playerId)) return prev;
      if (state.phase !== "resolution") return prev;
      state.round += 1;
      state.lastResolution = null;
      beginRound(state);
      break;
    }

    case "debate-timeout": {
      if (state.stage !== "playing" || state.phase !== "debate") return prev;
      for (const seat of connectedSeats(state)) {
        const bid = state.bids[seat.playerId];
        if (bid && !bid.locked) {
          bid.locked = true;
        } else if (!bid) {
          state.bids[seat.playerId] = { choice: "pass", tokens: 0, locked: true };
        }
      }
      resolveDilemma(state, true);
      break;
    }

    case "mission-timeout": {
      if (state.stage !== "playing") return prev;
      endGame(state, "time-exhausted");
      break;
    }

    case "toggle-timer-pause": {
      if (state.stage !== "playing") return prev;
      if (!canModerate(state, playerId)) return prev;
      const now = Date.now();
      if (!state.timerPaused) {
        state.timerPaused = true;
        state.pausedRemainingMissionMs = state.missionDeadline ? Math.max(0, state.missionDeadline - now) : null;
        state.pausedRemainingDebateMs = state.debateDeadline ? Math.max(0, state.debateDeadline - now) : null;
      } else {
        state.timerPaused = false;
        state.missionDeadline = state.pausedRemainingMissionMs != null ? now + state.pausedRemainingMissionMs : null;
        state.debateDeadline = state.pausedRemainingDebateMs != null ? now + state.pausedRemainingDebateMs : null;
        state.pausedRemainingMissionMs = null;
        state.pausedRemainingDebateMs = null;
      }
      break;
    }

    case "add-time": {
      if (state.stage !== "playing") return prev;
      if (!canModerate(state, playerId)) return prev;
      const addMs = (action.seconds || 30) * 1000;
      if (state.timerPaused) {
        if (state.pausedRemainingDebateMs != null) {
          state.pausedRemainingDebateMs += addMs;
        }
      } else {
        if (state.debateDeadline != null) {
          state.debateDeadline += addMs;
        }
      }
      break;
    }

    case "return-to-lobby": {
      if (state.stage !== "ended") return prev;
      if (!seatOf(state, playerId)) return prev;
      const fresh = createLobbyState(state.chronicle);
      fresh.seq = state.seq;
      fresh.seats = connectedSeats(state).map((s) => ({
        ...newSeat(s.playerId, s.name),
        role: s.role,
      }));
      fresh.seq = state.seq + 1;
      return fresh;
    }

    default:
      return prev;
  }

  // No-op actions (notably the periodic presence syncs) must return the
  // previous state's identity: hostApply skips broadcasting on identity, and
  // React effects keyed on the state would otherwise loop forever.
  if (JSON.stringify(state) === JSON.stringify(prev)) return prev;

  state.seq = prev.seq + 1;
  return state;
}
