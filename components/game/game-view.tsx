"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Check,
  Copy,
  Crown,
  Eye,
  Loader2,
  LogOut,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGame } from "@/hooks/use-game";
import type { RoomEvent } from "@/hooks/use-peer-room";
import { AGENDAS, CARDS, CLUES } from "@/lib/game/content";
import { FINAL_ROUND, type GameState, type Seat } from "@/lib/game/types";
import { ShipBoard } from "./board";
import { Comms } from "./comms";
import { DilemmaPanel } from "./dilemma";
import { EndingPanel } from "./ending";
import { Lobby } from "./lobby";
import { PuzzlePanel } from "./puzzle";
import { ROLE_META } from "./meta";

function SeatRow({ seat, isOfficer }: { seat: Seat; isOfficer: boolean }) {
  const meta = seat.role ? ROLE_META[seat.role] : null;
  const Icon = meta?.icon;
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
        seat.connected ? "" : "opacity-40"
      }`}
    >
      <span
        className={`size-1.5 shrink-0 rounded-full ${
          seat.connected ? "bg-emerald-400" : "bg-muted-foreground"
        }`}
      />
      {Icon ? (
        <Icon className="size-4 shrink-0 text-muted-foreground" />
      ) : (
        <span className="size-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {seat.name}
          {isOfficer && (
            <Crown className="ml-1 inline size-3.5 text-amber-500" />
          )}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {meta?.label ?? "no department"}
        </p>
      </div>
      <span className="font-mono text-xs text-muted-foreground">
        ⬢{seat.tokens} · ★{seat.heroPoints}
      </span>
    </div>
  );
}

function CrewPanel({
  game,
  selfId,
}: {
  game: GameState;
  selfId: string | null;
}) {
  const mySeat = game.seats.find((s) => s.playerId === selfId);
  const agenda = mySeat?.agendaId ? AGENDAS[mySeat.agendaId] : null;
  return (
    <div className="flex h-full min-h-0 flex-col" dir="rtl">
      <ScrollArea className="flex-1 px-2 py-2">
        {game.seats.map((seat, i) => (
          <SeatRow
            key={seat.playerId}
            seat={seat}
            isOfficer={game.stage === "playing" && i === game.officerSeat}
          />
        ))}
        {mySeat && game.stage !== "lobby" && (
          <div className="mt-3 space-y-2 rounded-none border border-dashed border-primary/40 bg-card p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
              <Eye className="size-3.5 ml-1" />
              پرونده محرمانه شما — کاملاً مخفی نگه دارید
            </p>
            {agenda && (
              <div className="text-xs">
                <p className="font-semibold">
                  {agenda.title}{" "}
                  <span className="text-muted-foreground">
                    (+{agenda.points} امتیاز)
                  </span>
                </p>
                <p className="text-muted-foreground">{agenda.description}</p>
              </div>
            )}
            {(mySeat.clueIds ?? []).map((id) => (
              <p key={id} className="text-[11px] italic text-secondary-foreground">
                🔑 {CLUES[id]?.text}
              </p>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export function GameView({
  roomId,
  displayName,
  create,
}: {
  roomId: string;
  displayName: string;
  create: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showSide, setShowSide] = useState(false);
  const [sideTab, setSideTab] = useState("crew");
  // How many messages have been seen; the Comms tab being open marks all read.
  const [readCount, setReadCount] = useState(0);

  const onEvent = useCallback((event: RoomEvent) => {
    switch (event.kind) {
      case "join":
        toast.success(`${event.name} وارد سفینه شد`);
        break;
      case "leave":
        toast.info(`${event.name || "یکی از خدمه"} سفینه را ترک کرد`);
        break;
      case "beacon-claimed":
        toast.info("شما اکنون هدایت‌کننده اصلی سفینه (میزبان) هستید");
        break;
      case "room-closed":
        toast.error("ارتباط با سفینه قطع شد");
        break;
    }
  }, []);

  const { status, error, selfId, isHost, members, messages, sendChat, game, dispatch } =
    useGame(roomId, displayName, create, onEvent);

  useEffect(() => {
    if (sideTab === "comms") setReadCount(messages.length);
  }, [sideTab, messages.length]);

  const unreadCount =
    sideTab === "comms"
      ? 0
      : messages.reduce(
          (n, m, i) => (i >= readCount && !m.own ? n + 1 : n),
          0,
        );

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    toast.success("کد سفینه کپی شد");
    setTimeout(() => setCopied(false), 1_500);
  };

  const leave = () => {
    sessionStorage.removeItem(`wt-create:${roomId}`);
    router.push("/");
  };

  const activeCard = game?.currentCardId ? CARDS[game.currentCardId] : null;
  const activeZone =
    game?.stage === "playing"
      ? game.phase === "puzzle" && game.puzzle
        ? game.puzzle.puzzleId === "lock3"
          ? "Pod Bay"
          : "AI Core"
        : (activeCard?.zone ?? null)
      : null;

  const phaseLabel =
    game?.stage === "playing"
      ? {
          reveal: "آشکارسازی بحران",
          peek: "هک سیستم‌های پیش‌بینی",
          debate: "گفتگو و رای‌گیری",
          resolution: "نتیجه و پیامدها",
          puzzle: "قفل امنیتی سیستم",
        }[game.phase]
      : null;

  const sidebar = game && (
    <Tabs
      value={sideTab}
      onValueChange={setSideTab}
      className="flex h-full min-h-0 flex-col"
    >
      <TabsList className="mx-2 mt-2">
        <TabsTrigger value="crew" className="flex-1">
          خدمه سفینه
        </TabsTrigger>
        <TabsTrigger value="comms" className="flex-1 gap-1.5">
          ارتباطات
          {unreadCount > 0 && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground tabular-nums">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="crew" className="min-h-0 flex-1">
        <CrewPanel game={game} selfId={selfId} />
      </TabsContent>
      <TabsContent value="comms" className="min-h-0 flex-1">
        <Comms
          messages={messages}
          sendChat={sendChat}
          connected={status === "connected"}
        />
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="flex h-dvh flex-col" dir="rtl">
      <header className="flex items-center gap-2 border-b bg-card/80 px-4 py-2.5">
        <span className="font-mono text-xs font-black tracking-widest text-primary border border-primary px-2 py-0.5">
          H.O.P.E.
        </span>
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant="outline" className="hidden font-mono sm:inline-flex">
            کد: {roomId}
          </Badge>
          {isHost && (
            <Badge variant="outline" className="gap-1 text-primary border-primary/50">
              <Crown className="size-3 ml-1" /> میزبان
            </Badge>
          )}
          {game?.stage === "playing" && (
            <Badge className="hidden md:inline-flex">
              سفر {game.chronicle.voyage} · دور {game.round}/{FINAL_ROUND}{" "}
              · {phaseLabel}
            </Badge>
          )}
        </div>
        <div className="mr-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyRoomId}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            <span className="hidden sm:inline">کپی کد</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="relative lg:hidden"
            onClick={() => setShowSide((v) => !v)}
          >
            <Users className="size-4" />
            {members.filter((m) => m.status === "connected").length}
            {unreadCount > 0 && (
              <span
                className="absolute -right-1 -top-1 size-2.5 rounded-full bg-primary ring-2 ring-background"
                aria-label={`${unreadCount} پیام خوانده نشده`}
              />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={leave}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">ترک سفینه</span>
          </Button>
        </div>
      </header>

      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={leave}>
            Back home
          </Button>
        </div>
      ) : !game ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {status === "connecting"
              ? "Docking with the ship…"
              : "Waiting for the ship's state…"}
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-72 shrink-0 overflow-y-auto border-r p-3 md:block">
            <ShipBoard game={game} activeZone={activeZone} />
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto p-4">
            {game.stage === "lobby" && (
              <Lobby game={game} selfId={selfId} dispatch={dispatch} />
            )}
            {game.stage === "playing" &&
              (game.phase === "puzzle" ? (
                <PuzzlePanel game={game} selfId={selfId} dispatch={dispatch} />
              ) : (
                <DilemmaPanel
                  key={game.currentCardId ?? `r${game.round}`}
                  game={game}
                  selfId={selfId}
                  dispatch={dispatch}
                />
              ))}
            {game.stage === "ended" && (
              <EndingPanel game={game} selfId={selfId} dispatch={dispatch} />
            )}
            <div className="mt-6 md:hidden">
              <ShipBoard game={game} activeZone={activeZone} />
            </div>
          </main>

          <aside className="hidden w-72 shrink-0 border-l lg:block">
            {sidebar}
          </aside>
        </div>
      )}

      {showSide && game && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setShowSide(false)}
        >
          <div
            className="absolute inset-y-0 right-0 w-80 border-l bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebar}
          </div>
        </div>
      )}
    </div>
  );
}
