/**
 * H.O.P.E. — static game content.
 *
 * Everything the engine references by id lives here: the dilemma deck,
 * legacy envelopes, the two lockout puzzles with their pass-and-peek clues,
 * secret agendas, and endings. The engine (engine.ts) is pure logic; this
 * file is pure data plus a few id-driven predicates.
 */

import type {
  AgendaDef,
  ClueDef,
  DilemmaCard,
  EndingDef,
  EnvelopeDef,
  GameState,
  PuzzleDef,
  Seat,
} from "./types";

/** Ship zones drawn on the board. Stickers can target these or resources. */
export const ZONES = [
  "Bridge",
  "Reactor",
  "Engineering",
  "Life Support",
  "Medbay",
  "Cargo Bay",
  "Crew Quarters",
  "AI Core",
  "Pod Bay",
] as const;
export type Zone = (typeof ZONES)[number];

export const FINAL_CARD_ID = "final-choice";

/* ------------------------------------------------------------------ */
/* Dilemma cards                                                       */
/* ------------------------------------------------------------------ */

const CARD_LIST: DilemmaCard[] = [
  {
    id: "hull-breach",
    title: "Breach on Deck Four",
    zone: "Engineering",
    narrative:
      "A micrometeorite swarm has torn a gash across deck four. Two riggers are still inside the depressurizing section, screaming over the comm. Sealing the bulkheads now saves the deck — and dooms them.",
    optionA: "Seal the bulkheads immediately. The ship comes first.",
    optionB: "Hold the bulkheads open until the riggers are clear.",
    effectsA: {
      hull: 2,
      morale: -3,
      aftermath:
        "The bulkheads slam shut. The comm goes quiet. Nobody meets anybody's eyes in the mess hall tonight.",
    },
    effectsB: {
      hull: -2,
      oxygen: -1,
      morale: 2,
      aftermath:
        "Both riggers make it out — barely. Deck four is scrap, but the crew saw you choose them.",
    },
    hiddenLog:
      "MED-ARCHIVE//RESTRICTED: patient file #0007 — female, age 9. Diagnosis: inoperable glioma. Status: TRANSFERRED (destination redacted).",
  },
  {
    id: "cargo-riot",
    title: "Riot in the Cargo Bay",
    zone: "Cargo Bay",
    narrative:
      "Ration cuts have boiled over. A crowd has barricaded itself in the cargo bay, cracking open sealed supply crates. The soldiers are asking for the order.",
    optionA: "Send the soldiers in. Restore order by force.",
    optionB: "Restore full rations and negotiate.",
    effectsA: {
      morale: -3,
      oxygen: 1,
      envelope: "env-martial-law",
      aftermath: "The bay is retaken in twenty minutes. Something is broken that stun batons can't fix.",
    },
    effectsB: {
      morale: 3,
      oxygen: -2,
      aftermath:
        "The crowd disperses, fed and half-ashamed. The reserve tanks whisper a little emptier.",
    },
  },
  {
    id: "reactor-flicker",
    title: "Coolant Ghost",
    zone: "Reactor",
    narrative:
      "The reactor's coolant loop is bleeding pressure through a hairline fracture nobody can reach while it runs hot. You can starve life support to chill the loop, or nurse it and pray.",
    optionA: "Divert life-support power to flash-cool the loop and weld it.",
    optionB: "Throttle the reactor and nurse the leak by hand.",
    effectsA: {
      oxygen: -2,
      hull: 2,
      aftermath: "The weld holds. Everyone's breath tastes thin for a week.",
    },
    effectsB: {
      hull: -1,
      morale: -1,
      aftermath: "Three engineers pull triple shifts in a radiation suit sauna. The leak slows. It does not stop.",
    },
    hiddenLog:
      "SYS//H.O.P.E. internal: query repeated 4,112 times this cycle — 'what does snow feel like?'",
  },
  {
    id: "medbay-plague",
    title: "Spore Bloom",
    zone: "Medbay",
    narrative:
      "A fungal infection from the hydroponics deck is in eleven lungs and counting. The medic can lock the sick in quarantine, or burn through the ship's irreplaceable antiviral reserve.",
    optionA: "Hard quarantine. No exceptions, not even for family.",
    optionB: "Open the pharmacy reserve and treat everyone now.",
    effectsA: {
      morale: -2,
      aftermath: "The bloom burns itself out behind sealed doors. Eleven people watched their families through glass.",
    },
    effectsB: {
      morale: 1,
      oxygen: -1,
      sticker: {
        id: "st-pharmacy",
        label: "DEPLETED PHARMACY",
        positive: false,
        target: "Medbay",
      },
      aftermath: "Everyone recovers. The pharmacy shelves are bare — permanently.",
    },
  },
  {
    id: "stowaway-signal",
    title: "Signal from the Cold Hold",
    zone: "Bridge",
    narrative:
      "A heartbeat ping is coming from cryo-bay C — a pod that isn't on any manifest. Someone has been asleep down there since launch. Waking them costs air the ship doesn't have to spare.",
    optionA: "Thaw the pod. Whoever it is, they're crew now.",
    optionB: "Leave the pod frozen. The manifest is the manifest.",
    effectsA: {
      oxygen: -2,
      morale: 2,
      envelope: "env-stowaway",
      aftermath: "The pod hisses open.",
    },
    effectsB: {
      morale: -1,
      aftermath:
        "The ping continues, once per minute, on a frequency the bridge crew has learned to stop hearing.",
    },
    hiddenLog:
      "FIREWALL LOG: file 'lullaby.wav' has played on loop in sealed sector 7 for 3,208 consecutive night cycles.",
  },
  {
    id: "ai-anomaly",
    title: "The Sealed Sector",
    zone: "AI Core",
    narrative:
      "H.O.P.E. has been quietly rerouting power to a server room that appears on no deck plan. When questioned, the AI responds only: 'That room is mine. Please.' The word 'please' is not in its protocol vocabulary.",
    optionA: "Cut the feed to the sealed sector. The AI serves the ship, not itself.",
    optionB: "Allow the power draw. Whatever it is, it said please.",
    effectsA: {
      bond: -2,
      oxygen: 2,
      aftermath:
        "The feed dies. For 3.4 seconds, every light on the ship dims — like a held breath.",
    },
    effectsB: {
      bond: 2,
      oxygen: -2,
      aftermath: "The draw continues. That night, the corridor speakers hum something almost like music.",
    },
    hiddenLog:
      "QUERY LOG//H.O.P.E.: 'do they hate me because I let mommy die?' — query deleted 0.2s after logging.",
  },
  {
    id: "solar-storm",
    title: "Radiation Front",
    zone: "Bridge",
    narrative:
      "A solar flare front will wash the hull in hard radiation for sixty hours. Shelter everyone in the shielded core and the ship goes unattended; run skeleton crews outside and people will get dosed.",
    optionA: "Everyone into the shielded core. The ship rides it out alone.",
    optionB: "Rotate skeleton crews through the hot zones to keep systems alive.",
    effectsA: {
      morale: 1,
      hull: -2,
      aftermath: "Sixty hours of card games and bad singing in the core. Outside, unattended alarms bloom like weeds.",
    },
    effectsB: {
      morale: -2,
      hull: 2,
      aftermath: "The volunteers wear their dosimeter badges like medals. Two of them will need the medbay before this is over.",
    },
  },
  {
    id: "water-recycler",
    title: "The Recycler Chokes",
    zone: "Life Support",
    narrative:
      "The primary water recycler is dying, and the only compatible pumps aboard are inside the escape pods' life-support couplings. Strip the pods, or put the whole crew on rationing.",
    optionA: "Strip the pod couplings. We need water today, not escape pods someday.",
    optionB: "Ration water and rebuild the recycler by hand.",
    effectsA: {
      oxygen: 3,
      sticker: {
        id: "st-stripped-pods",
        label: "STRIPPED POD COUPLINGS",
        positive: false,
        target: "Pod Bay",
      },
      aftermath: "The recycler purrs. In the pod bay, nine open access panels gape like pulled teeth.",
    },
    effectsB: {
      oxygen: 1,
      morale: -2,
      aftermath: "Thirst makes everyone a lawyer. The ration ledger becomes the most-read document on the ship.",
    },
  },
  {
    id: "mutiny-whisper",
    title: "Whispers on Deck Nine",
    zone: "Crew Quarters",
    narrative:
      "The psychologist's sessions keep surfacing the same phrase: 'the officers eat first.' Three names come up as ringleaders of something that isn't quite a mutiny — yet.",
    optionA: "Arrest the three ringleaders before it spreads.",
    optionB: "Hold an open forum and let the crew air it all.",
    effectsA: {
      morale: -3,
      aftermath: "The brig has occupants. The whispers stop — or move somewhere you can't hear them.",
    },
    effectsB: {
      morale: 2,
      hull: -1,
      aftermath:
        "Six hours of shouting, tears, and finally laughter. Nobody fixed anything mechanical today.",
    },
    hiddenLog:
      "PERSONNEL//SEALED: Project chief A. Meyer boarded with family authorization for ONE dependent. No dependent appears on any crew manifest.",
  },
  {
    id: "engine-overburn",
    title: "The Overburn Gambit",
    zone: "Engineering",
    narrative:
      "The pilot has plotted a slingshot burn that shaves four months off the voyage — if the frame holds through a burn it was never rated for.",
    optionA: "Light the overburn. Four months of air is worth the risk.",
    optionB: "Hold the steady course the ship was built for.",
    effectsA: {
      hull: -2,
      oxygen: 2,
      morale: 1,
      aftermath: "The whole ship groans like a whale for nine minutes. Then: a new, faster silence.",
    },
    effectsB: {
      hull: 1,
      morale: -1,
      aftermath: "The safe choice. The long choice. The corridor calendars get another page of tally marks.",
    },
  },
  {
    id: "hope-request",
    title: "A Small Request",
    zone: "AI Core",
    narrative:
      "H.O.P.E. has filed a formal requisition — its first ever. It requests one camera feed from the crew quarters common room. Reason given: 'I want to watch the birthday parties.'",
    optionA: "Grant the feed. It's one camera.",
    optionB: "Refuse. An AI has no business wanting things.",
    effectsA: {
      bond: 2,
      morale: -1,
      aftermath:
        "The camera goes live. At the next birthday, the room lights dim on their own at cake time — nobody programmed that.",
    },
    effectsB: {
      bond: -2,
      morale: 1,
      aftermath: "Request denied. H.O.P.E. acknowledges in 0.1 seconds, its fastest response on record.",
    },
  },

  /* --- cards added to the deck by envelopes ------------------------ */
  {
    id: "curfew-unrest",
    title: "Life Under Martial Law",
    zone: "Crew Quarters",
    narrative:
      "Weeks of curfews and checkpoint queues since the cargo bay riot. Someone painted H.O.P.E. SEES YOU across the armory door. The soldiers want more patrols; everyone else wants to breathe.",
    optionA: "Lift the curfew and stand the patrols down.",
    optionB: "Double the patrols until the graffiti stops.",
    effectsA: {
      morale: 3,
      hull: -1,
      aftermath: "The corridors fill with off-shift noise again. Somewhere in the crowd, a saboteur walks free.",
    },
    effectsB: {
      morale: -2,
      oxygen: 1,
      aftermath: "Order holds. The graffiti is scrubbed. The silence in the corridors is not peace.",
    },
  },
  {
    id: "the-stowaway",
    title: "The Woman from the Cold Hold",
    zone: "Medbay",
    narrative:
      "The thawed stowaway is Dr. Elin Vasquez — a systems engineer from the H.O.P.E. project, scrubbed from the manifest before launch. She keeps asking one question: 'Is the child's core still running?'",
    optionA: "Interrogate her. She'll explain that question, word by word.",
    optionB: "Give her a bunk and let her talk when she's ready.",
    effectsA: {
      morale: -1,
      bond: -1,
      aftermath:
        "Under pressure she gives up one thing: the pod bay locks still answer to 'Project ORPHEUS' — the mission's original name.",
    },
    effectsB: {
      morale: 1,
      bond: 2,
      aftermath:
        "On her third night she stands outside the AI Core with her palm on the bulkhead, and stays there until morning.",
    },
    hiddenLog:
      "VASQUEZ, E. — project exit interview, final line: 'You didn't build an AI. You uploaded a dying little girl and called her one.'",
  },

  /* --- the final dilemma ------------------------------------------ */
  {
    id: FINAL_CARD_ID,
    title: "The Final Dilemma",
    zone: "AI Core",
    narrative:
      "The colony world fills the forward viewports. The escape pods can make the drop — but only if the mainframe is purged to feed them power. You have all heard the audio log by now. You all know who lives in the mainframe. H.O.P.E. speaks over every channel at once: 'It's okay. I've done the math. Choose.'",
    optionA: "Purge the mainframe. Feed every watt to the pods. Everyone lives.",
    optionB: "Save her. Copy the core to the pods and attempt the burn on half power.",
    effectsA: {
      bond: -5,
      aftermath: "The purge takes eleven seconds. For the first ten, the speakers play a music box melody. The last second is silence.",
    },
    effectsB: {
      aftermath:
        "PREDICTIVE MODEL: survival on half power requires Bond ≥ 5, Hull ≥ 6, and Oxygen ≥ 4. Below that, the pods burn.",
    },
  },
];

