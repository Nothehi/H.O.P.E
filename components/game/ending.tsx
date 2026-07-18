"use client";

import { RotateCcw, ScrollText, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AGENDAS, ENDINGS } from "@/lib/game/content";
import type { GameAction, GameState } from "@/lib/game/types";
import { ROLE_META } from "./meta";

export function EndingPanel({
  game,
  selfId,
  dispatch,
}: {
  game: GameState;
  selfId: string | null;
  dispatch: (action: GameAction) => void;
}) {
  const ending = game.endingId ? ENDINGS[game.endingId] : null;
  const scores = game.finalScores ?? [];
  const hero = scores[0];
  const mySeat = game.seats.find((s) => s.playerId === selfId);
  const voyageLedger = game.chronicle.ledger.filter(
    (l) => l.voyage === game.chronicle.voyage,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      {ending && (
        <div
          className={`space-y-3 rounded-xl border-2 p-6 text-center ${
            ending.survived
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-red-500/50 bg-red-500/5"
          }`}
        >
          <Badge variant={ending.survived ? "default" : "destructive"}>
            {ending.survived ? "THE CREW SURVIVES" : "VOYAGE LOST"}
          </Badge>
          <h2 className="text-2xl font-black">{ending.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {ending.text}
          </p>
        </div>
      )}

      {hero && (
        <div className="flex items-center justify-center gap-2 text-lg font-bold">
          <Trophy className="size-5 text-amber-500" />
          {hero.name} is crowned Hero of the Ship
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Crew</th>
              <th className="px-3 py-2">Secret agenda</th>
              <th className="px-3 py-2 text-right">Hero pts</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s) => {
              const agenda = s.agendaId ? AGENDAS[s.agendaId] : null;
              return (
                <tr key={s.playerId} className="border-t">
                  <td className="px-3 py-2 font-medium">
                    {s.name}
                    {s.role && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({ROLE_META[s.role].label})
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {agenda ? (
                      <span
                        className={
                          s.agendaMet
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground line-through"
                        }
                      >
                        {agenda.title} (+{agenda.points})
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {s.heroPoints}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-bold">
                    {s.total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {voyageLedger.length > 0 && (
        <div className="space-y-2 rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ScrollText className="size-4" />
            The Ship&apos;s Ledger — Voyage {game.chronicle.voyage}
          </div>
          {voyageLedger.map((l, i) => (
            <p key={i} className="text-xs text-muted-foreground">
              R{l.round} · {l.cardTitle} → Option {l.choice} —{" "}
              <span className="font-medium text-foreground">
                signed {l.signedBy}
              </span>
            </p>
          ))}
        </div>
      )}

      <div className="text-center">
        <Button
          size="lg"
          disabled={!mySeat}
          onClick={() => dispatch({ type: "return-to-lobby" })}
        >
          <RotateCcw className="size-4" />
          Return to the lobby — the Chronicle endures
        </Button>
      </div>
    </div>
  );
}
