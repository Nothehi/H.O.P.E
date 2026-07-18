# H.O.P.E. — The Legacy Board Game

An online, persistent, legacy-style board game for **3–8 players**: cooperative
survival aboard a dying generation ship, laced with social deduction and
competitive self-interest. Built on real-time **peer-to-peer WebRTC rooms**
(via [PeerJS](https://peerjs.com)) — no game server holds any state. UI built
with **Tailwind CSS v4** and **shadcn/ui** on **Next.js**.

## Playing

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000, sign the manifest with your name, and **Launch a
ship**. Others join with the ship code. To test locally, open more tabs (or
private windows) with different names.

### How a voyage works

- Everyone picks one of 8 departments (Commander, Engineer, Medic, Soldier,
  **Technician**, Psychologist, Pilot, Scientist) in the lobby.
- A voyage is 8 rounds. Each round the rotating **Officer of the Watch** draws
  a crisis card with two choices (A/B) whose exact effects on **Oxygen, Hull,
  Morale** (and the hidden **Bond** meter) are printed "on the back".
- Only the **Technician** may peek at the back — and may freely lie about it.
- Players debate (use the Comms tab) and secretly bid **Command Tokens** on
  A, B, or pass. Winners spend their tokens; the heaviest winning bidder
  **signs the ship's ledger by name, forever**, and earns hero points.
- Rounds 3 and 7 suspend voting for **system lockout puzzles**: clues are
  dealt asymmetrically at voyage start, so players must share them aloud and
  crack the code together on a shared scratchpad.
- Round 7's firewall hides the campaign's central reveal; round 8 is the
  final dilemma it sets up.
- Any resource hitting zero ends the voyage catastrophically. Whoever scores
  highest (hero points + secret agenda) is crowned **Hero of the Ship**.

### Legacy mechanics

The **Chronicle** persists across voyages in `localStorage` (keyed by ship
code) on every player's browser — whoever hosts next resumes the campaign:

- resolved dilemma cards are retired forever; envelopes shuffle new cards in
- permanent **Chronicle stickers** scar (or bless) resource tracks and zones
- every ledger signature, opened envelope, ending, and Hero is recorded

## Architecture

### Rooms: host-based full mesh

- **Mesh peers** — each member owns a PeerJS peer namespaced by room
  (`wt-room-<roomId>-<random>`); all traffic flows over direct
  `DataConnection`s (full mesh), no server round-trips.
- **The beacon** — one member owns `wt-room-<roomId>-beacon` and introduces
  joiners to the member list. If the beacon owner leaves, the
  lexicographically-first member claims it (host migration).
- A 5-second heartbeat (`ping`/`pong`, 15-second timeout) detects silently
  dropped peers alongside PeerJS `close`/`error` events; the client
  auto-reconnects to the signaling broker if it drops.

### The game layer

- `lib/game/types.ts` — JSON-serializable `GameState`, actions, chronicle.
- `lib/game/content.ts` — cards, envelopes, puzzles, clues, agendas, endings.
- `lib/game/engine.ts` — a pure reducer. The **beacon owner is the game
  authority**: clients broadcast `GameAction`s over the mesh's `app` channel,
  the host applies them and broadcasts the full `GameState` (sequence-numbered,
  last-writer-wins). Because every client retains the latest state, a migrated
  host resumes the game seamlessly, and refreshing rebinds your seat by name.
- `lib/game/chronicle.ts` — Chronicle checkpointing to `localStorage`.
- `hooks/use-game.ts` — glue between the mesh and the engine.
- `components/game/` — board, lobby, dilemma phases, puzzles, ending, comms.

Hidden information (card backs, secret agendas, clues, bids) is present in the
broadcast state but gated by the UI — the trust model is a group of friends at
a table, same as the physical game.

The reducer is UI- and network-free, so entire voyages can be simulated
headlessly by calling `applyAction(state, playerId, action)` in a loop.

### Signaling

The signaling broker defaults to the public PeerJS cloud. To self-host, run
[PeerServer](https://github.com/peers/peerjs-server) and pass `host`/`port`/
`path` options where `new Peer(...)` is called in `hooks/use-peer-room.ts`.

> Note: WebRTC needs `localhost` or HTTPS. Direct connectivity depends on
> NAT traversal via the default public STUN servers; symmetric NATs may need a
> TURN server (configurable via PeerJS `config`).
