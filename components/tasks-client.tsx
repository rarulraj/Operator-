"use client";

import { Check, ChevronRight, ListChecks, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { addTodoAction, deleteTodoAction, toggleTodoAction } from "@/app/actions";
import { badgeMeta, CATEGORIES, CATEGORY_MAP } from "@/lib/skills";
import { TASK_XP } from "@/lib/xp";
import type { Mission, TodoItem, TrackableCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge, Card, CardHeader } from "./ui";

const CATEGORY_OPTIONS: { id: TrackableCategory; label: string }[] = [
  ...CATEGORIES.map((c) => ({ id: c.id, label: c.shortName })),
  { id: "general", label: "General" },
];

/** Board section order: day job, body, social, wealth — then the ventures. */
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
  work: "Work — TDengine",
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
  const [pending, startTransition] = useTransition();
  const [showDone, setShowDone] = useState(false);

  const allOpen = todos.filter((t) => !t.completed);
  const open = maxOpen ? allOpen.slice(0, maxOpen) : allOpen;
  const hiddenOpen = allOpen.length - open.length;
  // Most recently finished first — the archive is for checking what you did,
  // not for scrolling past a year of it.
  const done = todos
    .filter((t) => t.completed)
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
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a task — e.g. Email the champion the POC charter"
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

        {/* Open tasks, sectioned by pillar */}
        <div className="mt-4">
          {open.length === 0 && (
            <p className="py-3 text-sm text-zinc-500">
              Board is clear. Add the next real thing.
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
                    <TaskRow key={todo.id} todo={todo} missions={missions} />
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

        {/* Completed — collapsed by default and height-capped, so the
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
                  <TaskRow key={todo.id} todo={todo} missions={missions} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function TaskRow({ todo, missions }: { todo: TodoItem; missions: Mission[] }) {
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [localDone, setLocalDone] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const completed = localDone ?? todo.completed;

  // Once the server's value catches up, stop overriding it — otherwise a
  // write that failed still looks saved until a hard reload.
  useEffect(() => {
    setLocalDone(null);
  }, [todo.completed]);
  const meta = badgeMeta(todo.category);
  const mission = todo.missionId
    ? missions.find((m) => m.id === todo.missionId)
    : null;

  return (
    <li
      className={cn(
        "group flex items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-colors duration-150",
        completed
          ? "border-ink-800 bg-ink-900/40"
          : "border-ink-700/60 bg-ink-850/60 hover:border-ink-600",
      )}
    >
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
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          completed ? "text-zinc-500 line-through" : "text-zinc-200",
        )}
      >
        {todo.title}
      </span>
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
        onClick={() => startDeleting(() => deleteTodoAction(todo.id))}
        disabled={deleting}
        className="rounded p-1 text-zinc-700 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        aria-label="Delete task"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}