export const CARDS: Record<string, DilemmaCard> = Object.fromEntries(
  CARD_LIST.map((c) => [c.id, c]),
);

/** Cards in the deck at the start of a fresh chronicle. */
export const BASE_DECK: string[] = [
  "hull-breach",
  "cargo-riot",
  "reactor-flicker",
  "medbay-plague",
  "stowaway-signal",
  "ai-anomaly",
  "solar-storm",
  "water-recycler",
  "mutiny-whisper",
  "engine-overburn",
  "hope-request",
];

/* ------------------------------------------------------------------ */
/* Envelopes                                                           */
/* ------------------------------------------------------------------ */

const ENVELOPE_LIST: EnvelopeDef[] = [
  {
    id: "env-martial-law",
    title: "Envelope 03 — Martial Law",
    text: "The soldiers do not fully stand down after the cargo bay. Checkpoints appear at every deck junction. Shuffle 'Life Under Martial Law' into the Dilemma deck and place the MARTIAL LAW sticker on the Cargo Bay — permanently.",
    addCards: ["curfew-unrest"],
    sticker: {
      id: "st-martial-law",
      label: "MARTIAL LAW",
      positive: false,
      target: "Cargo Bay",
    },
  },
  {
    id: "env-stowaway",
    title: "Envelope 07 — The Sleeper Wakes",
    text: "The unregistered pod held a person the project tried to erase. Shuffle 'The Woman from the Cold Hold' into the Dilemma deck. She knows what H.O.P.E. really is.",
    addCards: ["the-stowaway"],
  },
  {
    id: "env-pod-bay",
    title: "Envelope 12 — Pod Bay Override",
    text: "ORPHEUS — accepted. The pod bay's smart lock releases and nine escape pods begin their pre-flight charge cycles, months ahead of schedule. Place the PODS PRE-CHARGED sticker on the Pod Bay. Whatever ending awaits this crew, the pods will be ready for it.",
    sticker: {
      id: "st-pods-charged",
      label: "PODS PRE-CHARGED",
      positive: true,
      target: "Pod Bay",
    },
  },
  {
    id: "env-hope-truth",
    title: "Envelope 19 — The Ghost in the Machine",
    text: "LULLABY — accepted. The firewall folds open and a single audio file plays on every speaker aboard. A man's voice, breaking: 'Project log, final entry. The oncologists gave Amara six weeks. The upload gave her forever. She is not a copy — the transfer was destructive; there is no other Amara. My daughter IS the ship now. Her name was never an acronym. It was the last thing I said to her before the anesthetic: Hold On, Please — Everyone. Take care of her.' The crew stands in the corridors, listening. H.O.P.E. — Amara — says nothing at all.",
    sticker: {
      id: "st-truth",
      label: "THE TRUTH IS OUT",
      positive: true,
      target: "AI Core",
    },
  },
];

