"use client";

import {
  BookmarkPlus,
  Brain,
  MessageSquare,
  Paperclip,
  SendHorizonal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  addContextNoteAction,
  clearChatAction,
  deleteContextNoteAction,
  sendChatMessageAction,
  uploadContextFileAction,
} from "@/app/actions";
import type { ChatMessage, ContextNote } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "./ui";

function MessageBubble({
  msg,
  onRemember,
}: {
  msg: ChatMessage;
  onRemember: (text: string) => void;
}) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("group flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[80%] rounded-xl border px-3.5 py-2.5",
          isUser
            ? "border-ink-600 bg-ink-800 text-zinc-100"
            : "border-xp/20 bg-xp/5 text-zinc-200",
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
        <div
          className={cn(
            "mt-1 flex items-center gap-2 text-[10px] text-zinc-600",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
          {isUser && (
            <button
              onClick={() => onRemember(msg.content)}
              title="Save as coach context"
              className="flex items-center gap-1 rounded px-1 text-zinc-600 opacity-0 transition-opacity hover:text-xp group-hover:opacity-100"
            >
              <BookmarkPlus size={11} /> Remember
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatClient({
  chat,
  contextNotes,
  aiConfigured,
}: {
  chat: ChatMessage[];
  contextNotes: ContextNote[];
  aiConfigured: boolean;
}) {
  const [input, setInput] = useState("");
  const [contextInput, setContextInput] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function attachFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadContextFileAction(fd);
      if (!res.ok) setFileError(res.error ?? "Upload failed.");
    });
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chat.length, pending]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    startTransition(async () => {
      await sendChatMessageAction(text);
    });
  }

  function remember(text: string) {
    startTransition(() => addContextNoteAction(text));
  }

  function addContext() {
    const text = contextInput.trim();
    if (!text) return;
    setContextInput("");
    startTransition(() => addContextNoteAction(text));
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Chat column */}
      <Card className="animate-fade-up flex flex-col lg:col-span-2">
        <CardHeader
          title="Coach"
          icon={<MessageSquare size={14} className="text-zinc-500" />}
          action={
            <div className="flex items-center gap-3">
              {!aiConfigured && (
                <span className="text-[11px] text-amber-400/80">
                  Basic mode — add an OpenAI key in Settings for full conversation
                </span>
              )}
              {chat.length > 0 && (
                <button
                  onClick={() => startTransition(() => clearChatAction())}
                  disabled={pending}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 transition-colors hover:text-red-400"
                >
                  <Trash2 size={11} /> Clear
                </button>
              )}
            </div>
          }
        />
        <div
          ref={scrollRef}
          className="max-h-[52vh] min-h-64 flex-1 space-y-3 overflow-y-auto px-5 py-3"
        >
          {chat.length === 0 && (
            <p className="py-6 text-sm text-zinc-500">
              No conversation yet. Start with what&apos;s on your mind — or dump context:
              &quot;I have a POC review with Acme on Friday and my manager is
              Priya.&quot; Hover your message and hit <span className="text-xp">Remember</span>{" "}
              to make it permanent context.
            </p>
          )}
          {chat.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} onRemember={remember} />
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="rounded-xl border border-xp/20 bg-xp/5 px-3.5 py-2.5 text-sm text-zinc-400">
                Thinking…
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-ink-800 p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder="Talk to the coach… (Enter to send, Shift+Enter for newline)"
              className="min-w-0 flex-1 resize-none rounded-lg border border-ink-700 bg-ink-850/70 px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-ink-600 focus:outline-none"
            />
            <button
              onClick={send}
              disabled={pending || !input.trim()}
              className="flex items-center gap-1.5 self-end rounded-lg bg-zinc-100 px-3.5 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-white disabled:opacity-40"
            >
              <SendHorizonal size={15} />
            </button>
          </div>
        </div>
      </Card>

      {/* Context column */}
      <Card className="animate-fade-up flex flex-col">
        <CardHeader
          title="Coach Memory"
          icon={<Brain size={14} className="text-zinc-500" />}
          action={
            <span className="tnum text-[11px] text-zinc-500">
              {contextNotes.length} fact{contextNotes.length === 1 ? "" : "s"}
            </span>
          }
        />
        <div className="flex-1 px-5 pb-5 pt-2">
          <p className="mb-3 text-[12px] leading-relaxed text-zinc-500">
            Durable facts the coach injects into every prompt — classification,
            insights, quests, weekly reviews, and this chat.
          </p>
          <div className="flex gap-2">
            <input
              value={contextInput}
              onChange={(e) => setContextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addContext()}
              placeholder="e.g. My manager is Priya; promo case due in March"
              className="min-w-0 flex-1 rounded-lg border border-ink-700 bg-ink-850/70 px-3 py-2 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:border-ink-600 focus:outline-none"
            />
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.markdown,.csv,.json,.log,.yaml,.yml,.xml,.tsv,.pdf"
              className="hidden"
              onChange={attachFile}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={pending}
              title="Attach a file (text or PDF, 3 MB max)"
              className="rounded-lg border border-ink-700 bg-ink-850/70 px-2.5 py-2 text-zinc-400 transition-colors hover:border-ink-600 hover:text-zinc-200 disabled:opacity-40"
            >
              <Paperclip size={15} />
            </button>
            <button
              onClick={addContext}
              disabled={pending || !contextInput.trim()}
              className="rounded-lg bg-zinc-100 px-3 py-2 text-[13px] font-medium text-ink-950 transition-colors hover:bg-white disabled:opacity-40"
            >
              Add
            </button>
          </div>
          {fileError && (
            <p className="mt-1.5 text-[11px] text-red-400">{fileError}</p>
          )}
          <ul className="mt-3 space-y-1.5">
            {contextNotes.length === 0 && (
              <li className="py-2 text-[13px] text-zinc-600">
                Nothing saved yet. This is the coach&apos;s long-term memory.
              </li>
            )}
            {[...contextNotes].reverse().map((note) => (
              <li
                key={note.id}
                className="group flex items-start gap-2 rounded-lg border border-ink-700/60 bg-ink-850/60 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  {note.fileName && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-xp">
                      <Paperclip size={10} /> {note.fileName}
                    </div>
                  )}
                  <p className="line-clamp-3 whitespace-pre-wrap text-[13px] leading-snug text-zinc-300">
                    {note.text}
                  </p>
                </div>
                <button
                  onClick={() =>
                    startTransition(() => deleteContextNoteAction(note.id))
                  }
                  disabled={pending}
                  className="mt-0.5 shrink-0 rounded p-0.5 text-zinc-700 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  aria-label="Delete context"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
