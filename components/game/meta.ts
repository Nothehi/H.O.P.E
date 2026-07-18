/** UI metadata for roles and resource tracks. */

import {
  Brain,
  Crosshair,
  Crown,
  Cpu,
  FlaskConical,
  Heart,
  Rocket,
  Shield,
  Sparkles,
  Stethoscope,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ResourceKey, Role } from "@/lib/game/types";

export const ROLE_META: Record<
  Role,
  { label: string; icon: LucideIcon; blurb: string }
> = {
  commander: {
    label: "Commander",
    icon: Crown,
    blurb: "The face of every decision — and every consequence.",
  },
  engineer: {
    label: "Engineer",
    icon: Wrench,
    blurb: "Keeps the hull between the crew and the void.",
  },
  medic: {
    label: "Medic",
    icon: Stethoscope,
    blurb: "Decides who gets treated — and who waits.",
  },
  soldier: {
    label: "Soldier",
    icon: Crosshair,
    blurb: "Order, at a price someone else pays.",
  },
  technician: {
    label: "Technician",
    icon: Cpu,
    blurb: "The only one allowed to peek at hidden consequences. Truth optional.",
  },
  psychologist: {
    label: "Psychologist",
    icon: Brain,
    blurb: "Hears what the crew won't say on the record.",
  },
  pilot: {
    label: "Pilot",
    icon: Rocket,
    blurb: "Thinks in burn windows and points of no return.",
  },
  scientist: {
    label: "Scientist",
    icon: FlaskConical,
    blurb: "Runs the numbers nobody wants to hear.",
  },
};

export const RESOURCE_META: Record<
  ResourceKey,
  { label: string; icon: LucideIcon; barClass: string; textClass: string }
> = {
  oxygen: {
    label: "Oxygen",
    icon: Wind,
    barClass: "bg-sky-500",
    textClass: "text-sky-500",
  },
  hull: {
    label: "Hull",
    icon: Shield,
    barClass: "bg-amber-500",
    textClass: "text-amber-500",
  },
  morale: {
    label: "Morale",
    icon: Heart,
    barClass: "bg-rose-500",
    textClass: "text-rose-500",
  },
  bond: {
    label: "Bond",
    icon: Sparkles,
    barClass: "bg-violet-500",
    textClass: "text-violet-500",
  },
};

export function fmtDelta(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}