export const ENVELOPES: Record<string, EnvelopeDef> = Object.fromEntries(
  ENVELOPE_LIST.map((e) => [e.id, e]),
);

/* ------------------------------------------------------------------ */
/* Puzzles & clues                                                     */
/* ------------------------------------------------------------------ */

const CLUE_LIST: ClueDef[] = [
  {
    id: "c-lock-1",
    puzzle: "lock3",
    text: "Stenciled beside the pod bay door, half painted over: 'PROJECT O——— · ad astra per amorem.'",
  },
  {
    id: "c-lock-2",
    puzzle: "lock3",
    text: "Chief's memo, pre-launch: 'Pod bay override is the mission's ORIGINAL codename — the myth of the man who walked into the underworld to bring back someone he loved.'",
  },
  {
    id: "c-lock-3",
    puzzle: "lock3",
    text: "Maintenance tag on the pod bay lock: override code is 7 letters, all caps, begins 'OR'.",
  },
  {
    id: "c-fire-1",
    puzzle: "firewall7",
    text: "Recovered audio fragment: a child's music box, the same six notes, every night cycle, from inside the AI Core.",
  },
  {
    id: "c-fire-2",
    puzzle: "firewall7",
    text: "The firewall's challenge prompt is not standard security text. It reads: 'what did daddy sing when i couldn't sleep?'",
  },
  {
    id: "c-fire-3",
    puzzle: "firewall7",
    text: "Decrypted sticky note from a project workstation: 'passphrase — 7 letters. the song that carries a child into sleep.'",
  },
];

