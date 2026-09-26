"use client";

import { LifeBuoy, SendHorizonal, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { askHelperAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { ChatMarkdown } from "./chat-markdown";

type Turn = { role: "user" | "assistant"; content: string };

export function HelperDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, startTransition] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [turns, open]);

  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (pathname.startsWith("/idle")) return null;

  function send() {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    setTurns((t) => [...t, { role: "user", content: text }]);
    startTransition(async () => {
      const res = await askHelperAction(text, history);
      setTurns((t) => [
        ...t,
        {
          role: "assistant",
          content: res.reply ?? "Could not answer that. Try again.",
        },
      ]);
    });
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open && (
        <div className="pointer-events-auto flex h-[min(28rem,70vh)] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-ink-600 bg-ink-900/95 shadow-[4px_8px_0_0_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-ink-800 px-3.5 py-2.5">
            <div>
              <div className="text-[13px] font-semibold text-zinc-100">Helper</div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                Sees the whole board · ⌘J
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-zinc-500 hover:text-zinc-200"
              aria-label="Close helper"
            >
              <X size={16} />
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3">
            {turns.length === 0 && (
              <p className="text-sm leading-relaxed text-zinc-500">
                Ask what to do next, how a page works, or dump a situation. I can
                see tasks, notes, the quest, missions, and the journal.
              </p>
            )}
            {turns.map((t, i) => (
              <div
                key={i}
                className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-xl border px-3 py-2 text-[13px] leading-relaxed",
                    t.role === "user"
                      ? "border-ink-600 bg-ink-800 text-zinc-100"
                      : "border-xp/20 bg-xp/5 text-zinc-200",
                  )}
                >
                  {t.role === "user" ? (
                    <p className="whitespace-pre-wrap">{t.content}</p>
                  ) : (
                    <ChatMarkdown text={t.content} />
                  )}
                </div>
              </div>
            ))}
            {pending && (
              <p className="text-[12px] text-zinc-600">Reading the board…</p>
            )}
            <div ref={bottom} />
          </div>
          <form
            className="border-t border-ink-800 p-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={field}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder="Ask anything…"
                className="min-h-[2.5rem] flex-1 resize-none rounded-lg border border-ink-700 bg-ink-850/80 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-ink-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={pending || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-ink-950 hover:bg-white disabled:opacity-40"
                aria-label="Send"
              >
                <SendHorizonal size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border shadow-[3px_3px_0_0_rgba(0,0,0,0.35)] transition-colors",
          open
            ? "border-ink-600 bg-ink-800 text-zinc-200"
            : "border-xp/40 bg-xp text-ink-950 hover:bg-yellow-300",
        )}
        aria-label={open ? "Close helper" : "Open helper"}
        title="Helper (⌘J)"
      >
        {open ? <X size={20} /> : <LifeBuoy size={20} />}
      </button>
    </div>
  );
}
