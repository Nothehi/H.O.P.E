"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Cpu, Key, KeyRound, Lightbulb, ShieldAlert, Terminal, Zap, Activity, Radio, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CLUES, PUZZLES } from "@/lib/game/content";
import type { GameAction, GameState } from "@/lib/game/types";
import { EnvelopeReveal } from "./dilemma";
import { soundFx } from "@/lib/game/audio";

/* ------------------------------------------------------------------ */
/* Interactive Visual & Audio Puzzles                                  */
/* ------------------------------------------------------------------ */

/** Visual Circuit Fuse Grid for Round 3 (Pod Bay - lock3) */
function PodBayCircuitGrid({
  data,
  disabled,
  onInteract,
}: {
  data: Record<string, any>;
  disabled: boolean;
  onInteract: (patch: Record<string, any>) => void;
}) {
  const fuses = {
    A1: data.A1 ?? true,
    A2: data.A2 ?? false,
    B1: data.B1 ?? true,
    B2: data.B2 ?? false,
  };

  const toggleFuse = (key: keyof typeof fuses) => {
    if (disabled) return;
    soundFx.playFuseClick();
    onInteract({ [key]: !fuses[key] });
  };

  const activeCount = Object.values(fuses).filter(Boolean).length;
  const isStable = fuses.A1 && fuses.B2 && !fuses.A2 && !fuses.B1;

  return (
    <div className="space-y-3 rounded-none border border-cyan-500/40 bg-card/90 p-4 font-mono">
      <div className="flex items-center justify-between text-xs text-cyan-400">
        <span className="flex items-center gap-1 font-bold">
          <Zap className="size-4 text-cyan-400" />
          مدار فیوزها و آشیانه کپسول‌ها (Interactive SVG Circuit)
        </span>
        <Badge variant={isStable ? "default" : "outline"} className={isStable ? "bg-emerald-500 text-black font-bold" : "text-cyan-400"}>
          {isStable ? "ولتاژ پایدار (کد ORPHEUS آماده است)" : `فعال: ${activeCount}/4 فیوز`}
        </Badge>
      </div>

      <div className="flex justify-center py-2">
        <svg className="w-full max-w-md h-36 border border-cyan-950 bg-slate-950 rounded p-2" viewBox="0 0 400 120">
          {/* Background Grid Lines */}
          <line x1="20" y1="60" x2="380" y2="60" stroke={isStable ? "#10b981" : "#00f0ff"} strokeWidth="2" strokeDasharray="4" />
          <line x1="100" y1="20" x2="100" y2="100" stroke="#1e293b" strokeWidth="1" />
          <line x1="200" y1="20" x2="200" y2="100" stroke="#1e293b" strokeWidth="1" />
          <line x1="300" y1="20" x2="300" y2="100" stroke="#1e293b" strokeWidth="1" />

          {/* Node Connections */}
          <circle cx="50" cy="60" r="8" fill="#00f0ff" />
          <text x="45" y="90" fill="#00f0ff" fontSize="10">IN</text>

          {/* Fuse A1 */}
          <g onClick={() => toggleFuse("A1")} className="cursor-pointer">
            <rect x="90" y="35" width="50" height="50" rx="4" fill={fuses.A1 ? "#064e3b" : "#1e293b"} stroke={fuses.A1 ? "#10b981" : "#475569"} strokeWidth="2" />
            <text x="105" y="65" fill={fuses.A1 ? "#10b981" : "#94a3b8"} fontSize="12" fontWeight="bold">A1</text>
          </g>

          {/* Fuse A2 */}
          <g onClick={() => toggleFuse("A2")} className="cursor-pointer">
            <rect x="160" y="35" width="50" height="50" rx="4" fill={fuses.A2 ? "#064e3b" : "#1e293b"} stroke={fuses.A2 ? "#10b981" : "#475569"} strokeWidth="2" />
            <text x="175" y="65" fill={fuses.A2 ? "#10b981" : "#94a3b8"} fontSize="12" fontWeight="bold">A2</text>
          </g>

          {/* Fuse B1 */}
          <g onClick={() => toggleFuse("B1")} className="cursor-pointer">
            <rect x="230" y="35" width="50" height="50" rx="4" fill={fuses.B1 ? "#064e3b" : "#1e293b"} stroke={fuses.B1 ? "#10b981" : "#475569"} strokeWidth="2" />
            <text x="245" y="65" fill={fuses.B1 ? "#10b981" : "#94a3b8"} fontSize="12" fontWeight="bold">B1</text>
          </g>

          {/* Fuse B2 */}
          <g onClick={() => toggleFuse("B2")} className="cursor-pointer">
            <rect x="300" y="35" width="50" height="50" rx="4" fill={fuses.B2 ? "#064e3b" : "#1e293b"} stroke={fuses.B2 ? "#10b981" : "#475569"} strokeWidth="2" />
            <text x="315" y="65" fill={fuses.B2 ? "#10b981" : "#94a3b8"} fontSize="12" fontWeight="bold">B2</text>
          </g>

          <circle cx="370" cy="60" r="8" fill={isStable ? "#10b981" : "#fcee0a"} />
          <text x="355" y="90" fill="#fcee0a" fontSize="10">PODS</text>
        </svg>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        💡 بر اساس سرنخ‌های ناهمگون: فیوزهای مناسب را کلیک کنید تا جریان ولتاژ پایدار شود، سپس کد را در کنسول تایپ کنید.
      </p>
    </div>
  );
}

