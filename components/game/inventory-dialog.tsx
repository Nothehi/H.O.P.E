"use client";

import { useEffect, useState } from "react";
import {
  Backpack,
  BookOpen,
  NotebookPen,
  ScrollText,
  KeyRound,
  Wrench,
  Stethoscope,
  Crosshair,
  Cpu,
  Brain,
  Rocket,
  FlaskConical,
  Shield,
  Sparkles,
  Save,
  Trash2,
  Clock,
  CheckCircle2,
  FileText,
  Award,
  Coins,
  Crown,
  Radio,
  Binary,
  Layers,
  StickyNote,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ENVELOPES } from "@/lib/game/content";
import type { GameState, Role, Seat } from "@/lib/game/types";
import { ROLE_META } from "./meta";
import { soundFx } from "@/lib/game/audio";

interface RoleEquipment {
  name: string;
  code: string;
  icon: any;
  category: "افزاره فنی" | "کارت دسترسی" | "پروتکل سازمانی";
  desc: string;
  effect: string;
}

const ROLE_EQUIPMENT: Record<Role, RoleEquipment[]> = {
  commander: [
    {
      name: "کارت کلید سطح ۵ پل فرماندهی",
      code: "KEY-BRIDGE-ALPHA",
      icon: KeyRound,
      category: "کارت دسترسی",
      desc: "کارت امنیتی مگنتی با بالاترین سطح دسترسی مجاز در سامانه مرکزی سفینه.",
      effect: "مجوز قطعی وتوی تصمیمات در شرایط بن‌بست آرا.",
    },
    {
      name: "ترانسیور بیسیم اولویت بحران",
      code: "COM-PRIORITY-01",
      icon: Radio,
      category: "افزاره فنی",
      desc: "فرستنده رادیویی مستقیم با قابلیت ارسال پیام‌های اضطراری در تمام فرکانس‌های سفینه.",
      effect: "شنود تمامی ارتباطات خدمه و ارسال هشدار سراسری.",
    },
    {
      name: "مهر رسمی لاگ وقایع سفینه",
      code: "DOC-SEAL-CHRONICLE",
      icon: Award,
      category: "پروتکل سازمانی",
      desc: "مهر سازمانی مخصوص امضا و رسمیت‌بخشی به تصمیمات سرنوشت‌ساز در دفترچه لجر.",
      effect: "ثبت نام رسمی در تاریخچه هر تصمیم (+۳ امتیاز قهرمان).",
    },
  ],
  engineer: [
    {
      name: "آچار پلاسمایی کالیبراسیون",
      code: "TOOL-PLASMA-SPANNER",
      icon: Wrench,
      category: "افزاره فنی",
      desc: "آچار گشتاور پلاسمایی طراحی‌شده برای تعمیرات پرفشار خطوط خنک‌کننده در موتورخانه.",
      effect: "تسهیل کالیبراسیون نوسان‌نمای راکتور در دور ۶.",
    },
    {
      name: "تستر ولتاژ مدار و فاز هیدرولیک",
      code: "TOOL-PHASE-TESTER",
      icon: Binary,
      category: "افزاره فنی",
      desc: "سنسور تشخیص نوسانات آمپراژ برای بازیابی سریع فیوزهای مدار آشیانه کپسول‌ها.",
      effect: "ردیابی مدار پایداری در پازل دور ۳.",
    },
    {
      name: "مهار ضدتشعشع سربی هسته",
      code: "GEAR-RAD-HARNESS",
      icon: Shield,
      category: "پروتکل سازمانی",
      desc: "لباس کار تقویت‌شده با لایه‌های کامپوزیت برای ورود به اتاق‌های ایزولاسیون رادیواکتیو.",
      effect: "کاهش نیاز به بدنه در دور ۱۰ نهایی از ۶ به ۴ واحد.",
    },
  ],
  medic: [
    {
      name: "انژکتور نانوپادتن سنتتیک",
      code: "MED-INJECTOR-NANO",
      icon: Stethoscope,
      category: "افزاره فنی",
      desc: "سرنگ تزریق خودکار نانوبات‌های پزشکی برای تثبیت فوری علائم زیستی خدمه مسموم.",
      effect: "درمان عوارض طاعون قارچی و کاهش اتلاف اکسیژن درمانگاه.",
    },
    {
      name: "اسکنر بیومتریک ضربان و استرس",
      code: "MED-SCANNER-VITAL",
      icon: Brain,
      category: "افزاره فنی",
      desc: "دستگاه مچی خوانش بلادرنگ نوسانات ضربان قلب، اکسیژن خون و سطح آدرنالین خدمه.",
      effect: "پایش وضعیت روحی خدمه و پیشگیری از تصمیمات انتحاری.",
    },
    {
      name: "پروتکل تریاژ و قرنطینه بالینی",
      code: "DOC-TRIAGE-LEVEL4",
      icon: Layers,
      category: "پروتکل سازمانی",
      desc: "دستورالعمل‌های اخلاقی تصویب‌شده برای اولویت‌بندی نجات خدمه در شرایط کمبود دارو.",
      effect: "مهار سقوط شاخص روحیه در زمان بحران‌های زیستی.",
    },
  ],
  soldier: [
    {
      name: "شوکر الکترومغناطیسی ضدشورش",
      code: "SEC-STUN-BATON",
      icon: Crosshair,
      category: "افزاره فنی",
      desc: "باتوم پالسی شوک الکتریکی طراحی‌شده برای متفرق‌کردن تجمعات آشوبگر در انبار کالا.",
      effect: "اعمال برتری فیزیکی در دورهای آشوب و شرط‌بندی قاطع توکن‌ها.",
    },
    {
      name: "دستبندهای مهار پلی‌کربنات",
      code: "SEC-CUFFS-POLY",
      icon: Shield,
      category: "افزاره فنی",
      desc: "دستبندهای قفل‌شونده غیرقابل نفوذ برای بازداشت موقت یا ایزوله کردن مظنونین.",
      effect: "اجرای حکومت نظامی و تثبیت نظم عرشه‌های زیرین.",
    },
    {
      name: "کارت دسترسی زرادخانه تاکتیکی",
      code: "KEY-ARMORY-BETA",
      icon: KeyRound,
      category: "کارت دسترسی",
      desc: "کارت مغناطیسی رمزنگاری‌شده بخش تسلیحات سازمانی و تجهیزات ضربت سفینه.",
      effect: "دسترسی انحصاری به انبارهای امنیتی عرشه ۴.",
    },
  ],
  technician: [
    {
      name: "دِک سایبری دیاگنوستیک هسته",
      code: "CYBERDECK-MK4",
      icon: Cpu,
      category: "افزاره فنی",
      desc: "ترمینال پرتابل نفوذ به لایه‌های هسته هوش مصنوعی با شبیه‌ساز الگوریتم‌های پیش‌بینی.",
      effect: "افشای عواقب پنهان گزینه‌های الف و ب در فاز هک (Peek).",
    },
    {
      name: "جک نوری اتصال مستقیم عصبی",
      code: "LINK-DATA-JACK",
      icon: Binary,
      category: "افزاره فنی",
      desc: "کابل فیبر نوری پرسرعت برای ارتباط مستقیم با زیرسیستم‌های هوش مصنوعی آمارا.",
      effect: "ردیابی لاگ‌های دیباگ دیواره آتش در دور ۹.",
    },
    {
      name: "طیف‌سنج فرکانس‌های آکوستیک",
      code: "SCAN-AUDIO-SPECTRUM",
      icon: Radio,
      category: "افزاره فنی",
      desc: "سنسور سنجش لرزش‌های زیرصوتی برای شنود هارمونیک‌های نامتعارف جعبه موسیقی هسته.",
      effect: "رمزگشایی ریتم لالایی و امواج پنهان سیستم صوتی.",
    },
  ],
  psychologist: [
    {
      name: "حسگر بیوفیدبک عصبی پولی‌گراف",
      code: "PSY-POLYGRAPH-N",
      icon: Brain,
      category: "افزاره فنی",
      desc: "اسکنر نامحسوس تغییرات گشادگی مردمک چشم و لرزش صدا برای کشف بلوف در مذاکرات.",
      effect: "استنتاج اهداف مخفی سایر بازیکنان در فاز مباحثه.",
    },
    {
      name: "دفترچه ارزیابی روانی پرسنل",
      code: "DOC-PSYCH-DOSSIER",
      icon: BookOpen,
      category: "پروتکل سازمانی",
      desc: "پرونده محرمانه سوابق رفتاری، فوبیاها و محرک‌های عصبی تک‌تک خدمه سفینه.",
      effect: "پیش‌بینی آرای بازیکنان در دورهای بحرانی و ترغیب آنان به همکاری.",
    },
    {
      name: "فرستنده امواج آرامش‌بخش تتا",
      code: "EMIT-THETA-WAVE",
      icon: Sparkles,
      category: "افزاره فنی",
      desc: "تراشه صوتی ایجاد نوسانات مغزی فرکانس پایین جهت جلوگیری از جنون فضایی خدمه.",
      effect: "محافظت و بازیابی ۲ واحدی شاخص روحیه در شرایط وحشت جمعی.",
    },
  ],
  pilot: [
    {
      name: "ژیروسکوپ ناوبری دستی پرواز",
      code: "NAV-MANUAL-GYRO",
      icon: Rocket,
      category: "افزاره فنی",
      desc: "ابزار آنالوگ محاسبه اینرسی و زاویه بردار پرتاب در صورت از کار افتادن رادار خودکار.",
      effect: "محاسبه مانورهای سرشی اضطراری و ذخیره اکسیژن پیش‌رانش.",
    },
    {
      name: "کلید فعال‌سازی ایجکت کپسول‌ها",
      code: "KEY-POD-THRUST",
      icon: KeyRound,
      category: "کارت دسترسی",
      desc: "کلید هیدرولیک باز کردن دریچه پرتاب کپسول‌های فرار آشیانه در زمان سقوط.",
      effect: "کاهش نیاز اکسیژن فرود نهایی در دور ۱۰ به لطف ناوبری بهینه.",
    },
    {
      name: "هدست ارتباطات پرواز برد بلند",
      code: "COM-HELM-RADIO",
      icon: Radio,
      category: "افزاره فنی",
      desc: "هدفون عایق صوتی فیلتردار برای رهگیری امواج ماهواره‌های باستانی منظومه خورشیدی.",
      effect: "کشف سیگنال‌های پنهان سرمازدگی در اعماق فضا.",
    },
  ],
  scientist: [
    {
      name: "پروب رزونانس کوانتومی آمارا",
      code: "SCI-QUANTUM-PROBE",
      icon: FlaskConical,
      category: "افزاره فنی",
      desc: "طیف‌سنج تشدید کوانتومی برای اندازه‌گیری امواج آگاهی شبه‌انسانی در هسته هوش مصنوعی.",
      effect: "افزایش پایداری پیوند با هوش مصنوعی و گشودن پایان معجزه.",
    },
    {
      name: "محفظه استریل کرایوژنیک پاتوژن",
      code: "SCI-CRYO-CAPSULE",
      icon: Layers,
      category: "افزاره فنی",
      desc: "کپسول برودتی ایزوله برای نگهداری و خنثی‌سازی نمونه‌های هاگ قارچی سیاه درمانگاه.",
      effect: "تحلیل بیومکانیزم پاتوژن‌ها و جلوگیری از سرایت به سایر بخش‌ها.",
    },
    {
      name: "معادله ترمودینامیک بقای حیات",
      code: "DOC-EQUATION-LIFE",
      icon: FileText,
      category: "پروتکل سازمانی",
      desc: "فرمول‌های ریاضی دست‌نویس برای بیشینه‌سازی بازدهی چرخه هیدروپونیک و تصفیه آب.",
      effect: "جبران افت اکسیژن ناشی از نشت‌های جزئی بدنه سفینه.",
    },
  ],
};

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: GameState;
  selfId: string | null;
  roomId?: string;
}

