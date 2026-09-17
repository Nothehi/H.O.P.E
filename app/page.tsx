"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LogIn, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  generateRoomId,
  isValidRoomId,
  normalizeRoomId,
} from "@/lib/protocol";
import { RoomCodeInput } from "@/components/game/room-code-input";
import { NetworkSettingsDialog } from "@/components/game/network-settings-dialog";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [busy, setBusy] = useState(false);

  const requireName = (): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("لطفاً ابتدا نام نمایشی خود را وارد کنید.");
      return null;
    }
    return trimmed;
  };

  const enterRoom = (roomId: string, create: boolean) => {
    const displayName = requireName();
    if (!displayName) return;
    setBusy(true);
    sessionStorage.setItem("wt-name", displayName);
    if (create) sessionStorage.setItem(`wt-create:${roomId}`, "1");
    
    // Smooth navigation with fallback for mobile browsers
    const targetUrl = `/room?id=${encodeURIComponent(roomId)}`;
    try {
      router.push(targetUrl);
    } catch {
      window.location.href = targetUrl;
    }
    setTimeout(() => setBusy(false), 4000);
  };

  const handleCreate = () => enterRoom(generateRoomId(), true);

  const handleJoin = () => {
    const roomId = normalizeRoomId(roomInput);
    if (!isValidRoomId(roomId)) {
      toast.error("کد سفینه باید بین ۴ تا ۳۲ حرف یا عدد باشد.");
      return;
    }
    enterRoom(roomId, false);
  };

  return (
    <main className="flex flex-1 items-center justify-center p-4 md:p-8" dir="rtl">
      <Card className="frame-corners w-full max-w-lg border">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <span className="font-mono text-xs font-bold tracking-widest text-secondary-foreground border border-secondary-foreground/40 bg-secondary/60 px-3 py-1">
              // SYSTEM_TERMINAL_V2.0.77
            </span>
          </div>
          <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-primary drop-shadow-[0_0_12px_rgba(252,238,10,0.3)] break-words whitespace-normal text-balance">
            H.O.P.E.
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed text-muted-foreground mt-3">
            بازی ماجرایی و بقای سفینه نسل آخر — برای ۳ تا ۸ نفر خدمه.
            تصمیم‌گیری‌های گروهی، نبرد برای بقا و ثبت عواقب دائمی در دفترچه سفینه.
            ارتباط همتا‌به‌همتا (P2P) بدون نیاز به سرور مرکزی.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="space-y-2 text-right">
            <label
              htmlFor="name"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              نام / شناسه خدمه
            </label>
            <Input
              id="name"
              placeholder="مثلاً: حسین"
              value={name}
              maxLength={32}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleCreate}
            disabled={busy}
          >
            <Plus className="size-4 ml-2" />
            پرتاب و راه اندازی سفینه جدید
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              یا ورود به سفینه‌ای دیگر
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block text-right">
                کد اختصاصی ۶ حرفی سفینه:
              </label>
              <div className="py-2">
                <RoomCodeInput
                  value={roomInput}
                  onChange={setRoomInput}
                  onEnter={handleJoin}
                  disabled={busy}
                />
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full gap-2 font-bold"
              size="lg"
              onClick={handleJoin}
              disabled={busy || roomInput.trim().length < 4}
            >
              <LogIn className="size-4" />
              ورود به سفینه
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
            <NetworkSettingsDialog
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] gap-1.5 text-muted-foreground hover:text-cyan-400 px-2"
                >
                  <Wifi className="size-3" />
                  تنظیمات شبکه و سیگنالینگ
                </Button>
              }
            />
            <span className="text-[10px] text-muted-foreground font-mono">
              H.O.P.E. v2.0 · LAN & P2P
            </span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