/** Interactive Reactor Oscilloscope Sliders for Round 6 (Reactor - reactor6) */
function ReactorOscilloscope({
  data,
  disabled,
  onInteract,
}: {
  data: Record<string, any>;
  disabled: boolean;
  onInteract: (patch: Record<string, any>) => void;
}) {
  const freq = data.freq ?? 50;
  const amp = data.amp ?? 30;

  return (
    <div className="space-y-3 rounded-none border border-amber-500/40 bg-card/90 p-4 font-mono">
      <div className="flex items-center justify-between text-xs text-amber-400">
        <span className="flex items-center gap-1 font-bold">
          <Activity className="size-4 text-amber-400" />
          نوسان‌نمای صوتی خنک‌کننده راکتور (Audio Frequency Oscilloscope)
        </span>
        <Badge variant="outline" className="text-amber-400 border-amber-500/50">
          فرکانس: {freq} Hz | دامنه: {amp} %
        </Badge>
      </div>

      <div className="flex justify-center py-2">
        <svg className="w-full max-w-md h-32 border border-amber-950 bg-slate-950 rounded p-2" viewBox="0 0 400 100">
          <path
            d={`M 0 50 Q 50 ${50 - amp} 100 50 T 200 50 T 300 50 T 400 50`}
            fill="none"
            stroke="#fcee0a"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[11px] text-amber-400 block">تنظیم فرکانس (Frequency Audio):</label>
          <input
            type="range"
            min="10"
            max="100"
            value={freq}
            disabled={disabled}
            onChange={(e) => {
              const val = Number(e.target.value);
              soundFx.playReactorHum(val);
              onInteract({ freq: val });
            }}
            className="w-full accent-amber-400"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-amber-400 block">تنظیم دامنه (Amplitude):</label>
          <input
            type="range"
            min="5"
            max="45"
            value={amp}
            disabled={disabled}
            onChange={(e) => onInteract({ amp: Number(e.target.value) })}
            className="w-full accent-amber-400"
          />
        </div>
      </div>
    </div>
  );
}

