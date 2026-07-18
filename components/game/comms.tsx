"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/lib/protocol";

/** The intercom: table talk for debates, accusations and technician lies. */
export function Comms({
  messages,
  sendChat,
  connected,
}: {
  messages: ChatMessage[];
  sendChat: (text: string) => void;
  connected: boolean;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    const text = draft.trim();
    if (!text || !connected) return;
    sendChat(text);
    setDraft("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-2 py-3">
          {messages.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              Ship&apos;s intercom is quiet. Debate, accuse, deceive…
            </p>
          )}
          {messages.map((m) => (
            <p key={m.id} className="text-sm leading-snug">
              <span
                className={`font-semibold ${m.own ? "text-primary" : ""}`}
              >
                {m.own ? "You" : m.name}:
              </span>{" "}
              <span className="break-words">{m.text}</span>
            </p>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <div className="flex gap-2 border-t p-2">
        <Input
          value={draft}
          placeholder="Intercom…"
          disabled={!connected}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button
          size="icon"
          onClick={submit}
          disabled={!connected || !draft.trim()}
          aria-label="Send"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