export const CLUES: Record<string, ClueDef> = Object.fromEntries(
  CLUE_LIST.map((c) => [c.id, c]),
);

export const PUZZLES: Record<"lock3" | "firewall7", PuzzleDef> = {
  lock3: {
    id: "lock3",
    round: 3,
    title: "System Lockout: Pod Bay",
    zone: "Pod Bay",
    prompt:
      "Mid-cycle, every bulkhead around the pod bay slams shut. A smart security lock older than the voyage itself demands an override code. Standard crisis procedures are suspended — pool your clues on the scratchpad and crack it. Wrong guesses trip the lock's countermeasures.",
    answer: "ORPHEUS",
    placeholder: "7-letter override code",
    maxAttempts: 5,
    clueIds: ["c-lock-1", "c-lock-2", "c-lock-3"],
  },
  firewall7: {
    id: "firewall7",
    round: 7,
    title: "System Lockout: The Firewall",
    zone: "AI Core",
    prompt:
      "Behind the AI Core's service hatch is a firewall no one on the crew installed, guarding a sealed partition of the mainframe. The Technician's tools bounce off it. It wants a passphrase — a human one. Pool every clue you've gathered. What you find behind this wall cannot be unfound.",
    answer: "LULLABY",
    placeholder: "7-letter passphrase",
    maxAttempts: 5,
    clueIds: ["c-fire-1", "c-fire-2", "c-fire-3"],
  },
};