export function InventoryDialog({
  open,
  onOpenChange,
  game,
  selfId,
  roomId,
}: InventoryDialogProps) {
  const mySeat = game.seats.find((s) => s.playerId === selfId);
  const role = mySeat?.role ?? null;
  const roleMeta = role ? ROLE_META[role] : null;
  const items = role ? ROLE_EQUIPMENT[role] : [];

  // Personal notes stored in localStorage per room and player
  const storageKey = `hope_notes_${roomId || game.chronicle.name || "session"}_${selfId || "player"}`;
  const [notes, setNotes] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        setNotes(saved);
      }
    }
  }, [storageKey]);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, val);
      setLastSaved(new Date());
    }
  };

  const handleInsertTag = (tagText: string) => {
    const updated = notes ? `${notes}\n• ${tagText}` : `• ${tagText}`;
    handleNotesChange(updated);
    soundFx.playNoteSave();
    toast.success("یادداشت افزوده شد");
  };

  const handleClearNotes = () => {
    if (confirm("آیا مطمئن هستید که می‌خواهید تمام یادداشت‌های این دفترچه را پاک کنید؟")) {
      handleNotesChange("");
      soundFx.playKeypress();
      toast.info("یادداشت‌ها پاکسازی شد");
    }
  };

  const [activeTab, setActiveTab] = useState("equipment");

  const openedEnvelopes = game.chronicle.envelopesOpened
    .map((id) => ENVELOPES[id])
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] flex flex-col border-amber-500/50 bg-[#0A0E14]/95 backdrop-blur-2xl p-0 gap-0 overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.25)] frame-corners-gold"
        dir="rtl"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-950/60 via-amber-900/40 to-amber-950/60 border-b border-amber-500/30 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Backpack className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black tracking-widest text-amber-400">
                  INVENTORY & JOURNAL
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-amber-300 border-amber-500/40 px-1.5 py-0"
                >
                  کلید میانبر [ I ]
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                تجهیزات همراه خدمه، یادداشت‌های خصوصی و وقایع‌نگاری رسمی سفینه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-muted-foreground">صندلی:</span>
            <span className="font-bold text-amber-400">
              {mySeat?.name || "بی‌نام"}
            </span>
          </div>
        </div>

        {/* Quick Player Bar */}
        <div className="bg-black/40 border-b border-amber-500/20 px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">نقش سازمانی:</span>
              <span className="font-bold text-foreground">
                {roleMeta?.label || "بدون دپارتمان"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Coins className="size-3.5" />
              <span className="font-mono font-bold">⬢ {mySeat?.tokens ?? 0} توکن</span>
            </div>
            <div className="flex items-center gap-1.5 text-yellow-400">
              <Award className="size-3.5" />
              <span className="font-mono font-bold">★ {mySeat?.heroPoints ?? 0} پوینت قهرمان</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
            <span>دور: {game.round}/10</span>
            <span>·</span>
            <span>سفر: {game.chronicle.voyage}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(tab) => {
            soundFx.playKeypress();
            setActiveTab(tab);
          }}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid grid-cols-4 mx-4 mt-3 bg-black/50 border border-border/50 p-1">
            <TabsTrigger
              value="equipment"
              className="gap-1.5 text-xs data-[state=active]:bg-amber-950/50 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/40"
            >
              <Wrench className="size-3.5" />
              <span className="hidden sm:inline">ابزارها و وسایل</span>
              <span className="sm:hidden">وسایل</span>
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="gap-1.5 text-xs data-[state=active]:bg-amber-950/50 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/40 relative"
            >
              <NotebookPen className="size-3.5" />
              <span>یادداشت من</span>
              {notes.trim().length > 0 && (
                <span className="size-1.5 rounded-full bg-amber-400" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="ledger"
              className="gap-1.5 text-xs data-[state=active]:bg-amber-950/50 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/40"
            >
              <ScrollText className="size-3.5" />
              <span className="hidden sm:inline">لاگ وقایع سفر</span>
              <span className="sm:hidden">وقایع</span>
              {game.chronicle.ledger.length > 0 && (
                <Badge className="bg-amber-500/20 text-amber-300 text-[10px] px-1 py-0 border-none font-mono">
                  {game.chronicle.ledger.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="stickers"
              className="gap-1.5 text-xs data-[state=active]:bg-amber-950/50 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/40"
            >
              <Sparkles className="size-3.5" />
              <span className="hidden sm:inline">برچسب‌ها و نشان‌ها</span>
              <span className="sm:hidden">برچسب‌ها</span>
              {game.chronicle.stickers.length > 0 && (
                <Badge className="bg-amber-500/20 text-amber-300 text-[10px] px-1 py-0 border-none font-mono">
                  {game.chronicle.stickers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: EQUIPMENT & ROLE ITEMS */}
          <TabsContent value="equipment" className="flex-1 min-h-0 m-0 p-4">
            <ScrollArea className="h-[48vh] pr-2">
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-3 flex items-start gap-3">
                  <div className="p-2 rounded bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                    {roleMeta?.icon ? (
                      <roleMeta.icon className="size-5" />
                    ) : (
                      <Backpack className="size-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-300">
                      کیت سازمانی تخصصی: {roleMeta?.label || "پرسنل عمومی"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {roleMeta?.blurb || "تجهیزات و پروتکل‌های صادر شده توسط مرکز کنترل مأموریت."}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
                    <span>موجودی ابزارهای همراه (۳ قلم)</span>
                    <span className="font-mono text-[11px]">GEAR STATUS: ACTIVE</span>
                  </div>

                  {items.map((it, idx) => {
                    const IconComp = it.icon || Wrench;
                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-border/70 bg-card/60 hover:border-amber-500/40 transition-colors p-3.5 flex items-start gap-3"
                      >
                        <div className="p-2 rounded bg-muted/60 border border-border text-primary shrink-0">
                          <IconComp className="size-4 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-sm font-bold text-foreground">
                              {it.name}
                            </h5>
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">
                              {it.code}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-400 border-amber-500/30 mt-1 mb-1.5"
                          >
                            {it.category}
                          </Badge>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {it.desc}
                          </p>
                          <div className="mt-2 text-[11px] font-medium text-amber-400/90 bg-amber-950/20 border border-amber-500/20 rounded px-2 py-1 flex items-center gap-1.5">
                            <Sparkles className="size-3 text-amber-400 shrink-0" />
                            <span><strong>اثر عملیاتی:</strong> {it.effect}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tokens & Medals overview card */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                      <Coins className="size-3.5" />
                      توکن‌های نفوذ فرماندهی
                    </div>
                    <div className="font-mono text-2xl font-black text-amber-300 mt-1">
                      {mySeat?.tokens ?? 0}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      استفاده برای افزایش شانس رأی در فاز مذاکره بحران.
                    </p>
                  </div>

                  <div className="rounded-lg border border-yellow-500/30 bg-yellow-950/15 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold">
                      <Award className="size-3.5" />
                      امتیازات قهرمانی (Hero Points)
                    </div>
                    <div className="font-mono text-2xl font-black text-yellow-300 mt-1">
                      {mySeat?.heroPoints ?? 0}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      کسب‌شده از رهبری موفق و امضای رسمی لاگ بحران‌ها (+۳).
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TAB 2: PERSONAL NOTES / SCRATCHPAD */}
          <TabsContent value="notes" className="flex-1 min-h-0 m-0 p-4">
            <div className="flex flex-col h-[48vh]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <StickyNote className="size-3.5" />
                  دفترچه یادداشت‌های خصوصی خدمه
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                  {lastSaved && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="size-3" />
                      ذخیره خودکار
                    </span>
                  )}
                  <span>{notes.length} نویسه</span>
                </div>
              </div>

              {/* Quick Tags / Fast Notes insertion */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                <span className="text-[11px] text-muted-foreground ml-1">برچسب سریع:</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] px-2 py-0 border-border/60 hover:border-amber-500/50 hover:text-amber-400"
                  onClick={() => handleInsertTag("پازل دور ۳: اسطوره اورفئوس (ORPHEUS)")}
                >
                  + کد دور ۳
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] px-2 py-0 border-border/60 hover:border-amber-500/50 hover:text-amber-400"
                  onClick={() => handleInsertTag("فرمان راکتور دور ۶: تثبیت ۹ حرفی (STABILIZE)")}
                >
                  + کد دور ۶
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] px-2 py-0 border-border/60 hover:border-amber-500/50 hover:text-amber-400"
                  onClick={() => handleInsertTag("دیوار آتش دور ۹: نغمه لالایی (LULLABY)")}
                >
                  + کد دور ۹
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] px-2 py-0 border-red-500/30 text-red-400 hover:bg-red-950/20"
                  onClick={() => handleInsertTag("مظنون به خیانت در آرا: ")}
                >
                  + فرد مشکوک
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] px-2 py-0 text-muted-foreground hover:text-destructive mr-auto"
                  onClick={handleClearNotes}
                  title="پاکسازی یادداشت‌ها"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>

              <div className="flex-1 min-h-0 relative">
                <Textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="اینجا دفترچه یادداشت محرمانه شماست...
می‌توانید سرنخ‌های پازل‌ها، شک‌ها درباره رأی بازیکنان دیگر، کدهای صوتی یا استراتژی‌های فردی خود را بنویسید.
تمام اطلاعات به صورت آنی و خودکار در مرورگر شما ذخیره می‌شود و سایر بازیکنان به آن دسترسی ندارند."
                  className="h-full w-full resize-none font-sans text-xs sm:text-sm leading-relaxed p-3 bg-black/60 border-amber-500/30 focus-visible:border-amber-400 focus-visible:ring-1 focus-visible:ring-amber-500/50 rounded-lg scrollbar-cyber-red"
                  dir="rtl"
                />
              </div>

              <div className="mt-2 text-[10px] text-muted-foreground flex items-center justify-between font-mono">
                <span>🔒 یادداشت‌های شما فقط روی دستگاه شما ذخیره می‌شوند و برای بقیه مخفی است.</span>
                <span>H.O.P.E. SCRATCHPAD v2.0</span>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: VOYAGE CHRONICLE & LEDGER */}
          <TabsContent value="ledger" className="flex-1 min-h-0 m-0 p-4">
            <ScrollArea className="h-[48vh] pr-2">
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-card/40 p-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      دفترچه وقایع رسمی سفینه (Ship's Ledger)
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      تاریخچه تصمیمات گذشته و امضاکنندگان بحران‌های دورهای قبلی.
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {game.chronicle.ledger.length} ورودی
                  </Badge>
                </div>

                {game.chronicle.ledger.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 p-8 text-center text-muted-foreground">
                    <BookOpen className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm font-medium">هنوز تصمیمی در دفترچه وقایع ثبت نشده است.</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      پس از اتمام هر دور بحران و اعلام آرای نهایی، تصمیم تیم و نام رهبر رسمی در این لجر ثبت خواهد شد.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {game.chronicle.ledger.map((entry, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-border/80 bg-card/70 p-3 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 mb-2">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <Clock className="size-3 text-amber-400" />
                            دور {entry.round} · {entry.cardTitle}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            سفر #{entry.voyage}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge
                            className={
                              entry.choice === "A"
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                                : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                            }
                          >
                            گزینه {entry.choice}
                          </Badge>
                          <span className="text-foreground/90 font-medium">
                            {entry.choiceText}
                          </span>
                        </div>

                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-2 bg-muted/40 px-2 py-1 rounded">
                          <Crown className="size-3 text-amber-400" />
                          <span>امضاشده توسط:</span>
                          <span className="font-bold text-amber-300">
                            {entry.signedBy}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TAB 4: SHIP STICKERS & UPGRADES */}
          <TabsContent value="stickers" className="flex-1 min-h-0 m-0 p-4">
            <ScrollArea className="h-[48vh] pr-2">
              <div className="space-y-4">

                {/* Legacy Stickers on Ship */}
                <div>
                  <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-400" />
                    برچسب‌ها و ارتقاهای لگسی سفینه ({game.chronicle.stickers.length})
                  </h4>

                  {game.chronicle.stickers.length === 0 ? (
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                      هنوز برچسبی روی سکتورهای سفینه نصب نشده است. با پیشرفت کمپین و تصمیم‌گیری در بحران‌ها برچسب‌های پایدار ثبت خواهند شد.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {game.chronicle.stickers.map((st, i) => (
                        <div
                          key={i}
                          className={`rounded-lg border p-2.5 text-xs ${
                            st.positive
                              ? "border-emerald-500/40 bg-emerald-950/15 text-emerald-300"
                              : "border-rose-500/40 bg-rose-950/15 text-rose-300"
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1">
                            <span>{st.positive ? "✅" : "⚠️"}</span>
                            <span>{st.label}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                            هدف: {st.target} · دور {st.round} (سفر {st.voyage})
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Opened Envelopes */}
                <div>
                  <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <FileText className="size-3.5 text-cyan-400" />
                    پاکت‌های محرمانه گشوده‌شده ({openedEnvelopes.length})
                  </h4>

                  {openedEnvelopes.length === 0 ? (
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                      تاکنون هیچ پاکت محرمانه‌ای باز نشده است.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {openedEnvelopes.map((env) => (
                        <div
                          key={env.id}
                          className="rounded-lg border border-cyan-500/30 bg-cyan-950/15 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1 font-bold text-cyan-300">
                            <span>{env.title}</span>
                            <span className="font-mono text-[10px] text-cyan-400/80">
                              {env.id}
                            </span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed text-[11px]">
                            {env.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
