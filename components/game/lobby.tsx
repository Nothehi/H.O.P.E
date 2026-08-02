"use client";

import { Play, ScrollText, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLES, type GameAction, type GameState } from "@/lib/game/types";
import { ROLE_META } from "./meta";

export function Lobby({
  game,
  selfId,
  dispatch,
}: {
  game: GameState;
  selfId: string | null;
  dispatch: (action: GameAction) => void;
}) {
  const mySeat = game.seats.find((s) => s.playerId === selfId);
  const chronicle = game.chronicle;
  const everyoneAssigned =
    game.seats.length > 0 && game.seats.every((s) => s.role !== null);
  const hasTechnician = game.seats.some((s) => s.role === "technician");

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4" dir="rtl">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-primary break-words whitespace-normal text-balance">
          سفر اکتشافی شماره {chronicle.voyage + 1} — تجمیع و آمادگی خدمه
        </h2>
        <p className="text-sm text-muted-foreground">
          بخش و مسئولیت تخصصی خود را انتخاب کنید. نقش‌های فرضی وجود ندارد — شما با نام واقعی خود بازی می‌کنید و دفترچه سفینه آن را ثبت می‌کند.
        </p>
      </div>

      {chronicle.voyage > 0 && (
        <div className="space-y-2 rounded-none border border-border bg-card p-4 text-sm">
          <div className="flex items-center gap-2 font-bold text-primary">
            <ScrollText className="size-4" />
            تاریخچه دفترچه سفینه تا این لحظه
          </div>
          <p className="text-muted-foreground">
            {chronicle.voyage} سفر قبلی ثبت شده ·{" "}
            {chronicle.ledger.length} امضا در دفترچه ·{" "}
            {chronicle.stickers.length} برچسب وضعیت دائمی ·{" "}
            {chronicle.envelopesOpened.length} پاکت محرمانه باز شده ·{" "}
            {chronicle.retiredCards.length} بحران برای همیشه حل گشته
          </p>
          {chronicle.heroHistory.length > 0 && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Trophy className="size-3.5 text-amber-500" />
              قهرمانان ماندگار سفینه:{" "}
              {chronicle.heroHistory
                .map((h) => `${h.name} (سفر ${h.voyage})`)
                .join("، ")}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ROLES.map((role) => {
          const meta = ROLE_META[role];
          const takenBy = game.seats.find((s) => s.role === role);
          const mine = mySeat?.role === role;
          const Icon = meta.icon;
          return (
            <button
              key={role}
              onClick={() =>
                mySeat && dispatch({ type: "choose-role", role: mine ? null : role })
              }
              disabled={!mySeat || (!!takenBy && !mine)}
              className={`flex flex-col items-center gap-1.5 rounded-none border p-3 text-center transition-all ${
                mine
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-[0_0_10px_rgba(252,238,10,0.2)]"
                  : takenBy
                    ? "cursor-not-allowed opacity-40 border-border bg-muted/20"
                    : "hover:bg-secondary hover:border-secondary-foreground"
              }`}
              title={meta.blurb}
            >
              <Icon className="size-5" />
              <span className="text-xs font-bold">{meta.label}</span>
              <span className="min-h-4 text-[10px] text-muted-foreground">
                {takenBy ? takenBy.name : "آزاد / انتخاب نشده"}
              </span>
            </button>
          );
        })}
      </div>

      {mySeat?.role && (
        <p className="text-center text-xs font-semibold text-secondary-foreground bg-secondary/30 p-2 border border-secondary-foreground/30">
          وظیفه {ROLE_META[mySeat.role].label}: {ROLE_META[mySeat.role].blurb}
        </p>
      )}

      <div className="flex flex-col items-center gap-2 pt-2">
        <Button
          size="lg"
          disabled={!mySeat || game.seats.length === 0}
          onClick={() => dispatch({ type: "start-game" })}
        >
          <Play className="size-4 ml-1" />
          آغاز سفر اکشافی شماره {chronicle.voyage + 1}
        </Button>
        {!everyoneAssigned && (
          <Badge variant="secondary">منتظر انتخاب مسئولیت توسط تمام خدمه</Badge>
        )}
        {!hasTechnician && (
          <p className="text-xs text-amber-500 font-semibold">
            هشدار: هیچ تکنسینی در سفینه نیست — کسی قادر به هک و دیدن عواقب پنهان نخواهد بود!
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {game.seats.length} نفر خدمه حاضر · تعداد پیشنهادی: ۳ تا ۸ نفر
        </p>
      </div>
    </div>
  );
}
