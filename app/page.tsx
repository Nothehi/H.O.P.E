"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Satellite, Plus, LogIn } from "lucide-react";
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
      toast.error("Pick a display name first.");
      return null;
    }
    return trimmed;
  };

  const enterRoom = (roomId: string, create: boolean) => {
    const displayName = requireName();
    if (!displayName) return;
    setBusy(true);
    sessionStorage.setItem("wt-name", displayName);
    // Per-tab flag: this tab owns the room beacon. Never part of the URL,
    // so shared links always join instead of trying to re-create.
    if (create) sessionStorage.setItem(`wt-create:${roomId}`, "1");
    router.push(`/room/${roomId}`);
  };

  const handleCreate = () => enterRoom(generateRoomId(), true);

  const handleJoin = () => {
    const roomId = normalizeRoomId(roomInput);
    if (!isValidRoomId(roomId)) {
      toast.error("Room IDs are 4–32 letters, digits, or dashes.");
      return;
    }
    enterRoom(roomId, false);
  };

  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Satellite className="size-6" />
          </div>
          <CardTitle className="text-2xl font-black tracking-wide">
            H.O.P.E.
          </CardTitle>
          <CardDescription>
            A legacy board game for 3–8 crew of a dying generation ship —
            cooperative survival, social deduction, and permanent consequences.
            Peer-to-peer over WebRTC; the campaign Chronicle lives in your
            browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Display name
            </label>
            <Input
              id="name"
              placeholder="e.g. Hossein"
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
            <Plus className="size-4" />
            Launch a ship
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">
              or board an existing one
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ship code"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <Button variant="secondary" onClick={handleJoin} disabled={busy}>
              <LogIn className="size-4" />
              Join
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
