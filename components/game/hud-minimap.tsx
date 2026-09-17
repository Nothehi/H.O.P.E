"use client";

/**
 * H.O.P.E. — Cyberpunk 2077 Style HUD Minimap Widget
 *
 * Fixed corner HUD widget displaying live ship wireframe schematic, sector health status,
 * dynamic location cursor, resource telemetry, and objective bar driven by GameState.
 */

import { useState } from "react";
import { Activity, ShieldAlert, Zap, Navigation, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CARDS, PUZZLES } from "@/lib/game/content";
import type { GameState } from "@/lib/game/types";

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

interface SectionData {
  id: string;
  name: string;
  health: number;
  status: "ok" | "damaged" | "critical" | "offline";
}

export function HudMinimap({
  game,
  activeZone,
  onOpenFullMap,
}: {
  game: GameState;
  activeZone?: string | null;
  onOpenFullMap?: () => void;
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  if (game.stage !== "playing") return null;

  // Calculate ship integrity percentage
  const r = game.resources;
  const oxyRatio = r.oxygen / r.max.oxygen;
  const hullRatio = r.hull / r.max.hull;
  const moraleRatio = r.morale / r.max.morale;
  const integrityPercent = Math.round(((oxyRatio + hullRatio + moraleRatio) / 3) * 100);

  // Active Card or Puzzle Objective
  const activeCard = game.currentCardId ? CARDS[game.currentCardId] : null;
  const currentPuzzle = game.phase === "puzzle" && game.puzzle ? PUZZLES[game.puzzle.puzzleId] : null;

  const currentObjective =
    game.phase === "puzzle" && currentPuzzle
      ? `حل قفل امنیتی: ${currentPuzzle.answer}`
      : game.phase === "debate"
      ? `رای‌گیری توکن‌ها: ${activeCard?.title ?? "انتخاب گزینه‌ها"}`
      : game.phase === "peek"
      ? "هک تکنسین و بررسی عواقب"
      : game.phase === "reveal"
      ? "انتظار برای افشای بحران دور"
      : "بررسی نتایج و پیامدها";

  // Section Health Calculator
  const getSectionData = (zone: string): SectionData => {
    const stickers = game.chronicle.stickers.filter((s) => s.target === zone);
    const hasNegative = stickers.some((s) => !s.positive);
    
    if (hasNegative) {
      return { id: zone, name: ZONE_FA[zone] || zone, health: 35, status: "critical" };
    }
    if (integrityPercent < 40) {
      return { id: zone, name: ZONE_FA[zone] || zone, health: 60, status: "damaged" };
    }
    return { id: zone, name: ZONE_FA[zone] || zone, health: 100, status: "ok" };
  };

  const getStatusColor = (status: SectionData["status"]) => {
    switch (status) {
      case "ok":
        return "#05D9E8"; // Cyan
      case "damaged":
        return "#FCEE0A"; // Yellow
      case "critical":
        return "#FF0055"; // Magenta / Red
      default:
        return "#121522"; // Dark Gray
    }
  };

  return (
    <div
      className="fixed top-14 left-4 z-40 hidden md:flex flex-col font-mono text-right text-xs transition-all duration-300"
      style={{
        width: isMinimized ? "240px" : "280px",
      }}
      dir="rtl"
    >
      {/* HUD CONTAINER BOX - Cyberpunk cut corners & semi-transparent backdrop */}
      <div className="relative bg-[#0B1117]/85 backdrop-blur-md border border-[#05D9E8]/50 shadow-[0_0_20px_rgba(5,217,232,0.2)] p-2.5 space-y-2 rounded-none">
        
        {/* Corner Accent Lines */}
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#FCEE0A]" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#05D9E8]" />

        {/* TOP TELEMETRY BAR */}
        <div className="flex items-center justify-between border-b border-[#05D9E8]/30 pb-1.5 text-[10px]">
          <div className="flex items-center gap-1 text-[#05D9E8] font-black tracking-widest">
            <Activity className="size-3 text-[#05D9E8] animate-pulse" />
            <span>H.O.P.E. // MINIMAP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#E7E7E7] font-bold">
              سلامت: <span style={{ color: integrityPercent < 40 ? "#FF0055" : "#05D9E8" }}>{integrityPercent}%</span>
            </span>
            <button
              onClick={() => setIsMinimized((v) => !v)}
              className="text-[#05D9E8] hover:text-[#FCEE0A] p-0.5"
            >
              {isMinimized ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
            </button>
          </div>
        </div>

        {/* WIREFRAME BLUEPRINT MAP GRAPHIC */}
        {!isMinimized && (
          <div
            className="relative bg-[#121522]/90 border border-[#05D9E8]/30 p-2 cursor-pointer hover:border-[#05D9E8] transition-colors"
            onClick={onOpenFullMap}
            title="برای باز کردن نقشه کامل کلیک کنید"
          >
            {/* Background Grid Line FX */}
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(rgba(5,217,232,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(5,217,232,0.2)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            <svg viewBox="0 0 240 140" className="w-full h-32">
              {/* CONNECTING WIREFRAME LINES */}
              <line x1="120" y1="20" x2="120" y2="50" stroke="#05D9E8" strokeWidth="1" strokeDasharray="2" />
              <line x1="50" y1="50" x2="190" y2="50" stroke="#05D9E8" strokeWidth="1" />
              <line x1="50" y1="50" x2="50" y2="90" stroke="#05D9E8" strokeWidth="1" />
              <line x1="120" y1="50" x2="120" y2="90" stroke="#05D9E8" strokeWidth="1" />
              <line x1="190" y1="50" x2="190" y2="90" stroke="#05D9E8" strokeWidth="1" />
              <line x1="50" y1="90" x2="190" y2="90" stroke="#05D9E8" strokeWidth="1" />
              <line x1="50" y1="90" x2="50" y2="120" stroke="#05D9E8" strokeWidth="1" />
              <line x1="190" y1="90" x2="190" y2="120" stroke="#05D9E8" strokeWidth="1" />

              {/* SECTIONS NODES */}
              {/* Bridge */}
              {renderNode("Bridge", 95, 5, 50, 25, activeZone, game, getSectionData, getStatusColor, setHoveredZone)}
              {/* Crew Quarters */}
              {renderNode("Crew Quarters", 25, 38, 50, 25, activeZone, game, getSectionData, getStatusColor, setHoveredZone)}
              {/* AI Core */}
              {renderNode("AI Core", 95, 38, 50, 25, activeZone, game, getSectionData, getStatusColor, setHoveredZone)}
              {/* Medbay */}
              {renderNode("Medbay", 165, 38, 50, 25, activeZone, game, getSectionData, getStatusColor, setHoveredZone)}
              {/* Cargo Bay */}
              {renderNode("Cargo Bay", 25, 78, 50, 25, activeZone, game, getSectionData, getStatusColor, setHoveredZone)}
              {/* Life Support */}
              {renderNode("Life Support", 95, 78, 50, 25, activeZone, game, getSectionData, getStatusColor, setHoveredZone)}
              {/* Pod Bay */}
              {renderNode("Pod Bay", 165, 78, 50, 25, activeZone, game, getSectionData, getStatusColor, setHoveredZone)}
              {/* Reactor */}
              {renderNode("Reactor", 25, 110, 50, 25, activeZone, game, getSectionData, getStatusColor, setHoveredZone)}
              {/* Engineering */}
              {renderNode("Engineering", 165, 110, 50, 25, activeZone, game, getSectionData, getStatusColor, setHoveredZone)}
            </svg>

            {/* HOVER TOOLTIP */}
            {hoveredZone && (
              <div className="absolute bottom-1 right-1 bg-[#0B1117] border border-[#05D9E8] p-1 text-[10px] text-[#05D9E8]">
                {ZONE_FA[hoveredZone]} | {getSectionData(hoveredZone).health}%
              </div>
            )}
          </div>
        )}

        {/* REAL-TIME TELEMETRY MINI BARS */}
        {!isMinimized && (
          <div className="grid grid-cols-4 gap-1 text-[9px] text-[#E7E7E7] border-t border-[#05D9E8]/20 pt-1.5">
            <div>
              <span className="block text-[#05D9E8]">OXY</span>
              <span className="font-bold">{r.oxygen}/{r.max.oxygen}</span>
            </div>
            <div>
              <span className="block text-[#05D9E8]">HULL</span>
              <span className="font-bold">{r.hull}/{r.max.hull}</span>
            </div>
            <div>
              <span className="block text-[#05D9E8]">MOR</span>
              <span className="font-bold">{r.morale}/{r.max.morale}</span>
            </div>
            <div>
              <span className="block text-[#FCEE0A]">BOND</span>
              <span className="font-bold text-[#FCEE0A]">{r.bond}</span>
            </div>
          </div>
        )}

        {/* CYBERPUNK OBJECTIVE BOTTOM BAR (CYBERPUNK 2077 STYLE) */}
        <div className="bg-[#05D9E8]/10 border-l-2 border-[#FCEE0A] p-1.5 text-right space-y-0.5">
          <div className="text-[9px] font-black text-[#FCEE0A] uppercase tracking-wider flex items-center justify-between">
            <span>// OBJECTIVE: VOYAGE {game.chronicle.voyage} - R{game.round}</span>
          </div>
          <p className="text-[10px] text-[#E7E7E7] font-semibold truncate">
            {currentObjective}
          </p>
        </div>
      </div>
    </div>
  );
}

function renderNode(
  zone: string,
  x: number,
  y: number,
  w: number,
  h: number,
  activeZone: string | null | undefined,
  game: GameState,
  getSectionData: (z: string) => SectionData,
  getStatusColor: (s: SectionData["status"]) => string,
  setHoveredZone: (z: string | null) => void,
) {
  const data = getSectionData(zone);
  const isCurrent = zone === activeZone;
  const strokeColor = getStatusColor(data.status);

  return (
    <g
      key={zone}
      onMouseEnter={() => setHoveredZone(zone)}
      onMouseLeave={() => setHoveredZone(null)}
      className="cursor-pointer"
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={isCurrent ? "rgba(252,238,10,0.15)" : "#0B1117"}
        stroke={isCurrent ? "#FCEE0A" : strokeColor}
        strokeWidth={isCurrent ? 2 : 1}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + 3}
        fill={isCurrent ? "#FCEE0A" : "#E7E7E7"}
        fontSize="8"
        fontWeight="bold"
        textAnchor="middle"
      >
        {ZONE_FA[zone]?.slice(0, 7) || zone}
      </text>

      {/* Pulsing indicator for current position */}
      {isCurrent && (
        <circle cx={x + w - 4} cy={y + 4} r="3" fill="#FCEE0A">
          <animate attributeName="r" values="2;4;2" dur="1s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}
