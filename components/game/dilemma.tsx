"use client";

import { useState } from "react";
import {
  Check,
  ChevronRight,
  Eye,
  Lock,
  Mail,
  PenLine,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CARDS, ENVELOPES } from "@/lib/game/content";
import type {
  CardEffects,
  GameAction,
  GameState,
} from "@/lib/game/types";
import { RESOURCE_META, fmtDelta } from "./meta";

export function EffectsList({ effects }: { effects: CardEffects }) {
  const keys = ["oxygen", "hull", "morale", "bond"] as const;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {keys.map((k) => {
        const v = effects[k];
        if (!v) return null;
        const meta = RESOURCE_META[k];
        const Icon = meta.icon;
        return (
          <Badge key={k} variant="outline" className="gap-1 font-mono">
            <Icon className={`size-3 ${meta.textClass}`} />
            {fmtDelta(v)}
          </Badge>
        );
      })}
      {effects.sticker && (
        <Badge variant="outline" className="gap-1">
          sticker: {effects.sticker.label}
        </Badge>
      )}
      {effects.envelope && (
        <Badge variant="outline" className="gap-1">
          <Mail className="size-3" /> opens a sealed envelope
        </Badge>
      )}
      {!keys.some((k) => effects[k]) && !effects.sticker && !effects.envelope && (
        <span className="text-xs text-muted-foreground">no direct effects</span>
      )}
    </div>
  );
}

export function EnvelopeReveal({ envelopeId }: { envelopeId: string }) {
  const env = ENVELOPES[envelopeId];
  if (!env) return null;
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-amber-500/60 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
        <Mail className="size-4" />
        {env.title}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{env.text}</p>
    </div>
  );
}

function CardFace({ cardId }: { cardId: string }) {
  const card = CARDS[cardId];
  if (!card) return null;
  return (
    <div className="frame-corners space-y-3 rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold">{card.title}</h3>
        <Badge variant="secondary" className="ml-auto">
          {card.zone}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {card.narrative}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/30 p-3">
          <span className="font-mono text-xs font-bold text-primary">
            OPTION A
          </span>
          <p className="mt-1 text-sm">{card.optionA}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <span className="font-mono text-xs font-bold text-primary">
            OPTION B
          </span>
          <p className="mt-1 text-sm">{card.optionB}</p>
        </div>
      </div>
    </div>
  );
}

