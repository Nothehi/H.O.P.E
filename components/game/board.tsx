"use client";

/**
 * The spaceship board: the four resource tracks and the zone map, with the
 * campaign's permanent Chronicle stickers rendered on top of both.
 */

import { ZONES } from "@/lib/game/content";
import type { GameState, ResourceKey } from "@/lib/game/types";
import { RESOURCE_META } from "./meta";

function Sticker({ label, positive }: { label: string; positive: boolean }) {
  return (
    <span
      className={`inline-block -rotate-2 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide shadow-sm ${
        positive
          ? "border-emerald-600/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "border-red-600/50 bg-red-500/15 text-red-600 dark:text-red-400"
      }`}
    >
      {label}
    </span>
  );
}

function Track({ game, k }: { game: GameState; k: ResourceKey }) {
  const meta = RESOURCE_META[k];
  const value = game.resources[k];
  const max = game.resources.max[k];
  const Icon = meta.icon;
  const stickers = game.chronicle.stickers.filter((s) => s.target === k);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm">
        <Icon className={`size-4 ${meta.textClass}`} />
        <span className="font-medium">{meta.label}</span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {value}/{max}
        </span>
        {stickers.map((s) => (
          <Sticker key={s.id} label={s.label} positive={s.positive} />
        ))}
      </div>
      <div className="flex h-3 items-stretch gap-[3px]">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`w-[3px] ${
              i < value
                ? value <= 3
                  ? "animate-pulse bg-red-500"
                  : "bg-foreground"
                : "bg-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function ShipBoard({
  game,
  activeZone,
}: {
  game: GameState;
  activeZone?: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="frame-corners space-y-3 rounded-xl border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Vital Systems
        </h3>
        {(["oxygen", "hull", "morale", "bond"] as const).map((k) => (
          <Track key={k} game={game} k={k} />
        ))}
      </div>

      <div className="frame-corners rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Ship Zones
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          {ZONES.map((zone) => {
            const stickers = game.chronicle.stickers.filter(
              (s) => s.target === zone,
            );
            return (
              <div
                key={zone}
                className={`flex min-h-16 flex-col gap-1 rounded-lg border p-2 ${
                  zone === activeZone
                    ? "border-primary bg-primary/10"
                    : "border-dashed bg-muted/30"
                }`}
              >
                <span className="text-[11px] font-medium text-muted-foreground">
                  {zone}
                </span>
                {stickers.map((s) => (
                  <Sticker key={s.id} label={s.label} positive={s.positive} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