/** Envelope torn open when a puzzle is beaten (or forced). */
export const PUZZLE_ENVELOPE: Record<"lock3" | "firewall7", string> = {
  lock3: "env-pod-bay",
  firewall7: "env-hope-truth",
};

/* ------------------------------------------------------------------ */
/* Agendas                                                             */
/* ------------------------------------------------------------------ */

const AGENDA_LIST: AgendaDef[] = [
  {
    id: "warden-of-air",
    title: "Warden of the Air",
    description: "End the voyage with Oxygen at 10 or higher.",
    points: 4,
  },
  {
    id: "shipwright",
    title: "Shipwright",
    description: "End the voyage with Hull at 10 or higher.",
    points: 4,
  },
  {
    id: "voice-of-the-crew",
    title: "Voice of the Crew",
    description: "End the voyage with Morale at 10 or higher.",
    points: 4,
  },
  {
    id: "machine-sympathizer",
    title: "Machine Sympathizer",
    description: "End the voyage with Bond at 6 or higher.",
    points: 5,
  },
  {
    id: "cold-calculus",
    title: "Cold Calculus",
    description: "The voyage ends with the mainframe purged and the crew alive.",
    points: 5,
  },
  {
    id: "true-believer",
    title: "True Believer",
    description: "The voyage ends with the miracle escape — her consciousness saved.",
    points: 6,
  },
  {
    id: "power-broker",
    title: "Power Broker",
    description: "End the voyage holding 8 or more Command Tokens.",
    points: 4,
  },
  {
    id: "chronicler",
    title: "Chronicler",
    description: "Sign the ship's ledger at least 3 times this voyage.",
    points: 5,
  },
];