export function DilemmaPanel({
  game,
  selfId,
  dispatch,
}: {
  game: GameState;
  selfId: string | null;
  dispatch: (action: GameAction) => void;
}) {
  const mySeat = game.seats.find((s) => s.playerId === selfId);
  const officer = game.seats[game.officerSeat];
  const iAmOfficer = officer?.playerId === selfId;
  const iModerate = iAmOfficer || (officer && !officer.connected && !!mySeat);
  const card = game.currentCardId ? CARDS[game.currentCardId] : null;

  // The panel is keyed by currentCardId in GameView, so this local bid form
  // state resets automatically each round.
  const myBid = selfId ? game.bids[selfId] : undefined;
  const [choice, setChoice] = useState<"A" | "B" | "pass">("pass");
  const [tokens, setTokens] = useState(0);

  const connected = game.seats.filter((s) => s.connected);
  const lockedCount = connected.filter(
    (s) => game.bids[s.playerId]?.locked,
  ).length;

  /* --------------------------- reveal ---------------------------- */
  if (game.phase === "reveal") {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="frame-corners flex h-40 w-28 items-center justify-center border bg-card">
          <span className="font-mono text-2xl font-black tracking-widest text-primary">
            H.O.P.E.
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Round {game.round} · {game.deck.length} cards left in the Dilemma deck
          <br />
          <span className="font-medium text-foreground">
            {officer?.name ?? "…"}
          </span>{" "}
          holds the watch.
        </p>
        {iModerate ? (
          <Button size="lg" onClick={() => dispatch({ type: "draw-card" })}>
            <ChevronRight className="size-4" />
            {game.round >= 8 ? "Face the Final Dilemma" : "Draw the crisis card"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Waiting for the Officer of the Watch to draw…
          </p>
        )}
      </div>
    );
  }

  if (!card) return null;

  /* ---------------------------- peek ----------------------------- */
  if (game.phase === "peek") {
    const iAmTech = mySeat?.role === "technician";
    return (
      <div className="space-y-4">
        <CardFace cardId={card.id} />
        {iAmTech ? (
          <div className="space-y-3 rounded-xl border border-emerald-500/50 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <Eye className="size-4" />
              Predictive systems — your eyes only. Lie if you like.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <span className="font-mono text-xs font-bold">IF A WINS</span>
                <EffectsList effects={card.effectsA} />
              </div>
              <div className="space-y-1.5">
                <span className="font-mono text-xs font-bold">IF B WINS</span>
                <EffectsList effects={card.effectsB} />
              </div>
            </div>
            {card.hiddenLog && (
              <p className="rounded-md bg-black/80 p-2 font-mono text-xs text-emerald-400">
                ▸ RECOVERED FRAGMENT: {card.hiddenLog}
              </p>
            )}
            <Button size="sm" onClick={() => dispatch({ type: "peek-done" })}>
              Close the console
            </Button>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            The Technician is hacking the predictive systems… what they tell you
            next may or may not be true.
          </p>
        )}
      </div>
    );
  }

  /* --------------------------- debate ---------------------------- */
  if (game.phase === "debate") {
    return (
      <div className="space-y-4">
        <CardFace cardId={card.id} />
        <div className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Cast your Command Tokens</span>
            <Badge variant="secondary">
              {lockedCount}/{connected.length} locked
            </Badge>
          </div>

          {!mySeat ? (
            <p className="text-sm text-muted-foreground">
              You are spectating this voyage.
            </p>
          ) : myBid?.locked ? (
            <div className="flex items-center gap-3">
              <Badge className="gap-1">
                <Lock className="size-3" />
                bid locked
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: "unlock-bid" })}
              >
                <Unlock className="size-3.5" />
                Change bid
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                {(["A", "B", "pass"] as const).map((c) => (
                  <Button
                    key={c}
                    variant={choice === c ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setChoice(c)}
                  >
                    {c === "pass" ? "Pass (+2 tokens)" : `Option ${c}`}
                  </Button>
                ))}
              </div>
              {choice !== "pass" && (
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={mySeat.tokens}
                    value={Math.min(tokens, mySeat.tokens)}
                    onChange={(e) => setTokens(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-16 text-right font-mono text-sm">
                    {Math.min(tokens, mySeat.tokens)}/{mySeat.tokens}
                  </span>
                </div>
              )}
              <Button
                className="w-full"
                onClick={() =>
                  dispatch({
                    type: "set-bid",
                    choice,
                    tokens: choice === "pass" ? 0 : Math.min(tokens, mySeat.tokens),
                  })
                }
              >
                <Lock className="size-4" />
                Lock it in
              </Button>
              <p className="text-xs text-muted-foreground">
                Winners spend their tokens; the losing side is compensated. The
                heaviest bidder on the winning side signs the ledger — by name,
                forever.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            {connected.map((s) => (
              <Badge
                key={s.playerId}
                variant={game.bids[s.playerId]?.locked ? "default" : "outline"}
                className="gap-1"
              >
                {game.bids[s.playerId]?.locked && <Check className="size-3" />}
                {s.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------- resolution --------------------------- */
  if (game.phase === "resolution" && game.lastResolution) {
    const res = game.lastResolution;
    const effects = res.effects;
    const chosenText = res.winner === "A" ? card.optionA : card.optionB;
    return (
      <div className="space-y-4">
        <CardFace cardId={card.id} />
        <div className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Badge className="font-mono">OPTION {res.winner} WINS</Badge>
            <span className="font-mono text-xs text-muted-foreground">
              A:{res.tally.A} vs B:{res.tally.B} tokens
            </span>
          </div>
          <p className="text-sm font-medium">{chosenText}</p>
          {effects.aftermath && (
            <p className="text-sm italic text-muted-foreground">
              {effects.aftermath}
            </p>
          )}
          <EffectsList effects={effects} />
          {res.leaderName && (
            <p className="flex items-center gap-1.5 text-sm">
              <PenLine className="size-3.5" />
              <span className="font-semibold">{res.leaderName}</span> signed the
              ship&apos;s ledger.
            </p>
          )}
          {res.notes.map((n, i) => (
            <p key={i} className="text-xs text-muted-foreground">
              {n}
            </p>
          ))}
        </div>
        {game.openedEnvelopeId && (
          <EnvelopeReveal envelopeId={game.openedEnvelopeId} />
        )}
        {iModerate ? (
          <Button className="w-full" onClick={() => dispatch({ type: "continue" })}>
            <ChevronRight className="size-4" />
            Continue to round {game.round + 1}
          </Button>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            The Officer of the Watch will advance the round.
          </p>
        )}
      </div>
    );
  }

  return null;
}
