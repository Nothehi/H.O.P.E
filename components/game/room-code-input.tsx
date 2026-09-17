"use client";

import React, { useRef, useEffect, useState } from "react";
import { soundFx } from "@/lib/game/audio";
import { toEnglishDigits } from "@/lib/protocol";
import { Clipboard, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface RoomCodeInputProps {
  value: string;
  onChange: (val: string) => void;
  onEnter?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function RoomCodeInput({
  value,
  onChange,
  onEnter,
  disabled = false,
  autoFocus = false,
}: RoomCodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [persianWarning, setPersianWarning] = useState(false);

  // We have 6 cells for HOPE room codes
  const chars = Array.from({ length: 6 }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const sanitizeInput = (raw: string): { clean: string; hadPersian: boolean } => {
    const withDigits = toEnglishDigits(raw);
    const hadPersian = /[\u0600-\u06FF]/.test(raw);
    const clean = withDigits.toLowerCase().replace(/[^a-z0-9]/g, "");
    return { clean, hadPersian };
  };

  const handlePaste = (pastedText: string) => {
    const { clean, hadPersian } = sanitizeInput(pastedText);
    if (hadPersian && !clean) {
      setPersianWarning(true);
      toast.warning("کد سفینه شامل حروف و اعداد انگلیسی است. کیبورد را روی انگلیسی قرار دهید.");
      return;
    }
    const truncated = clean.slice(0, 6);
    onChange(truncated);
    try {
      soundFx.playKeypress();
    } catch {}

    const targetIdx = Math.min(truncated.length, 5);
    setTimeout(() => {
      inputsRef.current[targetIdx]?.focus();
    }, 10);
  };

  const handleChange = (index: number, val: string) => {
    const prevChar = chars[index]?.toLowerCase() || "";
    const { clean, hadPersian } = sanitizeInput(val);

    if (hadPersian) {
      setPersianWarning(true);
    } else if (persianWarning) {
      setPersianWarning(false);
    }

    if (!clean) {
      // Cleared by user
      const newChars = [...chars];
      newChars[index] = "";
      onChange(newChars.join(""));
      return;
    }

    // If paste or multi-character typing (e.g. 3+ characters)
    if (clean.length > 2) {
      handlePaste(clean);
      return;
    }

    // If user typed over an existing character (length === 2)
    let charToUse = clean[0];
    if (clean.length === 2) {
      // Find the character that wasn't there before
      if (clean[0] === prevChar) {
        charToUse = clean[1];
      } else {
        charToUse = clean[0];
      }
    }

    const newChars = [...chars];
    newChars[index] = charToUse;
    const newCode = newChars.join("");
    onChange(newCode);

    try {
      soundFx.playKeypress();
    } catch {}

    // Auto-focus next cell on mobile/desktop
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
      inputsRef.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!chars[index] && index > 0) {
        // Current cell is empty; jump back and clear previous cell
        e.preventDefault();
        const newChars = [...chars];
        newChars[index - 1] = "";
        onChange(newChars.join(""));
        inputsRef.current[index - 1]?.focus();
      } else if (chars[index]) {
        // Clear current
        const newChars = [...chars];
        newChars[index] = "";
        onChange(newChars.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };

  const handleNativePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    handlePaste(pasted);
  };

  const handleQuickPaste = async () => {
    try {
      if (!navigator?.clipboard?.readText) {
        toast.info("برای جای‌گذاری در این مرورگر، انگشت خود را روی خانه اول نگه دارید و Paste را بزنید.");
        inputsRef.current[0]?.focus();
        return;
      }
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        handlePaste(clipText);
        toast.success("کد سفینه جای‌گذاری شد.");
      } else {
        toast.error("کلیپ‌بورد خالی است.");
      }
    } catch {
      toast.info("لطفاً کد را مستقیماً در خانه اول جای‌گذاری (Paste) کنید.");
      inputsRef.current[0]?.focus();
    }
  };

  const handleClear = () => {
    onChange("");
    setPersianWarning(false);
    inputsRef.current[0]?.focus();
  };

  return (
    <div className="flex flex-col items-center gap-2.5 w-full">
      {/* Segmented input boxes */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 w-full" dir="ltr">
        {chars.map((char, index) => {
          const isFilled = Boolean(char);
          return (
            <div key={index} className="relative">
              <input
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="text"
                autoComplete="one-time-code"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                maxLength={2}
                disabled={disabled}
                value={char ? char.toUpperCase() : ""}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handleNativePaste}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className={`w-10 h-12 sm:w-13 sm:h-14 md:w-14 md:h-15 text-center font-mono text-xl sm:text-2xl font-black uppercase rounded-lg border transition-all outline-none ${
                  isFilled
                    ? "bg-secondary/40 border-primary text-primary shadow-[0_0_12px_rgba(252,238,10,0.25)] ring-1 ring-primary/40"
                    : "bg-black/60 border-border/70 text-foreground hover:border-primary/50"
                } focus:border-primary focus:bg-secondary/20 focus:ring-2 focus:ring-primary/60 focus:shadow-[0_0_20px_rgba(252,238,10,0.4)] disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {/* Cell index label under box */}
              <span className="absolute -bottom-4 left-0 right-0 text-center font-mono text-[9px] text-muted-foreground/60 select-none">
                {index + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick Actions (Paste & Clear) for Mobile & Desktop */}
      <div className="flex items-center justify-between w-full max-w-xs mt-3 px-1 text-xs">
        <button
          type="button"
          onClick={handleQuickPaste}
          disabled={disabled}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-cyan-400 active:scale-95 transition-all py-1 px-2 rounded hover:bg-secondary/20 border border-transparent hover:border-border/40 cursor-pointer"
        >
          <Clipboard className="size-3 text-cyan-400" />
          <span>چسباندن کد (Paste)</span>
        </button>

        {value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-rose-400 active:scale-95 transition-all py-1 px-2 rounded hover:bg-destructive/10 cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>پاک کردن</span>
          </button>
        )}
      </div>

      {/* Persian keyboard warning banner if user accidentally types Persian */}
      {persianWarning && (
        <div className="text-[11px] text-amber-400/90 bg-amber-950/40 border border-amber-500/30 rounded px-2.5 py-1 text-center animate-pulse">
          ⚠️ کد سفینه با حروف انگلیسی است — لطفاً کیبورد خود را روی انگلیسی قرار دهید.
        </div>
      )}
    </div>
  );
}
