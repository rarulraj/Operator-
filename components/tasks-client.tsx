"use client";

import {
  Check,
  ChevronRight,
  ListChecks,
  Pin,
  Plus,
  Search,
  StickyNote,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  addTodoAction,
  deleteTodoAction,
  toggleTodoAction,
  updateTodoAction,
} from "@/app/actions";
import { badgeMeta, CATEGORIES, CATEGORY_MAP } from "@/lib/skills";
import {
  matchesQuery,
  sortOpenTodos,
  todoNotes,
} from "@/lib/todos";
import { TASK_XP } from "@/lib/xp";
import type { Mission, TodoItem, TrackableCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge, Card, CardHeader } from "./ui";

const CATEGORY_OPTIONS: { id: TrackableCategory; label: string }[] = [
  ...CATEGORIES.map((c) => ({ id: c.id, label: c.shortName })),
  { id: "general", label: "General" },
];

/** Board section order: day job, body, social, wealth: then the ventures. */
const SECTION_ORDER: TrackableCategory[] = [
  "work",
  "brand",
  "physical",
  "social",
  "wealth",
  "ai_gtm",
  "tfe",
  "reefly",
  "general",
];

const SECTION_LABELS: Record<TrackableCategory, string> = {
  work: "Work: TDengine",
  brand: "Personal Brand",
  physical: "Physical",
  social: "Social Life",
  wealth: "Wealth",
  ai_gtm: "AI GTM",
  tfe: "TFE",
  reefly: "Reefly",
  general: "General",
};

