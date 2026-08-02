"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LogIn } from "lucide-react";
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
    router.push(`/room?id=${encodeURIComponent(roomId)}`);
  };

  const handleCreate = () => enterRoom(generateRoomId(), true);

  const handleJoin = () => {
    const roomId = normalizeRoomId(roomInput);
    if (!isValidRoomId(roomId)) {
      toast.error("کد سفینه باید بین ۴ تا ۳۲ حرف، عدد یا خط تیره باشد.");
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

          <div className="flex gap-2">
            <Input
              placeholder="کد اختصاصی سفینه"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <Button variant="secondary" onClick={handleJoin} disabled={busy}>
              <LogIn className="size-4 ml-1" />
              ورود
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
