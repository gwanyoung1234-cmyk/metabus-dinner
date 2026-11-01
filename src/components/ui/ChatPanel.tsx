"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/presence";

export function ChatPanel({
  messages,
  onSend,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim().slice(0, 80);
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <div className="pointer-events-auto absolute bottom-[7.5rem] left-3 z-30 w-[min(72vw,17rem)] sm:bottom-28 md:left-4">
      <div className="overflow-hidden rounded-2xl border border-amber-900/45 bg-[rgba(12,10,8,0.92)] shadow-xl backdrop-blur">
        <button
          type="button"
          className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-amber-100"
          onClick={() => setOpen((value) => !value)}
        >
          <span>채팅</span>
          <span className="text-amber-200/60">{open ? "접기" : "열기"}</span>
        </button>
        {open ? (
          <>
            <div
              ref={listRef}
              className="max-h-28 space-y-1.5 overflow-y-auto border-t border-amber-900/30 px-3 py-2 text-[11px] leading-4 text-amber-50/90 sm:max-h-36"
            >
              {messages.length === 0 ? (
                <p className="text-amber-100/45">아직 대화가 없어요. 한마디 해보세요.</p>
              ) : (
                messages.map((message) => (
                  <p key={message.id}>
                    <span className="font-semibold text-amber-300">{message.name}</span>
                    <span className="text-amber-100/50"> · </span>
                    {message.text}
                  </p>
                ))
              )}
            </div>
            <form
              onSubmit={submit}
              className="flex gap-1.5 border-t border-amber-900/30 p-2"
            >
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={80}
                placeholder="메시지 입력…"
                className="min-w-0 flex-1 rounded-lg border border-amber-900/40 bg-black/35 px-2.5 py-1.5 text-xs text-amber-50 outline-none placeholder:text-amber-100/30 focus:border-amber-600/50"
              />
              <button
                type="submit"
                className="rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-stone-950 hover:bg-amber-500"
              >
                전송
              </button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
