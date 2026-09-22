"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Hourglass,
  Pause,
  Play,
  Plus,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GameAction, GameState } from "@/lib/game/types";
import { soundFx } from "@/lib/game/audio";

function formatSeconds(totalSecs: number): string {
  if (totalSecs <= 0) return "00:00";
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Hook to compute live remaining seconds based on an absolute deadline
 */
export function useRemainingSeconds(
  deadline: number | null | undefined,
  paused: boolean = false,
  pausedRemainingMs: number | null | undefined = null,
) {
  const [remaining, setRemaining] = useState<number>(() => {
    if (paused && pausedRemainingMs != null) {
      return Math.max(0, Math.ceil(pausedRemainingMs / 1000));
    }
    if (!deadline) return 0;
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  });

  useEffect(() => {
    if (paused) {
      if (pausedRemainingMs != null) {
        setRemaining(Math.max(0, Math.ceil(pausedRemainingMs / 1000)));
      }
      return;
    }

    if (!deadline) {
      setRemaining(0);
      return;
    }

    const update = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
    };

    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [deadline, paused, pausedRemainingMs]);

  return remaining;
}

/**
 * Top-bar Mission Timer Badge (زمان کل ماموریت سفینه)
 */
export function MissionCountdownBadge({ game }: { game: GameState }) {
  const remaining = useRemainingSeconds(
    game.missionDeadline,
    game.timerPaused,
    game.pausedRemainingMissionMs,
  );

  if (game.stage !== "playing" || !game.missionDeadline) return null;

  const isCritical = remaining < 60;
  const isWarning = remaining < 300 && !isCritical;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold border transition-colors ${
        isCritical
          ? "border-red-500/80 bg-red-950/60 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
          : isWarning
          ? "border-amber-500/60 bg-amber-950/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
          : "border-cyan-500/40 bg-cyan-950/20 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.15)]"
      }`}
      title="زمان باقی‌مانده از کل ماموریت سفینه تا رسیدن به مدار مقصد"
      dir="rtl"
    >
      <Clock className={`size-3.5 ${isCritical ? "text-red-400 animate-spin" : isWarning ? "text-amber-400" : "text-cyan-400"}`} />
      <span className="hidden sm:inline text-[11px] font-sans font-medium text-foreground/70">
        ماموریت:
      </span>
      <span className="tracking-wider">{formatSeconds(remaining)}</span>
      {game.timerPaused && (
        <span className="text-[10px] text-amber-400 font-sans font-normal">(متوقف)</span>
      )}
    </div>
  );
}

/**
 * Prominent In-Dilemma Debate Phase Countdown Box (زمان‌سنج مذاکره و رای‌گیری بحران)
 */
export function DebateCountdown({
  game,
  isModerator,
  dispatch,
}: {
  game: GameState;
  isModerator: boolean;
  dispatch: (action: GameAction) => void;
}) {
  const remaining = useRemainingSeconds(
    game.debateDeadline,
    game.timerPaused,
    game.pausedRemainingDebateMs,
  );

  const lastBeepSec = useRef<number | null>(null);

  // Audio heartbeat / tick on last 10 seconds
  useEffect(() => {
    if (game.stage !== "playing" || game.phase !== "debate" || game.timerPaused) {
      return;
    }
    if (remaining > 0 && remaining <= 10 && lastBeepSec.current !== remaining) {
      lastBeepSec.current = remaining;
      soundFx.playTimerTick(remaining <= 5);
    }
  }, [remaining, game.stage, game.phase, game.timerPaused]);

  if (game.phase !== "debate" || !game.debateDeadline) return null;

  const isUrgent = remaining <= 15;
  const isWarning = remaining > 15 && remaining <= 30;

  // Percentage for the urgency progress bar (assuming 90s standard base)
  const percent = Math.min(100, Math.max(0, (remaining / 90) * 100));

  return (
    <div
      className={`rounded-none border p-3 md:p-4 transition-all duration-300 relative overflow-hidden ${
        isUrgent
          ? "border-red-500/80 bg-red-950/30 shadow-[0_0_25px_rgba(239,68,68,0.25)] animate-pulse"
          : isWarning
          ? "border-amber-500/60 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          : "border-primary/40 bg-card/60 shadow-[0_0_15px_rgba(252,238,10,0.05)]"
      }`}
      dir="rtl"
    >
      {/* Background cyber accent line */}
      <div
        className={`absolute top-0 right-0 h-1 transition-all duration-300 ${
          isUrgent ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : isWarning ? "bg-amber-400" : "bg-primary"
        }`}
        style={{ width: `${percent}%` }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-none border ${
              isUrgent
                ? "bg-red-500/20 border-red-500 text-red-400"
                : isWarning
                ? "bg-amber-500/20 border-amber-500 text-amber-400"
                : "bg-primary/10 border-primary/40 text-primary"
            }`}
          >
            <Hourglass className={`size-5 ${isUrgent ? "animate-spin" : ""}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black tracking-widest text-muted-foreground uppercase">
                // DEBATE_COUNTDOWN
              </span>
              {game.timerPaused && (
                <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-[10px] py-0 px-1 font-mono">
                  متوقف شده
                </Badge>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`font-mono text-2xl sm:text-3xl font-black tracking-wider ${
                  isUrgent ? "text-red-400 drop-shadow-[0_0_8px_#ef4444]" : isWarning ? "text-amber-400" : "text-primary"
                }`}
              >
                {formatSeconds(remaining)}
              </span>
              <span className="text-xs text-muted-foreground font-sans">
                تا قفل خودکار و تصمیم‌گیری نهایی
              </span>
            </div>
          </div>
        </div>

        {/* Host / Moderator Controls */}
        {isModerator && (
          <div className="flex items-center gap-1.5 mr-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs border-primary/40 font-mono hover:bg-primary/10"
              onClick={() => dispatch({ type: "toggle-timer-pause" })}
              title={game.timerPaused ? "ادامه شمارش" : "توقف موقت زمان"}
            >
              {game.timerPaused ? (
                <>
                  <Play className="size-3 text-emerald-400" />
                  <span className="hidden sm:inline">ادامه</span>
                </>
              ) : (
                <>
                  <Pause className="size-3 text-amber-400" />
                  <span className="hidden sm:inline">توقف</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs border-primary/40 font-mono hover:bg-primary/10"
              onClick={() => dispatch({ type: "add-time", seconds: 30 })}
              title="افزودن ۳۰ ثانیه زمان بیشتر برای مذاکره"
            >
              <Plus className="size-3 text-cyan-400" />
              <span>+۳۰ ثانیه</span>
            </Button>
          </div>
        )}
      </div>

      {/* Penalty Warning banner */}
      <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
        <AlertTriangle className={`size-3.5 shrink-0 ${isUrgent ? "text-red-400 animate-pulse" : "text-amber-400"}`} />
        <span>
          در صورت اتمام زمان بدون اجماع، بلاتکلیفی باعث جریمه سفینه (<strong className="text-foreground">-۱ روحیه</strong> و <strong className="text-foreground">-۱ اکسیژن</strong>) و ثبت خودکار آرا خواهد شد.
        </span>
      </div>
    </div>
  );
}