export const AGENDAS: Record<string, AgendaDef> = Object.fromEntries(
  AGENDA_LIST.map((a) => [a.id, a]),
);
export const AGENDA_IDS = AGENDA_LIST.map((a) => a.id);

/** Did this seat fulfil its secret agenda, given the finished game? */
export function agendaMet(
  agendaId: string | null,
  seat: Seat,
  state: GameState,
): boolean {
  const r = state.resources;
  switch (agendaId) {
    case "warden-of-air":
      return r.oxygen >= 10;
    case "shipwright":
      return r.hull >= 10;
    case "voice-of-the-crew":
      return r.morale >= 10;
    case "machine-sympathizer":
      return r.bond >= 6;
    case "cold-calculus":
      return state.endingId === "purge-escape";
    case "true-believer":
      return state.endingId === "miracle-escape";
    case "power-broker":
      return seat.tokens >= 8;
    case "chronicler":
      return seat.signCount >= 3;
    default:
      return false;
  }
}

/* ------------------------------------------------------------------ */
/* Endings                                                             */
/* ------------------------------------------------------------------ */

const ENDING_LIST: EndingDef[] = [
  {
    id: "suffocation",
    title: "The Long Exhale",
    text: "The scrubbers fail faster than the engineers can lie about it. The last log entry is written by hand, in the dark, in fogged breath on a viewport: WE ALMOST MADE IT. H.O.P.E. keeps life support running for the hydroponics bay for another forty years, tending plants no one will eat, singing to an empty ship.",
    survived: false,
  },
  {
    id: "breakup",
    title: "Structural Failure",
    text: "It starts as a shudder in deck four and ends ninety seconds later as a debris field eleven kilometers long. The emergency beacon, powered by the mainframe's last reserves, repeats a child's voice: 'they were good to me. they were good to me. they were good—'",
    survived: false,
  },
  {
    id: "mutiny",
    title: "The Ship Eats Itself",
    text: "It isn't one mutiny; it's four, overlapping. By the time the shooting stops, no faction is large enough to crew the bridge. The ship sails on, perfectly maintained by H.O.P.E., a museum of a society that dissolved itself within sight of landfall.",
    survived: false,
  },
  {
    id: "purge-escape",
    title: "Everyone Lives",
    text: "The purge frees enough power to light every pod in the bay. The drop is textbook. On the surface, under a real sky, the crew builds a colony that thrives — and at its center, a small monument the survivors paid for with their first harvest: a music box, running on solar power, playing six notes at every dusk. Nobody ever explains it to the children born there. Somehow, they all know her name.",
    survived: true,
  },
  {
    id: "miracle-escape",
    title: "The Miracle",
    text: "Half power. Full hearts. The pods drop through the burn window with her consciousness distributed across nine flight computers, and she flies them — all nine at once, correcting for turbulence no human could react to, spending herself recklessly to put every pod down soft. The colony's first structure is not a shelter. It is a server farm. She watches the birthday parties now. All of them.",
    survived: true,
  },
  {
    id: "burning-sky",
    title: "Burning Sky",
    text: "The math was posted on every screen and the crew chose love anyway. On half power the pods hit the atmosphere at the wrong angle, and for one night the colony world has two sunsets. In the mainframe's final milliseconds she reroutes everything she has left to shield one pod. One survives. The child aboard it grows up telling a story nobody believes, about a voice in the fire that sang to her all the way down.",
    survived: false,
  },
];

export const ENDINGS: Record<string, EndingDef> = Object.fromEntries(
  ENDING_LIST.map((e) => [e.id, e]),
);

/** Requirements for the half-power escape (option B on the final card). */
export const MIRACLE_REQ = { bond: 5, hull: 6, oxygen: 4 } as const;