/** Amara Voice Frequency Spectrum Matcher for Round 9 (AI Core - firewall9) */
function VoiceSpectrumMatcher({
  data,
  disabled,
  onInteract,
}: {
  data: Record<string, any>;
  disabled: boolean;
  onInteract: (patch: Record<string, any>) => void;
}) {
  const harmonics = data.harmonics ?? 3;

  return (
    <div className="space-y-3 rounded-none border border-purple-500/40 bg-card/90 p-4 font-mono">
      <div className="flex items-center justify-between text-xs text-purple-400">
        <span className="flex items-center gap-1 font-bold">
          <Radio className="size-4 text-purple-400 animate-pulse" />
          طیف‌سنج صوتی و هارمونیک آمارا (Amara's LULLABY Synthesizer)
        </span>
        <Badge variant="outline" className="text-purple-400 border-purple-500/50 flex items-center gap-1">
          <Volume2 className="size-3" />
          هارمونیک: {harmonics}/6 نوت
        </Badge>
      </div>

      <div className="flex justify-center items-end gap-2 h-28 bg-slate-950 border border-purple-950 p-3 rounded">
        {[40, 75, 30, 90, 60, 80].map((val, idx) => (
          <div
            key={idx}
            className="w-8 bg-purple-500/80 hover:bg-purple-400 transition-all rounded-t cursor-pointer hover:scale-105"
            style={{ height: `${(val * harmonics) / 6}%` }}
            onClick={() => {
              if (disabled) return;
              soundFx.playLullabyHarmonic(idx);
              onInteract({ harmonics: (idx % 6) + 1 });
            }}
          />
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        🎵 باندهای فرکانسی را لمس کنید تا نغمه لالایی صوتی آمارا نواخته شود و کد LULLABY تایید گردد.
      </p>
    </div>
  );
}

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

  const handleInteract = (patch: Record<string, any>) => {
    dispatch({ type: "puzzle-interact", data: patch });
  };

  const handleSubmit = () => {
    if (!guess.trim()) return;
    
    if (guess.trim().toUpperCase() !== def.answer) {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 400);
      soundFx.playAccessDenied();
      toast.error("کد نامعتبر است! سیستم خطا داد.");
    } else {
      soundFx.playAccessGranted();
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

      {/* RENDER INTERACTIVE VISUAL & AUDIO PUZZLE GRAPHIC */}
      {!done && (
        <div className="my-3">
          {puzzle.puzzleId === "lock3" && (
            <PodBayCircuitGrid
              data={puzzle.interactiveData || {}}
              disabled={!mySeat}
              onInteract={handleInteract}
            />
          )}
          {puzzle.puzzleId === "reactor6" && (
            <ReactorOscilloscope
              data={puzzle.interactiveData || {}}
              disabled={!mySeat}
              onInteract={handleInteract}
            />
          )}
          {puzzle.puzzleId === "firewall9" && (
            <VoiceSpectrumMatcher
              data={puzzle.interactiveData || {}}
              disabled={!mySeat}
              onInteract={handleInteract}
            />
          )}
        </div>
      )}

      {/* Technician Clues / Personal Fragments */}
      {!done && (
        myClues.length > 0 ? (
          <div className="space-y-2.5 rounded-none border border-red-500/60 bg-red-950/20 p-4 text-right max-w-full overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.15)] frame-corners-red">
            <div className="flex items-center justify-between text-xs font-bold text-red-400">
              <span className="flex items-center gap-2">
                <Lightbulb className="size-4 shrink-0 text-red-500 animate-pulse" />
                قطعه‌سرنخ محرمانه شما (این مدرک اختصاصاً در اختیار شماست):
              </span>
              <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-950/60 font-mono text-[10px]">
                {myClues.length} سرنخ امنیتی
              </Badge>
            </div>
            {myClues.map((id) => (
              <div
                key={id}
                className="text-sm font-mono text-foreground font-bold bg-[#0B1117]/90 p-3 border border-red-500/40 break-words leading-relaxed shadow-inner"
              >
                🔑 « {CLUES[id]?.text} »
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground font-mono">
              💡 برای حل پازل، این سرنخ را با اطلاعات سایر خدمه در تب «ارتباطات» ترکیب کنید.
            </p>
          </div>
        ) : (
          <div className="space-y-2 rounded-none border border-amber-500/40 bg-amber-950/20 p-3.5 text-right max-w-full">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Key className="size-4 shrink-0 text-amber-400" />
              سرنخ‌های این قفل در اختیار سایر خدمه است!
            </div>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">
              شما مدرک مستقیمی برای این قفل ندارید. هم‌تیمی‌های شما سرنخ‌های متنی را دارند — از طریق تب <span className="text-primary font-bold">«ارتباطات»</span> با آن‌ها هماهنگ شوید و یافته‌هایشان را در کنسول مشترک زیر یادداشت کنید.
            </p>
          </div>
        )
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
              onChange={(e) => {
                soundFx.playKeypress();
                editPad(e.target.value);
              }}
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
                  onChange={(e) => {
                    soundFx.playKeypress();
                    setGuess(e.target.value);
                  }}
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
