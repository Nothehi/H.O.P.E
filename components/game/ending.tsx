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
    <div className="mx-auto max-w-2xl space-y-6 py-4" dir="rtl">
      {ending && (
        <div
          className={`frame-corners space-y-3 rounded-none border p-6 text-center ${
            ending.survived
              ? "border-emerald-500/60 bg-emerald-500/10"
              : "border-destructive/60 bg-destructive/10"
          }`}
        >
          <Badge variant={ending.survived ? "default" : "destructive"}>
            {ending.survived ? "خدمه سفینه زنده ماندند" : "سفر به شکست انجامید"}
          </Badge>
          <h2 className="text-2xl font-black text-primary break-words whitespace-normal text-balance">{ending.title}</h2>
          <p className="text-sm leading-relaxed text-foreground/90">
            {ending.text}
          </p>
        </div>
      )}

      {hero && (
        <div className="flex items-center justify-center gap-2 text-lg font-black text-primary">
          <Trophy className="size-5 text-amber-500" />
          {hero.name} به عنوان قهرمان ماندگار این سفر تاج‌گذاری شد!
        </div>
      )}

      <div className="overflow-x-auto rounded-none border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border">
            <tr>
              <th className="px-3 py-2">نام خدمه</th>
              <th className="px-3 py-2">ماموریت محرمانه</th>
              <th className="px-3 py-2 text-left">امتیاز قهرمانی</th>
              <th className="px-3 py-2 text-left">مجموع کل</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s) => {
              const agenda = s.agendaId ? AGENDAS[s.agendaId] : null;
              return (
                <tr key={s.playerId} className="border-t border-border">
                  <td className="px-3 py-2 font-bold">
                    {s.name}
                    {s.role && (
                      <span className="mr-1 text-xs text-muted-foreground">
                        ({ROLE_META[s.role].label})
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {agenda ? (
                      <span
                        className={
                          s.agendaMet
                            ? "text-emerald-400 font-bold"
                            : "text-muted-foreground line-through"
                        }
                      >
                        {agenda.title} (+{agenda.points})
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-left font-mono">
                    {s.heroPoints}
                  </td>
                  <td className="px-3 py-2 text-left font-mono font-bold text-primary">
                    {s.total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {voyageLedger.length > 0 && (
        <div className="space-y-2 rounded-none border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-primary">
            <ScrollText className="size-4" />
            دفترچه رسمی ثبت عواقب سفینه — سفر شماره {game.chronicle.voyage}
          </div>
          {voyageLedger.map((l, i) => (
            <p key={i} className="text-xs text-muted-foreground">
              دور {l.round} · {l.cardTitle} ← گزینه {l.choice === "A" ? "الف" : "ب"} —{" "}
              <span className="font-bold text-foreground">
                امضا شده توسط {l.signedBy}
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
          <RotateCcw className="size-4 ml-1" />
          بازگشت به لابی — تاریخچه سفینه باقی می‌ماند
        </Button>
      </div>
    </div>
  );
}
