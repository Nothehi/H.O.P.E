"use client";

/**
 * The spaceship board: the four resource tracks and the zone map, with the
 * campaign's permanent Chronicle stickers rendered on top of both.
 */

import { useState } from "react";
import { Map, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
      <div className="flex h-3 items-stretch gap-[2px] overflow-hidden max-w-full">
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
  "Bridge": "col-start-2 row-start-1",
  "Crew Quarters": "col-start-1 row-start-2",
  "AI Core": "col-start-2 row-start-2",
  "Medbay": "col-start-3 row-start-2",
  "Cargo Bay": "col-start-1 row-start-3",
  "Life Support": "col-start-2 row-start-3",
  "Pod Bay": "col-start-3 row-start-3",
  "Reactor": "col-start-1 row-start-4",
  "Engineering": "col-start-3 row-start-4"
};

export function ShipBoard({
  game,
  activeZone,
}: {
  game: GameState;
  activeZone?: string | null;
}) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  return (
    <div className="space-y-4 max-w-full overflow-hidden" dir="rtl">
      <div className="frame-corners space-y-3 rounded-none border bg-card p-4 text-right max-w-full overflow-hidden">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
          سامانه‌های حیاتی سفینه
        </h3>
        {(["oxygen", "hull", "morale", "bond"] as const).map((k) => (
          <Track key={k} game={game} k={k} />
        ))}
      </div>

      <div className="frame-corners rounded-none border bg-card p-4 text-right max-w-full overflow-hidden">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
          بخش‌ها و مناطق سفینه
        </h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/10 hover:text-primary">
              <Map className="size-4 ml-2" />
              مشاهده نقشه و بخش‌های سفینه
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl border-primary/20 max-h-[85vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-primary flex items-center gap-2 text-xl font-black tracking-wide">
                <Map className="size-5" />
                نقشه سایبرنتیک سفینه
              </DialogTitle>
            </DialogHeader>
            <div className="relative grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-5 mt-2 max-w-full bg-[#0B0E14] border border-primary/30 rounded-none bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
              {ZONES.map((zone) => {
                const stickers = game.chronicle.stickers.filter(
                  (s) => s.target === zone,
                );
                const isDamaged = stickers.some(s => !s.positive);
                const posClass = ZONE_GRID_POS[zone] || "col-auto";
                const isCurrent = zone === activeZone;
                
                let borderClass = "border-secondary-foreground/30 bg-card/90 hover:bg-[#1A202C] hover:border-secondary-foreground";
                if (isDamaged) {
                  borderClass = "border-destructive/80 animate-pulse bg-destructive/10 hover:bg-destructive/20 shadow-[0_0_8px_rgba(255,0,85,0.3)]";
                }
                if (isCurrent) {
                  borderClass = "border-primary bg-primary/20 shadow-[0_0_15px_rgba(252,238,10,0.4)] z-10 scale-105";
                }
                
                return (
                  <div
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    className={`cursor-pointer frame-corners cp-cut-sm flex flex-col justify-center items-center gap-1.5 rounded-none border p-2 text-center overflow-hidden transition-all duration-300 min-h-[5.5rem] ${posClass} ${borderClass}`}
                  >
                    <span className={`text-[10px] sm:text-xs font-bold leading-tight break-words whitespace-normal text-balance ${isCurrent ? 'text-primary drop-shadow-md' : isDamaged ? 'text-destructive drop-shadow-md' : 'text-foreground/90'}`}>
                      {ZONE_FA[zone] || zone}
                    </span>
                    {isCurrent && (
                      <span className="animate-pulse text-[8px] sm:text-[9px] text-primary uppercase font-mono tracking-widest mt-0.5">
                        // CURRENT_LOC
                      </span>
                    )}
                    {stickers.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1 mt-1 w-full">
                        {stickers.map((s) => (
                          <Sticker key={s.id} label={s.label} positive={s.positive} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Zone Details Panel */}
            {selectedZone && (
              <div className="mt-4 p-4 rounded-none border border-secondary-foreground/30 bg-[#121522]/90 cp-cut shadow-[0_0_10px_rgba(5,217,232,0.15)] flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-secondary-foreground/20 pb-2">
                  <h4 className="text-lg font-black text-primary uppercase tracking-wide">
                    {ZONE_FA[selectedZone] || selectedZone}
                  </h4>
                  {(() => {
                    const zoneStickers = game.chronicle.stickers.filter((s) => s.target === selectedZone);
                    const isDamaged = zoneStickers.some(s => !s.positive);
                    return isDamaged ? (
                      <Badge className="bg-destructive/10 text-destructive border-destructive font-bold flex items-center gap-1 hover:bg-destructive/20 cp-cut-sm shadow-[0_0_8px_rgba(255,0,85,0.4)]">
                        <AlertCircle className="size-3" />
                        آسیب‌دیده
                      </Badge>
                    ) : (
                      <Badge className="bg-secondary-foreground/10 text-secondary-foreground border-secondary-foreground font-bold flex items-center gap-1 hover:bg-secondary-foreground/20 cp-cut-sm shadow-[0_0_8px_rgba(5,217,232,0.4)]">
                        <CheckCircle2 className="size-3" />
                        عملیاتی
                      </Badge>
                    );
                  })()}
                </div>
                <div className="text-sm leading-relaxed text-foreground/90 min-h-[3rem]">
                  {(() => {
                    const zoneStickers = game.chronicle.stickers.filter((s) => s.target === selectedZone);
                    if (zoneStickers.length === 0) {
                      return "گزارش وضعیت: سیستم‌های داخلی بدون مشکل کار می‌کنند. پارامترهای حیاتی در محدوده استاندارد هستند.";
                    }
                    return (
                      <ul className="list-disc list-inside space-y-1">
                        {zoneStickers.map(s => (
                          <li key={s.id} className={s.positive ? "text-secondary-foreground" : "text-destructive"}>
                            {s.label}
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
