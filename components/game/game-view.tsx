"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Backpack,
  Check,
  Copy,
  Crown,
  Loader2,
  LogOut,
  Radio,
  Settings,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGame } from "@/hooks/use-game";
import type { RoomEvent } from "@/hooks/use-peer-room";
import { CARDS } from "@/lib/game/content";
import { FINAL_ROUND, type GameState, type Seat } from "@/lib/game/types";
import { ShipBoard } from "./board";
import { Comms } from "./comms";
import { DilemmaPanel } from "./dilemma";
import { EndingPanel } from "./ending";
import { HudMinimap } from "./hud-minimap";
import { Lobby } from "./lobby";
import { PuzzlePanel } from "./puzzle";
import { ROLE_META } from "./meta";
import { ClassifiedDossierDialog } from "./classified-dossier-dialog";
import { InventoryDialog } from "./inventory-dialog";
import { NetworkSettingsDialog } from "./network-settings-dialog";
import { soundFx } from "@/lib/game/audio";

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
        <Icon className="size-4 shrink-0 text-primary" />
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
  onOpenInventory,
}: {
  game: GameState;
  selfId: string | null;
  onOpenInventory: () => void;
}) {
  const mySeat = game.seats.find((s) => s.playerId === selfId);
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
          <div className="mt-4 px-2 space-y-2">
            <ClassifiedDossierDialog game={game} selfId={selfId} />
            <Button
              variant="outline"
              className="w-full border-amber-500/50 bg-amber-950/25 text-amber-400 hover:bg-amber-900/35 hover:text-amber-200 hover:border-amber-400 font-bold transition-all flex items-center justify-between shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              onClick={onOpenInventory}
            >
              <span className="flex items-center gap-2">
                <Backpack className="size-4 text-amber-500" />
                کوله‌پشتی و یادداشت‌ها
              </span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-amber-300 border-amber-500/40 px-1 py-0"
              >
                کلید [ I ]
              </Badge>
            </Button>
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
  const [inventoryOpen, setInventoryOpen] = useState(false);
  // How many messages have been seen; the Comms tab being open marks all read.
  const [readCount, setReadCount] = useState(0);

  // Global keyboard shortcut: Pressing 'i' or 'I' (or KeyI) opens/toggles the Inventory
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "i" || e.key === "I" || e.code === "KeyI") {
        e.preventDefault();
        setInventoryOpen((prev) => {
          const next = !prev;
          if (next) soundFx.playInventoryOpen();
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
          : game.puzzle.puzzleId === "reactor6"
          ? "Reactor"
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
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white tabular-nums">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="crew" className="min-h-0 flex-1">
        <CrewPanel
          game={game}
          selfId={selfId}
          onOpenInventory={() => {
            soundFx.playInventoryOpen();
            setInventoryOpen(true);
          }}
        />
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
          {/* Quick toggle to Comms tab */}
          <Button
            variant={sideTab === "comms" ? "default" : "outline"}
            size="sm"
            className="gap-1.5 font-bold relative border-cyan-500/50 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/30"
            onClick={() => {
              setSideTab("comms");
              setShowSide(true);
            }}
          >
            <Radio className="size-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden xs:inline">ارتباطات</span>
            {unreadCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-[0_0_8px_#ef4444]">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Quick toggle to Inventory & Personal Notes */}
          {game && (
            <Button
              variant={inventoryOpen ? "default" : "outline"}
              size="sm"
              className="gap-1.5 font-bold relative border-amber-500/50 text-amber-400 bg-amber-950/20 hover:bg-amber-900/30 hover:border-amber-400 hover:text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
              onClick={() => {
                soundFx.playInventoryOpen();
                setInventoryOpen(true);
              }}
              title="اینونتوری و یادداشت‌های خدمه (کلید میانبر I)"
            >
              <Backpack className="size-3.5 text-amber-400" />
              <span className="hidden xs:inline">اینونتوری</span>
              <kbd className="hidden md:inline-block rounded bg-amber-950/80 px-1 py-0.2 text-[9px] font-mono border border-amber-500/40 text-amber-300">
                I
              </kbd>
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={copyRoomId}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            <span className="hidden sm:inline">کپی کد</span>
          </Button>
          <Button
            variant={sideTab === "crew" ? "default" : "outline"}
            size="sm"
            className="relative lg:hidden gap-1"
            onClick={() => {
              setSideTab("crew");
              setShowSide(true);
            }}
          >
            <Users className="size-4" />
            <span className="hidden sm:inline">خدمه</span>
            <span>({members.filter((m) => m.status === "connected").length})</span>
          </Button>
          <NetworkSettingsDialog
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-cyan-400 p-2"
                title="تنظیمات شبکه و سیگنالینگ (LAN / WebRTC)"
              >
                <Wifi className="size-4" />
              </Button>
            }
          />
          <Button variant="ghost" size="sm" onClick={leave}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">ترک سفینه</span>
          </Button>
        </div>
      </header>

      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center max-w-md mx-auto" dir="rtl">
          <div className="p-3.5 rounded-full bg-destructive/10 text-destructive border border-destructive/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <WifiOff className="size-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-foreground text-base">اختلال در ارتباط شبکه سفینه</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <NetworkSettingsDialog
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5 border-cyan-500/50 text-cyan-400 hover:bg-cyan-950/30">
                  <Settings className="size-3.5" />
                  تنظیمات سیگنالینگ و شبکه محلی
                </Button>
              }
            />
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              تلاش مجدد
            </Button>
            <Button variant="ghost" size="sm" onClick={leave}>
              بازگشت به لابی
            </Button>
          </div>
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
        <div className="flex min-h-0 flex-1 relative">
          <HudMinimap game={game} activeZone={activeZone} />
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

      {game && (
        <InventoryDialog
          open={inventoryOpen}
          onOpenChange={setInventoryOpen}
          game={game}
          selfId={selfId}
          roomId={roomId}
        />
      )}
    </div>
  );
}
