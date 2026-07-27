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
    label: "فرمانده",
    icon: Crown,
    blurb: "چهره اصلی تمامی تصمیمات حیاتی و پذیرنده عواقب آن.",
  },
  engineer: {
    label: "مهندس",
    icon: Wrench,
    blurb: "نگهبان بدنه سفینه و محافظ خدمه در برابر خلاء مرگبار فضا.",
  },
  medic: {
    label: "پزشک",
    icon: Stethoscope,
    blurb: "تصمیم‌گیرنده درمان خدمه — تعیین‌کننده اولویت حیات و مرگ.",
  },
  soldier: {
    label: "سرباز",
    icon: Crosshair,
    blurb: "برقرارکننده نظم سفینه به هر قیمت، حتی اگر دیگران تاوانش را بدهند.",
  },
  technician: {
    label: "تکنسین",
    icon: Cpu,
    blurb: "تنها کسی که می‌تواند عواقب پنهان را هک و رمزگشایی کند.",
  },
  psychologist: {
    label: "روان‌پزشک",
    icon: Brain,
    blurb: "شنونده رازها و حرف‌های ناگفته خدمه که در دفترچه ثبت نمی‌شوند.",
  },
  pilot: {
    label: "خلبان",
    icon: Rocket,
    blurb: "محاسبه‌گر مانورهای بی‌بازگشت و مسیرهای ناوبری سفینه.",
  },
  scientist: {
    label: "دانشمند",
    icon: FlaskConical,
    blurb: "تحلیل‌گر آمار و ارقامی که هیچ‌کس مایل به شنیدنشان نیست.",
  },
};

export const RESOURCE_META: Record<
  ResourceKey,
  { label: string; icon: LucideIcon; textClass: string }
> = {
  oxygen: {
    label: "اکسیژن",
    icon: Wind,
    textClass: "text-sky-400",
  },
  hull: {
    label: "بدنه",
    icon: Shield,
    textClass: "text-amber-400",
  },
  morale: {
    label: "روحیه",
    icon: Heart,
    textClass: "text-rose-400",
  },
  bond: {
    label: "همبستگی",
    icon: Sparkles,
    textClass: "text-violet-400",
  },
};

export function fmtDelta(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}