export function TasksClient({
  todos,
  missions,
  maxOpen,
}: {
  todos: TodoItem[];
  missions: Mission[];
  /** Dashboard preview: show this many open tasks, then link to the board. */
  maxOpen?: number;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TrackableCategory>("work");
  const [missionId, setMissionId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [showDone, setShowDone] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fullBoard = !maxOpen;

  const allOpen = sortOpenTodos(todos.filter((t) => !t.completed)).filter((t) =>
    matchesQuery(t, query),
  );
  const open = maxOpen ? allOpen.slice(0, maxOpen) : allOpen;
  const hiddenOpen = allOpen.length - open.length;
  // Most recently finished first: the archive is for checking what you did,
  // not for scrolling past a year of it.
  const done = todos
    .filter((t) => t.completed && matchesQuery(t, query))
    .sort(
      (a, b) =>
        +new Date(b.completedAt ?? b.createdAt) -
        +new Date(a.completedAt ?? a.createdAt),
    );
  const assignable = missions.filter((m) => m.status !== "completed");

  function add() {
    if (!title.trim()) return;
    const t = title;
    setTitle("");
    startTransition(() => addTodoAction(t, category, missionId || null));
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Chore Board"
        icon={<ListChecks size={14} className="text-zinc-500" />}
        action={
          <span className="text-[11px] text-zinc-500">
            +{TASK_XP} XP per completed task
          </span>
        }
      />
      <div className="px-5 pb-5 pt-2">
        {/* Add row */}
        <div className="flex flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a task: e.g. Email the champion the POC charter"
            className="min-w-0 flex-1 rounded-lg border border-ink-700 bg-ink-850/70 px-3.5 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-ink-600 focus:outline-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TrackableCategory)}
            className="rounded-lg border border-ink-700 bg-ink-850/70 px-2 py-2 text-[13px] text-zinc-300 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={missionId}
            onChange={(e) => setMissionId(e.target.value)}
            title="Assign to a mission (optional)"
            className="max-w-44 truncate rounded-lg border border-ink-700 bg-ink-850/70 px-2 py-2 text-[13px] text-zinc-300 focus:outline-none"
          >
            <option value="">No mission</option>
            {assignable.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          <button
            onClick={add}
            disabled={pending || !title.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-white disabled:opacity-40"
          >
            <Plus size={15} /> Add
          </button>
        </div>

        {fullBoard && (
          <div className="relative mt-3">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles and notes…"
              className="w-full rounded-lg border border-ink-700 bg-ink-850/70 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-ink-600 focus:outline-none"
            />
          </div>
        )}

        {/* Open tasks, sectioned by pillar */}
        <div className="mt-4">
          {open.length === 0 && (
            <p className="py-3 text-sm text-zinc-500">
              {query.trim()
                ? "Nothing matches that search."
                : "Board is clear. Add the next real thing."}
            </p>
          )}
          {SECTION_ORDER.map((section) => {
            const items = open.filter((t) => t.category === section);
            if (items.length === 0) return null;
            return (
              <div key={section} className="mb-4 last:mb-0">
                <div
                  className={cn(
                    "mb-1.5 text-[11px] font-semibold uppercase tracking-wider",
                    section === "general"
                      ? "text-zinc-600"
                      : (CATEGORY_MAP[section]?.tailwind ?? "text-zinc-600"),
                  )}
                >
                  {SECTION_LABELS[section]} ({items.length})
                </div>
                <ul className="space-y-1.5">
                  {items.map((todo) => (
                    <TaskRow
                      key={todo.id}
                      todo={todo}
                      missions={missions}
                      expanded={expandedId === todo.id}
                      onToggleExpand={() =>
                        setExpandedId((id) => (id === todo.id ? null : todo.id))
                      }
                    />
                  ))}
                </ul>
              </div>
            );
          })}
          {hiddenOpen > 0 && (
            <Link
              href="/tasks"
              className="mt-1 inline-block text-[12px] font-medium text-zinc-500 transition-colors hover:text-zinc-300"
            >
              +{hiddenOpen} more open {hiddenOpen === 1 ? "task" : "tasks"} on the
              board →
            </Link>
          )}
        </div>

        {/* Completed: collapsed by default and height-capped, so the
            archive can grow forever without burying the live board. */}
        {done.length > 0 && (
          <div className="mt-5 border-t border-ink-800 pt-3">
            <button
              onClick={() => setShowDone((s) => !s)}
              className="flex w-full items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <ChevronRight
                size={13}
                className={cn(
                  "transition-transform duration-150",
                  showDone && "rotate-90",
                )}
              />
              Done ({done.length})
              <span className="ml-auto text-[10px] font-medium normal-case tracking-normal text-zinc-600">
                {showDone ? "hide" : "show"}
              </span>
            </button>
            {showDone && (
              <ul className="mt-2 max-h-[22rem] space-y-1.5 overflow-y-auto pr-1">
                {done.map((todo) => (
                  <TaskRow
                    key={todo.id}
                    todo={todo}
                    missions={missions}
                    expanded={expandedId === todo.id}
                    onToggleExpand={() =>
                      setExpandedId((id) => (id === todo.id ? null : todo.id))
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function TaskRow({
  todo,
  missions,
  expanded,
  onToggleExpand,
}: {
  todo: TodoItem;
  missions: Mission[];
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [saving, startSaving] = useTransition();
  const [localDone, setLocalDone] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(todo.title);
  const [notesDraft, setNotesDraft] = useState(todo.notes ?? "");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const completed = localDone ?? todo.completed;
  const hasNotes = Boolean(todoNotes({ ...todo, notes: notesDraft }));

  useEffect(() => {
    setLocalDone(null);
  }, [todo.completed]);

  useEffect(() => {
    setTitleDraft(todo.title);
  }, [todo.title]);

  useEffect(() => {
    setNotesDraft(todo.notes ?? "");
  }, [todo.notes]);

  useEffect(() => {
    if (expanded) notesRef.current?.focus();
  }, [expanded]);

  useEffect(() => {
    return () => {
      if (notesTimer.current) clearTimeout(notesTimer.current);
    };
  }, []);

  const meta = badgeMeta(todo.category);
  const mission = todo.missionId
    ? missions.find((m) => m.id === todo.missionId)
    : null;

  function saveTitle() {
    const next = titleDraft.trim();
    setEditingTitle(false);
    if (!next || next === todo.title) {
      setTitleDraft(todo.title);
      return;
    }
    startSaving(() => updateTodoAction(todo.id, { title: next }));
  }

  function saveNotes(value: string) {
    if (value === (todo.notes ?? "")) return;
    startSaving(() => updateTodoAction(todo.id, { notes: value }));
  }

  function onNotesChange(value: string) {
    setNotesDraft(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => saveNotes(value), 600);
  }

  function flushNotes() {
    if (notesTimer.current) {
      clearTimeout(notesTimer.current);
      notesTimer.current = null;
    }
    saveNotes(notesDraft);
  }

  return (
    <li
      className={cn(
        "group rounded-lg border transition-colors duration-150",
        completed
          ? "border-ink-800 bg-ink-900/40"
          : "border-ink-700/60 bg-ink-850/60 hover:border-ink-600",
      )}
    >
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <button
          onClick={() => {
            setLocalDone(!completed);
            setFailed(false);
            startTransition(async () => {
              try {
                await toggleTodoAction(todo.id);
              } catch {
                setLocalDone(null);
                setFailed(true);
              }
            });
          }}
          disabled={pending}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            completed
              ? "border-reef bg-reef text-ink-950"
              : "border-ink-600 text-transparent hover:border-zinc-400",
          )}
          aria-label={completed ? "Mark not done" : "Mark done"}
        >
          <Check size={13} strokeWidth={3} />
        </button>
        <button
          onClick={() =>
            startSaving(() => updateTodoAction(todo.id, { pinned: !todo.pinned }))
          }
          disabled={saving}
          className={cn(
            "shrink-0 rounded p-0.5 transition-colors",
            todo.pinned
              ? "text-xp"
              : "text-zinc-700 opacity-0 hover:text-zinc-400 group-hover:opacity-100",
          )}
          aria-label={todo.pinned ? "Unpin" : "Pin to top"}
          title={todo.pinned ? "Unpin" : "Pin to top of this pillar"}
        >
          <Pin size={13} fill={todo.pinned ? "currentColor" : "none"} />
        </button>
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle();
              if (e.key === "Escape") {
                setTitleDraft(todo.title);
                setEditingTitle(false);
              }
            }}
            className="min-w-0 flex-1 rounded border border-ink-600 bg-ink-900 px-1.5 py-0.5 text-sm text-zinc-100 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            title="Click to rename"
            className={cn(
              "min-w-0 flex-1 truncate text-left text-sm",
              completed ? "text-zinc-500 line-through" : "text-zinc-200",
            )}
          >
            {todo.title}
          </button>
        )}
        {failed && (
          <span className="shrink-0 text-[11px] text-red-400">didn&apos;t save</span>
        )}
        {mission && (
          <span
            className="hidden max-w-40 truncate rounded-md border border-ink-700 bg-ink-800/60 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:inline"
            title={`Mission: ${mission.title}`}
          >
            ◆ {mission.title}
          </span>
        )}
        {meta && <Badge className={meta.tailwind}>{meta.shortName}</Badge>}
        {completed && <span className="tnum text-[11px] text-xp">+{TASK_XP}</span>}
        <button
          onClick={onToggleExpand}
          className={cn(
            "rounded p-1 transition-colors",
            expanded || hasNotes
              ? "text-zinc-300"
              : "text-zinc-700 opacity-0 hover:text-zinc-300 group-hover:opacity-100",
          )}
          aria-label={expanded ? "Hide notes" : "Task notes"}
          title={hasNotes ? "Edit notes" : "Add notes"}
        >
          <StickyNote size={14} fill={hasNotes ? "currentColor" : "none"} />
        </button>
        <button
          onClick={() => startDeleting(() => deleteTodoAction(todo.id))}
          disabled={deleting}
          className="rounded p-1 text-zinc-700 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
          aria-label="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {expanded && (
        <div className="space-y-2 border-t border-ink-800 px-3.5 pb-3 pt-2">
          <textarea
            ref={notesRef}
            value={notesDraft}
            onChange={(e) => onNotesChange(e.target.value)}
            onBlur={flushNotes}
            rows={3}
            placeholder="Working notes: context, blockers, the next send, what you're waiting on…"
            className="w-full resize-y rounded-lg border border-ink-700 bg-ink-900/70 px-3 py-2 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-ink-600 focus:outline-none"
          />
          <div className="flex justify-end">
            <span className="text-[11px] text-zinc-600">
              {saving ? "saving…" : "autosaves"}
            </span>
          </div>
        </div>
      )}
    </li>
  );
}
