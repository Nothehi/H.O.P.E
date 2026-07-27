"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { GameView } from "@/components/game/game-view";
import { isValidRoomId, normalizeRoomId } from "@/lib/protocol";

function RoomGate({ roomId }: { roomId: string }) {
  const router = useRouter();

  // null = still reading sessionStorage; "" = no name saved, ask for one.
  const [name, setName] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    // Hydration-safe one-time read of per-tab state: the creator flag
    // survives a refresh of the creator's tab but never travels with a
    // shared link. sessionStorage doesn't exist during SSR, so this must
    // run after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCreate(sessionStorage.getItem(`wt-create:${roomId}`) === "1");
    setName(sessionStorage.getItem("wt-name") ?? "");
  }, [roomId]);

  if (!isValidRoomId(roomId)) {
    return (
      <main className="flex flex-1 items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">شناسه سفینه نامعتبر است</CardTitle>
            <CardDescription>«{roomId}» یک کد معتبر برای سفینه نیست.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")}>بازگشت به صفحه اصلی</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (name === null) return null;

  if (name === "") {
    const submit = () => {
      const trimmed = nameInput.trim();
      if (!trimmed) {
        toast.error("لطفاً نام نمایشی خود را وارد کنید.");
        return;
      }
      sessionStorage.setItem("wt-name", trimmed);
      setName(trimmed);
    };
    return (
      <main className="flex flex-1 items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-right">
            <CardTitle>ورود به سفینه {roomId}</CardTitle>
            <CardDescription>
              دفترچه اصلی سفینه نام شما را به عنوان خدمه ثبت خواهد کرد.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              autoFocus
              placeholder="نام نمایشی"
              value={nameInput}
              maxLength={32}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <Button onClick={submit}>ادامه و ورود</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <GameView roomId={roomId} displayName={name} create={create} />;
}

function RoomFromQuery() {
  const searchParams = useSearchParams();
  const roomId = normalizeRoomId(searchParams.get("id") ?? "");
  return <RoomGate roomId={roomId} />;
}

export default function RoomPage() {
  return (
    <Suspense fallback={null}>
      <RoomFromQuery />
    </Suspense>
  );
}
