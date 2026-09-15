"use client";

import { StickyNote, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { addNoteAction, deleteNoteAction } from "@/app/actions";
import type { NoteItem } from "@/lib/types";
import { Card, CardHeader } from "./ui";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today, ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

export function NotesClient({ notes }: { notes: NoteItem[] }) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    if (!text.trim()) return;
    const t = text;
    setText("");
    startTransition(() => addNoteAction(t));
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Scratchpad"
        icon={<StickyNote size={14} className="text-zinc-500" />}
        action={
          <span className="text-[11px] text-zinc-500">⌘↵ to save</span>
        }
      />
      <div className="px-5 pb-5 pt-2">
        {/* Jot box */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add();
          }}
          rows={3}
          placeholder="Jot it down — a thought, an idea, a thing someone said…"
          className="w-full resize-y rounded-lg border border-ink-700 bg-ink-850/70 px-3.5 py-2.5 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-ink-600 focus:outline-none"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={add}
            disabled={pending || !text.trim()}
            className="rounded-lg bg-zinc-100 px-3.5 py-1.5 text-sm font-medium text-ink-950 transition-colors hover:bg-white disabled:opacity-40"
          >
            Save note
          </button>
        </div>

        {/* Notes list */}
        <ul className="mt-4 space-y-1.5">
          {notes.length === 0 && (
            <li className="py-3 text-sm text-zinc-500">
              Nothing jotted yet. This page never forgets — write the first thing.
            </li>
          )}
          {notes.map((note) => (
            <NoteRow key={note.id} note={note} />
          ))}
        </ul>
      </div>
    </Card>
  );
}

function NoteRow({ note }: { note: NoteItem }) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="group rounded-lg border border-ink-700/60 bg-ink-850/60 px-3.5 py-2.5 transition-colors hover:border-ink-600">
      <div className="flex items-start gap-3">
        <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
          {note.text}
        </p>
        <button
          onClick={() => startTransition(() => deleteNoteAction(note.id))}
          disabled={pending}
          className="mt-0.5 shrink-0 rounded p-1 text-zinc-700 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
          aria-label="Delete note"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="mt-1.5 text-[11px] text-zinc-600">{formatWhen(note.createdAt)}</div>
    </li>
  );
}
