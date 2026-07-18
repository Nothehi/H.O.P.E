"use client";

import { Play, ScrollText, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLES, type GameAction, type GameState } from "@/lib/game/types";
import { ROLE_META } from "./meta";

export function Lobby({
  game,
  selfId,
  dispatch,
}: {
  game: GameState;
  selfId: string | null;
  dispatch: (action: GameAction) => void;
}) {
  const mySeat = game.seats.find((s) => s.playerId === selfId);
  const chronicle = game.chronicle;
  const everyoneAssigned =
    game.seats.length > 0 && game.seats.every((s) => s.role !== null);
  const hasTechnician = game.seats.some((s) => s.role === "technician");

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold">
          Voyage {chronicle.voyage + 1} — Crew Muster
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose your department. There are no personas here — you play as
          yourself, and the ledger remembers real names.
        </p>
      </div>

      {chronicle.voyage > 0 && (
        <div className="space-y-2 rounded-xl border bg-muted/30 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <ScrollText className="size-4" />
            The Chronicle so far
          </div>
          <p className="text-muted-foreground">
            {chronicle.voyage} voyage{chronicle.voyage > 1 ? "s" : ""} logged ·{" "}
            {chronicle.ledger.length} ledger signatures ·{" "}
            {chronicle.stickers.length} permanent stickers ·{" "}
            {chronicle.envelopesOpened.length} envelopes torn open ·{" "}
            {chronicle.retiredCards.length} dilemmas resolved forever
          </p>
          {chronicle.heroHistory.length > 0 && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Trophy className="size-3.5 text-amber-500" />
              Heroes of the Ship:{" "}
              {chronicle.heroHistory
                .map((h) => `${h.name} (V${h.voyage})`)
                .join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ROLES.map((role) => {
          const meta = ROLE_META[role];
          const takenBy = game.seats.find((s) => s.role === role);
          const mine = mySeat?.role === role;
          const Icon = meta.icon;
          return (
            <button
              key={role}
              onClick={() =>
                mySeat && dispatch({ type: "choose-role", role: mine ? null : role })
              }
              disabled={!mySeat || (!!takenBy && !mine)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
                mine
                  ? "border-primary bg-primary/10"
                  : takenBy
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-muted"
              }`}
              title={meta.blurb}
            >
              <Icon className="size-5" />
              <span className="text-xs font-semibold">{meta.label}</span>
              <span className="min-h-4 text-[10px] text-muted-foreground">
                {takenBy ? takenBy.name : "open"}
              </span>
            </button>
          );
        })}
      </div>

      {mySeat?.role && (
        <p className="text-center text-xs text-muted-foreground">
          {ROLE_META[mySeat.role].blurb}
        </p>
      )}

      <div className="flex flex-col items-center gap-2">
        <Button
          size="lg"
          disabled={!mySeat || game.seats.length === 0}
          onClick={() => dispatch({ type: "start-game" })}
        >
          <Play className="size-4" />
          Begin Voyage {chronicle.voyage + 1}
        </Button>
        {!everyoneAssigned && (
          <Badge variant="secondary">waiting on department picks</Badge>
        )}
        {!hasTechnician && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            No Technician aboard — nobody will be able to peek at hidden
            consequences. The crew flies blind.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {game.seats.length} crew seated · 3–8 players recommended
        </p>
      </div>
    </div>
  );
}
