"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Cpu, KeyRound, Lightbulb, ShieldAlert, Terminal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CLUES, PUZZLES } from "@/lib/game/content";
import type { GameAction, GameState } from "@/lib/game/types";
import { EnvelopeReveal } from "./dilemma";

export function PuzzlePanel({
  game,
  selfId,
  dispatch,
}: {
  game: GameState;
  selfId: string | null;
  dispatch: (action: GameAction) => void;
}) {
  const puzzle = game.puzzle;
  const mySeat = game.seats.find((s) => s.playerId === selfId);
  const officer = game.seats[game.officerSeat];
  const iModerate =
    officer?.playerId === selfId || (officer && !officer.connected && !!mySeat);

  const [guess, setGuess] = useState("");
  const [isGlitching, setIsGlitching] = useState(false);
  const [pad, setPad] = useState(puzzle?.scratchpad ?? "");
  const padRef = useRef<HTMLTextAreaElement>(null);
  const padTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (document.activeElement !== padRef.current) {
      setPad(puzzle?.scratchpad ?? "");
    }
  }, [puzzle?.scratchpad]);

  if (!puzzle) return null;
  const def = PUZZLES[puzzle.puzzleId];
  const myClues = (mySeat?.clueIds ?? []).filter(
    (id) => CLUES[id]?.puzzle === puzzle.puzzleId,
  );
  const done = puzzle.solved || puzzle.bypassed;
  const attemptsLeft = def.maxAttempts - puzzle.attempts;

  const editPad = (text: string) => {
    setPad(text);
    if (padTimer.current) clearTimeout(padTimer.current);
    padTimer.current = setTimeout(
      () => dispatch({ type: "scratchpad", text }),
      400,
    );
  };

  const handleSubmit = () => {
    if (!guess.trim()) return;
    
    if (guess.trim().toUpperCase() !== def.answer) {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 400);
      toast.error("کد نامعتبر است! سیستم خطا داد.");
    }
    
    dispatch({ type: "guess", guess });
    setGuess("");
  };

  return (
    <div className="space-y-5 max-w-full overflow-hidden text-right" dir="rtl">
      {/* Cyberpunk Hacking Header */}
      <div className={`frame-corners space-y-4 rounded-none border border-destructive/80 p-4 md:p-5 shadow-2xl max-w-full overflow-hidden text-right transition-colors ${isGlitching ? 'animate-glitch border-destructive bg-destructive/20' : 'bg-card'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="size-5 text-destructive animate-pulse shrink-0" />
            <h3 className="text-lg font-black uppercase text-primary tracking-wider break-words whitespace-normal text-balance">
              {def.title} — قفل امنیتی سیستم
            </h3>
          </div>
          <Badge variant="secondary" className="font-mono text-secondary-foreground shrink-0">
            بخش: {def.zone}
          </Badge>
        </div>

        {/* Cyberpunk Matrix Buffer Graphic */}
        <div className="font-mono text-[11px] text-muted-foreground flex items-center gap-2 bg-background/80 p-2 border border-border overflow-x-auto max-w-full" dir="ltr">
          <Cpu className="size-4 text-secondary-foreground shrink-0" />
          <span className="truncate">BREACH_SEQUENCE: 7A · 1C · BD · 55 · E9 · 1C · EF</span>
        </div>

        <p className="text-sm leading-relaxed text-foreground/90 font-mono text-right break-words max-w-full">
          {def.prompt}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Badge variant={attemptsLeft <= 2 ? "destructive" : "outline"} className="font-mono font-bold">
            فرصت‌های باقی‌مانده: {attemptsLeft} از {def.maxAttempts}
          </Badge>
          {puzzle.lastGuess && !puzzle.solved && (
            <span className="font-mono text-xs text-destructive font-bold break-all">
              [رد شد]: {puzzle.lastGuess}
            </span>
          )}
        </div>
      </div>

      {/* Technician Clues / Personal Fragments */}
      {myClues.length > 0 && !done && (
        <div className="space-y-2 rounded-none border border-primary/50 bg-primary/10 p-4 text-right max-w-full overflow-hidden">
          <div className="flex items-center gap-2 text-sm font-bold text-primary">
            <Lightbulb className="size-4 shrink-0" />
            قطعه‌کد رمزنگاری‌شده شما — این سرنخ را فقط شما دارید:
          </div>
          {myClues.map((id) => (
            <p key={id} className="text-sm font-mono text-foreground font-semibold bg-background/60 p-2 border border-primary/30 break-words leading-relaxed">
              « {CLUES[id].text} »
            </p>
          ))}
        </div>
      )}

      {!done && (
        <>
          {/* Shared Team Terminal / Scratchpad */}
          <div className="space-y-2 text-right max-w-full">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary-foreground">
              <Terminal className="size-4 shrink-0" />
              کنسول داده‌های مشترک خدمه (پایگاه یادداشت همزمان)
            </label>
            <Textarea
              ref={padRef}
              value={pad}
              onChange={(e) => editPad(e.target.value)}
              onBlur={() => dispatch({ type: "scratchpad", text: pad })}
              placeholder="root@hope-os:~$ سرنخ‌های خود را مابین خدمه ترکیب کنید و فرضیات را بنویسید..."
              className="min-h-32 font-mono text-sm border-secondary-foreground/40 bg-input focus-visible:border-secondary-foreground text-right p-3 leading-relaxed"
              disabled={!mySeat}
              dir="rtl"
            />
          </div>

          {/* Interactive Decryption Console / Command Line */}
          <div className="space-y-2 text-right max-w-full">
            <label className="text-xs font-bold uppercase tracking-wider text-primary block">
              ورودی کنسول رمزگشایی (کد نهایی):
            </label>
            <div className="flex flex-col sm:flex-row gap-2 max-w-full">
              <div className="relative flex-1 max-w-full">
                <span className="absolute left-3 top-2.5 font-mono text-xs text-muted-foreground select-none">
                  #&gt;
                </span>
                <Input
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder={def.placeholder || "وارد کردن پین یا کد..."}
                  className="font-mono uppercase pl-8 text-right tracking-widest"
                  disabled={!mySeat}
                  dir="rtl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit();
                    }
                  }}
                />
              </div>
              <Button
                disabled={!mySeat || !guess.trim()}
                className="shrink-0"
                onClick={handleSubmit}
              >
                <KeyRound className="size-4 ml-1 shrink-0" />
                تست و اجرای کد
              </Button>
            </div>
          </div>

          {iModerate && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={() => dispatch({ type: "bypass" })}
            >
              دور زدن اضطراری قفل (صدمه دائمی به بدنه)
            </Button>
          )}
        </>
      )}

      {done && (
        <div className="space-y-4 max-w-full overflow-hidden text-right">
          {puzzle.solved ? (
            <div className="p-4 border border-emerald-500 bg-emerald-500/10 text-center space-y-1">
              <p className="text-base font-bold text-emerald-400">
                ✓ دسترسی تایید شد — {puzzle.solvedBy} کد را شکست:
              </p>
              <p className="font-mono text-xl font-black tracking-widest text-emerald-400">
                {def.answer}
              </p>
            </div>
          ) : (
            <div className="p-4 border border-destructive bg-destructive/10 text-center">
              <p className="text-sm font-bold text-destructive">
                ✖ قفل باز نشد. آسیب دائمی به سیستم سفینه وارد گشت.
              </p>
            </div>
          )}
          {game.lastResolution?.notes.map((n, i) => (
            <p key={i} className="text-center text-xs text-muted-foreground break-words">
              {n}
            </p>
          ))}
          {game.openedEnvelopeId && (
            <EnvelopeReveal envelopeId={game.openedEnvelopeId} />
          )}
          {iModerate ? (
            <Button
              className="w-full"
              onClick={() => dispatch({ type: "continue" })}
            >
              <ChevronRight className="size-4 ml-1" />
              ادامه به دور {game.round + 1}
            </Button>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              افسر کشیک دور جدید را آغاز خواهد کرد.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
