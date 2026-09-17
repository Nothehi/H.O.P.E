"use client";

/**
 * The spaceship board: resource tracks and live inline petrol-blue video game tactical ship map.
 */

import { useState } from "react";
import { CheckCircle2, Radio, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ZONES } from "@/lib/game/content";
import type { GameState, ResourceKey } from "@/lib/game/types";
import { RESOURCE_META } from "./meta";

function Sticker({ label, positive }: { label: string; positive: boolean }) {
  return (
    <span
      className={`inline-block -rotate-2 rounded-sm border px-1 py-0.5 font-mono text-[9px] font-bold tracking-wide shadow-sm ${
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
      <div className="flex items-center gap-1.5 text-xs">
        <Icon className={`size-3.5 ${meta.textClass}`} />
        <span className="font-medium">{meta.label}</span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {value}/{max}
        </span>
        {stickers.map((s) => (
          <Sticker key={s.id} label={s.label} positive={s.positive} />
        ))}
      </div>
      <div className="flex h-2.5 items-stretch gap-[2px] overflow-hidden max-w-full">
        {Array.from({ length: max }, (_, i) => {
          let colorClass = "bg-muted/30";
          if (i < value) {
            const percent = value / max;
            if (percent < 0.2) {
              colorClass = "bg-destructive animate-pulse shadow-[0_0_8px_rgba(255,0,85,0.6)]";
            } else if (percent <= 0.5) {
              colorClass = "bg-primary shadow-[0_0_8px_rgba(252,238,10,0.4)]";
            } else {
              colorClass = "bg-secondary-foreground shadow-[0_0_8px_rgba(5,217,232,0.4)]";
            }
          }
          return (
            <div
              key={i}
              className={`flex-1 min-w-[2px] ${colorClass}`}
            />
          );
        })}
      </div>
    </div>
  );
}

const ZONE_FA: Record<string, string> = {
  Bridge: "پل فرماندهی",
  Reactor: "راکتور اصلی",
  Engineering: "بخش مهندسی",
  "Life Support": "پشتیبانی حیات",
  Medbay: "درمانگاه سفینه",
  "Cargo Bay": "انبار کالا",
  "Crew Quarters": "استراحتگاه خدمه",
  "AI Core": "هسته هوش مصنوعی",
  "Pod Bay": "آشیانه کپسول‌ها",
};

const ZONE_GRID_POS: Record<string, string> = {
  Bridge: "col-start-2 row-start-1",
  "Crew Quarters": "col-start-1 row-start-2",
  "AI Core": "col-start-2 row-start-2",
  Medbay: "col-start-3 row-start-2",
  "Cargo Bay": "col-start-1 row-start-3",
  "Life Support": "col-start-2 row-start-3",
  "Pod Bay": "col-start-3 row-start-3",
  Reactor: "col-start-1 row-start-4",
  Engineering: "col-start-3 row-start-4",
};

import { ThreeShipRadar } from "./three-ship-radar";

export function ShipBoard({
  game,
  activeZone,
}: {
  game: GameState;
  activeZone?: string | null;
}) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("3d");

  return (
    <div className="space-y-3 max-w-full overflow-hidden" dir="rtl">
      {/* Vital Resource Tracks */}
      <div className="frame-corners space-y-2.5 rounded-none border bg-card p-3 text-right max-w-full overflow-hidden">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary">
          سامانه‌های حیاتی سفینه
        </h3>
        {(["oxygen", "hull", "morale", "bond"] as const).map((k) => (
          <Track key={k} game={game} k={k} />
        ))}
      </div>

      {/* DIRECT INLINE VIDEO GAME TACTICAL MAP BOARD */}
      <div className="frame-corners rounded-none border border-cyan-500/40 bg-[#061325] p-3 text-right max-w-full overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.15)]">
        <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2 mb-2">
          <span className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
            <Radio className="size-3.5 text-red-500 animate-ping shrink-0" />
            رادار و نقشه تاکتیکی سفینه
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode("3d")}
              className={`text-[9px] font-mono px-1.5 py-0.5 border ${
                viewMode === "3d"
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold"
                  : "bg-cyan-950/60 text-cyan-400 border-cyan-900"
              }`}
            >
              3D هولوگرام
            </button>
            <button
              onClick={() => setViewMode("2d")}
              className={`text-[9px] font-mono px-1.5 py-0.5 border ${
                viewMode === "2d"
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold"
                  : "bg-cyan-950/60 text-cyan-400 border-cyan-900"
              }`}
            >
              2D بلوپرینت
            </button>
          </div>
        </div>

        {/* 3D THREE.JS HOLOGRAPHIC RADAR VIEW */}
        {viewMode === "3d" ? (
          <ThreeShipRadar game={game} activeZone={activeZone} />
        ) : (
          /* PETROL BLUE RADAR GRID INLINE */
          <div className="relative p-2 bg-gradient-to-b from-[#08182b] to-[#040c17] border border-cyan-600/40 rounded-none bg-[linear-gradient(rgba(0,240,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Radar Sweep Line FX */}
            <div className="absolute inset-0 pointer-events-none opacity-15 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.2)_0,transparent_70%)]" />

          <div className="grid grid-cols-3 gap-1.5 relative z-10">
            {ZONES.map((zone) => {
              const stickers = game.chronicle.stickers.filter(
                (s) => s.target === zone,
              );
              const isDamaged = stickers.some((s) => !s.positive);
              const posClass = ZONE_GRID_POS[zone] || "col-auto";
              const isCurrent = zone === activeZone;

              return (
                <div
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  className={`relative cursor-pointer flex flex-col justify-between items-center p-1.5 text-center transition-all duration-200 min-h-[4.8rem] border ${posClass} ${
                    isCurrent
                      ? "bg-cyan-500/25 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.6)] z-20 scale-[1.03]"
                      : isDamaged
                      ? "bg-red-950/40 border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.3)] hover:border-red-400"
                      : "bg-[#0b213b]/80 border-cyan-900/60 hover:border-cyan-400 hover:bg-[#112d4e]"
                  }`}
                >
                  {/* RED ZONE INDICATOR POINT / LED DOT */}
                  <div className="w-full flex items-center justify-between text-[9px] font-mono">
                    <span
                      className={`size-1.5 rounded-full inline-block ${
                        isDamaged
                          ? "bg-red-500 animate-ping shadow-[0_0_6px_rgba(239,68,68,0.9)]"
                          : "bg-red-600/70"
                      }`}
                    />
                    {isCurrent && (
                      <Badge className="bg-cyan-500 text-slate-950 font-extrabold text-[8px] px-1 py-0 animate-bounce">
                        📍 اینجا
                      </Badge>
                    )}
                  </div>

                  {/* Sector Name */}
                  <span
                    className={`text-[11px] font-bold my-0.5 leading-tight ${
                      isCurrent
                        ? "text-cyan-300 drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]"
                        : isDamaged
                        ? "text-red-400"
                        : "text-slate-200"
                    }`}
                  >
                    {ZONE_FA[zone] || zone}
                  </span>

                  {/* Stickers / Damage Badges */}
                  {stickers.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-0.5 w-full mt-0.5">
                      {stickers.map((s) => (
                        <Sticker key={s.id} label={s.label} positive={s.positive} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[8px] font-mono text-cyan-600/70">
                      OK
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        )}

        {/* Selected Zone Details Drawer Inline */}
        {selectedZone && (
          <div className="mt-2.5 p-2.5 border border-cyan-500/40 bg-[#08182b] text-right space-y-1">
            <div className="flex items-center justify-between border-b border-cyan-900/60 pb-1">
              <h4 className="text-xs font-black text-cyan-400">
                {ZONE_FA[selectedZone] || selectedZone}
              </h4>
              {(() => {
                const zoneStickers = game.chronicle.stickers.filter(
                  (s) => s.target === selectedZone,
                );
                const isDamaged = zoneStickers.some((s) => !s.positive);
                return isDamaged ? (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500 text-[9px] px-1 py-0">
                    <ShieldAlert className="size-2.5 ml-1" /> هشدار
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500 text-[9px] px-1 py-0">
                    <CheckCircle2 className="size-2.5 ml-1" /> پایدار
                  </Badge>
                );
              })()}
            </div>
            <div className="text-[11px] text-cyan-200/90 leading-relaxed font-mono">
              {(() => {
                const zoneStickers = game.chronicle.stickers.filter(
                  (s) => s.target === selectedZone,
                );
                if (zoneStickers.length === 0) {
                  return "سیستم‌های داخلی بدون مشکل گزارش شده‌اند.";
                }
                return (
                  <ul className="list-disc list-inside space-y-0.5">
                    {zoneStickers.map((s) => (
                      <li
                        key={s.id}
                        className={s.positive ? "text-emerald-400" : "text-red-400"}
                      >
                        {s.label}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
