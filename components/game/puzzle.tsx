"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, KeyRound, Lightbulb, ShieldAlert } from "lucide-react";
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
  const [pad, setPad] = useState(puzzle?.scratchpad ?? "");
  const padRef = useRef<HTMLTextAreaElement>(null);
  const padTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Merge in remote scratchpad edits unless we're the one typing.
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

  return (
    <div className="space-y-4">
      <div className="frame-corners space-y-3 rounded-xl border border-red-500/40 bg-red-500/5 p-5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-red-500" />
          <h3 className="text-lg font-bold">{def.title}</h3>
          <Badge variant="secondary" className="ml-auto">
            {def.zone}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {def.prompt}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <Badge variant={attemptsLeft <= 2 ? "destructive" : "outline"}>
            {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} left
          </Badge>
          {puzzle.lastGuess && !puzzle.solved && (
            <span className="font-mono text-xs text-red-500">
              REJECTED: {puzzle.lastGuess}
            </span>
          )}
        </div>
      </div>

      {myClues.length > 0 && !done && (
        <div className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <Lightbulb className="size-4" />
            Your fragments — only you hold these. Share them aloud.
          </div>
          {myClues.map((id) => (
            <p key={id} className="text-sm italic">
              “{CLUES[id].text}”
            </p>
          ))}
        </div>
      )}

      {!done && (
        <>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Shared scratchpad — everyone writes here
            </label>
            <Textarea
              ref={padRef}
              value={pad}
              onChange={(e) => editPad(e.target.value)}
              onBlur={() => dispatch({ type: "scratchpad", text: pad })}
              placeholder="Pool your clues, test hypotheses…"
              className="min-h-28 font-mono text-sm"
              disabled={!mySeat}
            />
          </div>

          <div className="flex gap-2">
            <Input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder={def.placeholder}
              className="font-mono uppercase"
              disabled={!mySeat}
              onKeyDown={(e) => {
                if (e.key === "Enter" && guess.trim()) {
                  dispatch({ type: "guess", guess });
                  setGuess("");
                }
              }}
            />
            <Button
              disabled={!mySeat || !guess.trim()}
              onClick={() => {
                dispatch({ type: "guess", guess });
                setGuess("");
              }}
            >
              <KeyRound className="size-4" />
              Try it
            </Button>
          </div>

          {iModerate && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive"
              onClick={() => dispatch({ type: "bypass" })}
            >
              Force bypass (permanent damage)
            </Button>
          )}
        </>
      )}

      {done && (
        <div className="space-y-4">
          {puzzle.solved ? (
            <p className="text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              ACCESS GRANTED — {puzzle.solvedBy} cracked the code:{" "}
              <span className="font-mono">{def.answer}</span>
            </p>
          ) : (
            <p className="text-center text-sm font-semibold text-red-500">
              The lock was never solved. The ship remembers.
            </p>
          )}
          {game.lastResolution?.notes.map((n, i) => (
            <p key={i} className="text-center text-xs text-muted-foreground">
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
              <ChevronRight className="size-4" />
              Continue to round {game.round + 1}
            </Button>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              The Officer of the Watch will advance the round.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
