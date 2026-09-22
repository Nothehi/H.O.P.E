"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Target,
  User,
  FolderLock,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  AlertTriangle,
  Radio,
  Coins,
  Award,
  PenTool,
  Shield,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AGENDAS, ENVELOPES, agendaMet } from "@/lib/game/content";
import type { GameState, Seat } from "@/lib/game/types";
import { ROLE_META } from "./meta";
import { soundFx } from "@/lib/game/audio";

interface ClassifiedDossierDialogProps {
  game: GameState;
  selfId: string | null;
}

export function ClassifiedDossierDialog({
  game,
  selfId,
}: ClassifiedDossierDialogProps) {
  const [open, setOpen] = useState(false);
  const mySeat = game.seats.find((s) => s.playerId === selfId);

  if (!mySeat) return null;

  const agenda = mySeat.agendaId ? AGENDAS[mySeat.agendaId] : null;
  const roleMeta = mySeat.role ? ROLE_META[mySeat.role] : null;
  const isAgendaCurrentlyMet = agenda
    ? agendaMet(agenda.id, mySeat, game)
    : false;
  const isOfficer =
    game.stage === "playing" &&
    game.seats[game.officerSeat]?.playerId === mySeat.playerId;

  const openedEnvelopes = game.chronicle.envelopesOpened
    .map((id) => ENVELOPES[id])
    .filter(Boolean);

  const [activeTab, setActiveTab] = useState("agenda");

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      soundFx.playClassifiedOpen();
      setActiveTab("agenda");
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-red-500/50 bg-red-950/30 text-red-400 hover:bg-red-900/40 hover:text-red-200 hover:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)] font-bold transition-all flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-red-500 animate-pulse" />
            مشاهده پرونده محرمانه
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-2xl border-red-500/50 bg-[#0B1117]/95 backdrop-blur-2xl p-0 gap-0 overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.25)] frame-corners-red"
        dir="rtl"
      >
        {/* Top Confidential Caution Ribbon */}
        <div className="bg-red-950/80 border-b border-red-500/40 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-red-400 tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-red-500 animate-ping" />
            طبقهٔ امنیتی: فوق‌محرمانه // EYES ONLY
          </span>
          <span className="text-red-400/70">H.O.P.E. CLASSIFIED ARCHIVE // LVL 5</span>
        </div>

        {/* Dialog Header */}
        <DialogHeader className="p-4 pb-2 text-right border-b border-red-500/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-red-400 flex items-center gap-2 text-lg font-black tracking-wide">
              <ShieldAlert className="size-5 text-red-500" />
              پرونده پرسنلی و اطلاعات محرمانه
            </DialogTitle>
            <Badge
              variant="outline"
              className="border-red-500/50 text-red-400 bg-red-950/40 text-[10px] font-mono"
            >
              کد خدمه: {mySeat.name}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            این داده‌ها صرفاً برای موقعیت شغلی و مسئولیت شما تفکیک شده‌اند.
            افشای مستقیم محتویات برای سایر خدمه نقض پروتکل‌های سفینه است.
          </p>
        </DialogHeader>

        {/* Tabs System */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-red-950/40 border-b border-red-500/30 p-1.5 rounded-none gap-1 h-auto">
            <TabsTrigger
              value="agenda"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(239,68,68,0.6)] text-xs text-red-300/70 hover:text-red-200 font-bold py-2 rounded-none transition-all flex items-center gap-1.5 justify-center"
            >
              <Target className="size-3.5" />
              <span>دستورکار</span>
            </TabsTrigger>

            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(239,68,68,0.6)] text-xs text-red-300/70 hover:text-red-200 font-bold py-2 rounded-none transition-all flex items-center gap-1.5 justify-center"
            >
              <User className="size-3.5" />
              <span>سوابق</span>
            </TabsTrigger>

            <TabsTrigger
              value="envelopes"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_12px_rgba(239,68,68,0.6)] text-xs text-red-300/70 hover:text-red-200 font-bold py-2 rounded-none transition-all flex items-center gap-1.5 justify-center"
            >
              <FolderLock className="size-3.5" />
              <span>پاکت‌ها</span>
              {openedEnvelopes.length > 0 && (
                <span className="mr-1 text-[10px] bg-red-900/80 px-1 py-0.2 rounded font-mono">
                  {openedEnvelopes.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: دستورکار محرمانه (SECRET AGENDA) */}
          <TabsContent value="agenda" className="m-0 focus-visible:outline-none">
            <ScrollArea className="h-[360px] sm:h-[390px] p-4 scrollbar-cyber-red [&_[data-slot=scroll-area-thumb]]:bg-red-500 [&_[data-slot=scroll-area-thumb]]:shadow-[0_0_10px_#ef4444] [&_[data-slot=scroll-area-scrollbar]]:border-l-red-950/60 [&_[data-slot=scroll-area-scrollbar]]:bg-red-950/20">
              <div className="space-y-4">
                {agenda ? (
                  <>
                    <div className="rounded-none border border-red-500/40 bg-red-950/20 p-4 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-red-400/70 block uppercase">
                            ماموریت فردی مخفی // SECRET DIRECTIVE
                          </span>
                          <h4 className="text-base font-black text-foreground mt-0.5">
                            {agenda.title}
                          </h4>
                        </div>
                        <Badge className="bg-red-600/30 text-red-300 border-red-500/40 font-mono text-xs shrink-0">
                          +{agenda.points} امتیاز پیروزی
                        </Badge>
                      </div>

                      <p className="text-sm text-foreground/90 leading-relaxed font-mono bg-[#0B1117]/60 p-3 rounded-none border border-red-950">
                        {agenda.description}
                      </p>

                      {/* Live Goal Status Evaluation */}
                      <div
                        className={`flex items-center gap-2 p-2.5 text-xs font-mono rounded-none border ${
                          isAgendaCurrentlyMet
                            ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-400"
                            : "bg-amber-950/20 border-amber-500/30 text-amber-400"
                        }`}
                      >
                        {isAgendaCurrentlyMet ? (
                          <>
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                            <span>
                              شرایط در وضعیت فعلی سفینه محقق است (+{agenda.points} امتیاز در دسترس). برای حفظ آن تلاش کنید!
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock className="size-4 shrink-0 text-amber-400" />
                            <span>
                              شرایط در وضعیت کنونی برآورده نشده است. در رای‌گیری‌ها و بحران‌های بعدی مسیر دستیابی را شکل دهید.
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-card/60 border border-red-500/20 rounded-none space-y-2 text-xs text-muted-foreground font-mono">
                      <p className="font-bold text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="size-3.5 text-red-400" />
                        نکته استراتژیک برای برد بازی:
                      </p>
                      <p className="leading-relaxed">
                        برای برنده شدن باید بین «بقاء کلی سفینه» و «دستورکار محرمانه» خود تعادل برقرار کنید. اگر سفینه سقوط کند یا دچار فاجعه شود، هیچ امتیازی به هیچ‌کس تعلق نمی‌گیرد.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    دستورکار محرمانه‌ای برای این صندلی تعیین نشده است.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TAB 2: سوابق و مشخصات پرسنلی (PERSONNEL PROFILE) */}
          <TabsContent value="profile" className="m-0 focus-visible:outline-none">
            <ScrollArea className="h-[360px] sm:h-[390px] p-4 scrollbar-cyber-red [&_[data-slot=scroll-area-thumb]]:bg-red-500 [&_[data-slot=scroll-area-thumb]]:shadow-[0_0_10px_#ef4444] [&_[data-slot=scroll-area-scrollbar]]:border-l-red-950/60 [&_[data-slot=scroll-area-scrollbar]]:bg-red-950/20">
              <div className="space-y-4 font-mono text-right">
                {/* Role Card */}
                <div className="rounded-none border border-red-500/40 bg-red-950/20 p-4 flex items-center gap-3">
                  {roleMeta?.icon && (
                    <div className="size-12 rounded-none bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                      <roleMeta.icon className="size-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-red-400/70 block">
                      نقش سازمانی در سفینه H.O.P.E.
                    </span>
                    <h4 className="text-base font-black text-foreground">
                      {roleMeta?.label ?? mySeat.role}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {roleMeta?.blurb}
                    </p>
                  </div>
                </div>

                {/* Personnel Metric Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-card/60 border border-red-500/20 space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <Coins className="size-3.5 text-amber-400" />
                      توکن‌های فرماندهی:
                    </span>
                    <span className="text-base font-bold text-foreground">
                      {mySeat.tokens} ⬢
                    </span>
                  </div>

                  <div className="p-3 bg-card/60 border border-red-500/20 space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <Award className="size-3.5 text-cyan-400" />
                      امتیاز قهرمانی:
                    </span>
                    <span className="text-base font-bold text-foreground">
                      {mySeat.heroPoints} ★
                    </span>
                  </div>

                  <div className="p-3 bg-card/60 border border-red-500/20 space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <PenTool className="size-3.5 text-purple-400" />
                      امضاهای رسمی لاگ:
                    </span>
                    <span className="text-base font-bold text-foreground">
                      {mySeat.signCount} امضا
                    </span>
                  </div>

                  <div className="p-3 bg-card/60 border border-red-500/20 space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <Shield className="size-3.5 text-red-400" />
                      وضعیت شیفت و وتو:
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        isOfficer ? "text-amber-400" : "text-foreground"
                      }`}
                    >
                      {isOfficer ? "افسر ارشد (دارای وتو) 👑" : "کادر رسمی پرواز"}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#0B1117]/80 border border-red-950 text-[11px] text-muted-foreground leading-relaxed">
                  🔒 پروانهٔ پرواز و بیومتریک شما در سیستم ناوبری ثبت شده است. در صورت رسیدن به شرایط پایان، دستاوردهای شما در کرونیکل ثبت دائم خواهد شد.
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TAB 4: پاکت‌های آزادشده (OPENED CHRONICLE ENVELOPES) */}
          <TabsContent value="envelopes" className="m-0 focus-visible:outline-none">
            <ScrollArea className="h-[360px] sm:h-[390px] p-4 scrollbar-cyber-red [&_[data-slot=scroll-area-thumb]]:bg-red-500 [&_[data-slot=scroll-area-thumb]]:shadow-[0_0_10px_#ef4444] [&_[data-slot=scroll-area-scrollbar]]:border-l-red-950/60 [&_[data-slot=scroll-area-scrollbar]]:bg-red-950/20">
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs text-red-400 pb-1 border-b border-red-500/20">
                  <span className="flex items-center gap-1.5">
                    <Radio className="size-3.5 animate-pulse text-red-500" />
                    پاکت‌های رمزگشایی‌شده تا این لحظه
                  </span>
                  <span>{openedEnvelopes.length} پاکت آزاد</span>
                </div>

                {openedEnvelopes.length > 0 ? (
                  openedEnvelopes.map((env) => (
                    <div
                      key={env.id}
                      className="rounded-none border border-red-500/30 bg-[#0B1117]/90 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-sm text-foreground">
                          {env.title}
                        </h5>
                        {env.sticker && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-amber-500/40 text-amber-300 bg-amber-950/30"
                          >
                            🏷️ {env.sticker.label}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed bg-black/40 p-2.5 border border-red-950">
                        {env.text}
                      </p>

                      {env.addCards && env.addCards.length > 0 && (
                        <p className="text-[11px] text-red-400/80">
                          ➕ {env.addCards.length} کارت بحران ویژه به دسته‌ی بازی اضافه گردید.
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
                    <FolderLock className="size-8 mx-auto text-muted-foreground/40 stroke-1" />
                    <p>تاکنون هیچ پاکت محرمانه‌ای رمزگشایی نشده است.</p>
                    <p className="text-[11px] text-muted-foreground/60">
                      با عبور از بحران‌های ویژه و حل موفق پازل‌ها، پاکت‌های رازآلود باز خواهند شد.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
