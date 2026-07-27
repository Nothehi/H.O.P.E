"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  Cpu,
  Eye,
  Lock,
  Mail,
  PenLine,
  RefreshCw,
  RotateCcw,
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

export function ZoneVectorIcon({ zone }: { zone: string }) {
  switch (zone) {
    case "Bridge":
      return (
        <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18M3 12h18" />
          <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" />
        </svg>
      );
    case "Reactor":
      return (
        <svg className="size-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
          <path d="m4.93 4.93 2.83 2.83m8.48 8.48 2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
        </svg>
      );
    case "Engineering":
      return (
        <svg className="size-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4" />
          <rect x="8" y="8" width="8" height="8" rx="1" />
        </svg>
      );
    case "Life Support":
      return (
        <svg className="size-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04Z" />
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04Z" />
        </svg>
      );
    case "Medbay":
      return (
        <svg className="size-5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 2a1 1 0 0 1 2 0v8h8a1 1 0 0 1 0 2h-8v8a1 1 0 0 1-2 0v-8H3a1 1 0 0 1 0-2h8V2Z" />
        </svg>
      );
    case "Cargo Bay":
      return (
        <svg className="size-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
        </svg>
      );
    case "Crew Quarters":
      return (
        <svg className="size-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "AI Core":
      return (
        <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" fill="currentColor" fillOpacity="0.3" />
          <path d="M9 1v3m6-3v3M9 20v3m6-3v3M1 9h3m-3 6h3M20 9h3m-3 6h3" />
        </svg>
      );
    case "Pod Bay":
      return (
        <svg className="size-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-3.05 11a22.35 22.35 0 0 1-3.95 2z" />
        </svg>
      );
    default:
      return <Cpu className="size-5 text-primary" />;
  }
}

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

/** Flat Clean Cyberpunk Card component without 3D animations */
function CyberpunkCard({
  cardId,
  game,
}: {
  cardId: string;
  game: GameState;
}) {
  const card = CARDS[cardId];
  if (!card) return null;

  const res = game.lastResolution;
  const effects = res?.effects;
  const chosenText = res ? (res.winner === "A" ? card.optionA : card.optionB) : "";

  return (
    <div className="space-y-4 max-w-full overflow-hidden" dir="rtl">
      {/* CRISIS CARD FRONT */}
      <div className="frame-corners space-y-4 rounded-none border border-border bg-card p-4 md:p-5 shadow-xl max-w-full overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <ZoneVectorIcon zone={card.zone} />
            <h3 className="text-lg font-black text-primary tracking-wide truncate max-w-xs sm:max-w-md">{card.title}</h3>
          </div>
          <Badge variant="secondary" className="font-bold border border-secondary-foreground/40 shrink-0">
            بخش: {card.zone}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90 font-mono break-words max-w-full text-right">
          {card.narrative}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 pt-1 max-w-full">
          <div className="rounded-none border border-primary/40 bg-primary/5 p-3 text-right max-w-full overflow-hidden">
            <span className="font-mono text-xs font-black text-primary block mb-1">
              گزینه الف (OPTION A)
            </span>
            <p className="text-sm font-semibold leading-snug break-words">{card.optionA}</p>
          </div>
          <div className="rounded-none border border-secondary-foreground/40 bg-secondary/20 p-3 text-right max-w-full overflow-hidden">
            <span className="font-mono text-xs font-black text-secondary-foreground block mb-1">
              گزینه ب (OPTION B)
            </span>
            <p className="text-sm font-semibold leading-snug break-words">{card.optionB}</p>
          </div>
        </div>
      </div>

      {/* CONSEQUENCE / RESOLUTION SUMMARY PANEL (IF VOTED) */}
      {game.phase === "resolution" && res && (
        <div className="frame-corners space-y-3 rounded-none border border-primary/60 bg-[#121724] p-4 md:p-5 shadow-xl text-right max-w-full overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-primary/40 pb-2">
            <span className="text-sm font-black text-primary">نتیجه و پیامد نهایی بحران</span>
            <Badge className="font-mono font-bold bg-primary text-primary-foreground">
              گزینه {res.winner === "A" ? "الف" : "ب"} برنده شد
            </Badge>
          </div>

          <div className="space-y-2 font-mono text-sm">
            <div className="border border-border bg-background/80 p-3">
              <span className="text-xs text-muted-foreground block">تصمیم تایید شده توسط رای خدمه:</span>
              <p className="font-bold text-primary mt-1 leading-snug break-words">{chosenText}</p>
            </div>

            {effects?.aftermath && (
              <p className="text-xs italic text-foreground/90 bg-primary/10 border-r-2 border-primary p-2 leading-relaxed break-words">
                {effects.aftermath}
              </p>
            )}

            {effects && (
              <div className="space-y-1 pt-1">
                <span className="text-xs text-muted-foreground block">تاثیر بر سامانه‌های حیاتی:</span>
                <EffectsList effects={effects} />
              </div>
            )}

            {res.leaderName && (
              <p className="flex items-center gap-1.5 text-xs font-bold text-primary pt-2 border-t border-border/40">
                <PenLine className="size-4 ml-1 shrink-0" />
                امضا شده در دفترچه رسمی توسط: {res.leaderName}
              </p>
            )}
          </div>
        </div>
      )}
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

  // Auto-flip card to back side when phase transitions to resolution!
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (game.phase === "resolution") {
      setIsFlipped(true);
    } else {
      setIsFlipped(false);
    }
  }, [game.phase]);

  const connected = game.seats.filter((s) => s.connected);
  const lockedCount = connected.filter(
    (s) => game.bids[s.playerId]?.locked,
  ).length;

  /* --------------------------- reveal ---------------------------- */
  if (game.phase === "reveal") {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center" dir="rtl">
        <div className="frame-corners flex h-44 w-36 flex-col items-center justify-center border bg-card shadow-2xl p-4">
          <span className="font-mono text-xs font-bold text-secondary-foreground mb-2">// CRISIS_CARD</span>
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
        <CyberpunkCard
          cardId={card.id}
          game={game}
        />
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
        <CyberpunkCard
          cardId={card.id}
          game={game}
        />
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
    return (
      <div className="space-y-4" dir="rtl">
        <CyberpunkCard
          cardId={card.id}
          game={game}
        />
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
