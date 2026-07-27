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
            {meta.label}: {fmtDelta(v)}
          </Badge>
        );
      })}
      {effects.sticker && (
        <Badge variant="outline" className="gap-1">
          برچسب: {effects.sticker.label}
        </Badge>
      )}
      {effects.envelope && (
        <Badge variant="outline" className="gap-1">
          <Mail className="size-3" /> باز کردن پاکت محرمانه
        </Badge>
      )}
      {!keys.some((k) => effects[k]) && !effects.sticker && !effects.envelope && (
        <span className="text-xs text-muted-foreground">بدون تاثیر مستقیم</span>
      )}
    </div>
  );
}

export function EnvelopeReveal({ envelopeId }: { envelopeId: string }) {
  const env = ENVELOPES[envelopeId];
  if (!env) return null;
  return (
    <div className="space-y-2 rounded-none border border-dashed border-amber-500/60 bg-amber-500/5 p-4" dir="rtl">
      <div className="flex items-center gap-2 font-bold text-amber-500">
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
    <div className="frame-corners space-y-3 rounded-none border bg-card p-5" dir="rtl">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-black text-primary">{card.title}</h3>
        <Badge variant="secondary" className="mr-auto font-bold">
          بخش: {card.zone}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">
        {card.narrative}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 pt-1">
        <div className="rounded-none border border-border/80 bg-muted/40 p-3">
          <span className="font-mono text-xs font-black text-primary">
            گزینه الف (OPTION A)
          </span>
          <p className="mt-1 text-sm font-semibold">{card.optionA}</p>
        </div>
        <div className="rounded-none border border-border/80 bg-muted/40 p-3">
          <span className="font-mono text-xs font-black text-secondary-foreground">
            گزینه ب (OPTION B)
          </span>
          <p className="mt-1 text-sm font-semibold">{card.optionB}</p>
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
      <div className="flex flex-col items-center gap-4 py-10 text-center" dir="rtl">
        <div className="frame-corners flex h-40 w-32 items-center justify-center border bg-card shadow-xl">
          <span className="font-mono text-3xl font-black tracking-widest text-primary drop-shadow-[0_0_8px_rgba(252,238,10,0.4)]">
            H.O.P.E.
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          دور {game.round} · {game.deck.length} کارت بحران مانده در دسته
          <br />
          <span className="font-bold text-primary">
            {officer?.name ?? "..."}
          </span>{" "}
          مسئولیت کشیک این دور را بر عهده دارد.
        </p>
        {iModerate ? (
          <Button size="lg" onClick={() => dispatch({ type: "draw-card" })}>
            <ChevronRight className="size-4 ml-1" />
            {game.round >= 8 ? "مواجهه با بحران نهایی" : "کشیدن کارت بحران جدید"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            منتظر افسر کشیک برای رو کردن بحران جدید...
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
      <div className="space-y-4" dir="rtl">
        <CardFace cardId={card.id} />
        {iAmTech ? (
          <div className="space-y-3 rounded-none border border-secondary-foreground/60 bg-secondary/30 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-secondary-foreground">
              <Eye className="size-4" />
              سیستم‌های پیش‌بینی عواقب — مخصوص چشم‌های تکنسین. می‌توانید حقیقت یا دروغ بگویید!
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 border border-border p-2 bg-background/50">
                <span className="font-mono text-xs font-bold text-primary">در صورت پیروزی گزینه الف:</span>
                <EffectsList effects={card.effectsA} />
              </div>
              <div className="space-y-1.5 border border-border p-2 bg-background/50">
                <span className="font-mono text-xs font-bold text-secondary-foreground">در صورت پیروزی گزینه ب:</span>
                <EffectsList effects={card.effectsB} />
              </div>
            </div>
            {card.hiddenLog && (
              <p className="p-2 font-mono text-xs text-secondary-foreground bg-background border border-secondary-foreground/40">
                ▸ قطعه داده بازیابی شده: {card.hiddenLog}
              </p>
            )}
            <Button size="sm" onClick={() => dispatch({ type: "peek-done" })}>
              بستن کنسول تکنسین
            </Button>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            تکنسین در حال هک سیستم‌های پیش‌بینی عواقب است... آنچه او به شما می‌گوید ممکن است راست یا دروغ باشد.
          </p>
        )}
      </div>
    );
  }

  /* --------------------------- debate ---------------------------- */
  if (game.phase === "debate") {
    return (
      <div className="space-y-4" dir="rtl">
        <CardFace cardId={card.id} />
        <div className="space-y-3 rounded-none border border-border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-primary">خرج توکن‌های فرماندهی (رای‌گیری)</span>
            <Badge variant="secondary" className="font-mono">
              {lockedCount}/{connected.length} رای قفل شده
            </Badge>
          </div>

          {!mySeat ? (
            <p className="text-sm text-muted-foreground">
              شما تماشاگر این سفر هستید.
            </p>
          ) : myBid?.locked ? (
            <div className="flex items-center gap-3">
              <Badge className="gap-1 bg-primary text-primary-foreground font-bold">
                <Lock className="size-3 ml-1" />
                رای شما قفل شد
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: "unlock-bid" })}
              >
                <Unlock className="size-3.5 ml-1" />
                تغییر رای
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
                    {c === "pass" ? "انصراف (+۲ توکن)" : c === "A" ? "گزینه الف" : "گزینه ب"}
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
                  <span className="w-20 text-left font-mono text-sm font-bold text-primary">
                    {Math.min(tokens, mySeat.tokens)} / {mySeat.tokens}
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
                <Lock className="size-4 ml-1" />
                ثبت و قفل کردن رای
              </Button>
              <p className="text-xs text-muted-foreground">
                برندگان توکن‌های خود را خرج می‌کنند؛ سمت بازنده غرامت دریافت می‌کند.
                بیشترین رای‌دهنده در سمت پیروز، دفترچه رسمی سفینه را برای همیشه امضا می‌کند.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            {connected.map((s) => (
              <Badge
                key={s.playerId}
                variant={game.bids[s.playerId]?.locked ? "default" : "outline"}
                className="gap-1 font-bold"
              >
                {game.bids[s.playerId]?.locked && <Check className="size-3 ml-0.5" />}
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
      <div className="space-y-4" dir="rtl">
        <CardFace cardId={card.id} />
        <div className="space-y-3 rounded-none border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Badge className="font-mono font-bold">گزینه {res.winner === "A" ? "الف" : "ب"} پیروز شد</Badge>
            <span className="font-mono text-xs text-muted-foreground">
              الف: {res.tally.A} در برابر ب: {res.tally.B} توکن
            </span>
          </div>
          <p className="text-sm font-bold text-primary">{chosenText}</p>
          {effects.aftermath && (
            <p className="text-sm italic text-muted-foreground bg-muted/30 p-2">
              {effects.aftermath}
            </p>
          )}
          <EffectsList effects={effects} />
          {res.leaderName && (
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <PenLine className="size-3.5 ml-1 text-primary" />
              <span className="font-bold text-primary">{res.leaderName}</span> دفترچه رسمی سفینه را امضا نمود.
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
            <ChevronRight className="size-4 ml-1" />
            ادامه به دور {game.round + 1}
          </Button>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            افسر کشیک دور را ادامه خواهد داد.
          </p>
        )}
      </div>
    );
  }

  return null;
}
