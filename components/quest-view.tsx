"use client";

import {
  BookOpen,
  Check,
  CheckCircle2,
  Flame,
  PartyPopper,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  addQuestTaskAction,
  completeQuestAction,
  removeQuestTaskAction,
  renameQuestTaskAction,
  saveQuestJournalAction,
  toggleQuestTaskAction,
} from "@/app/actions";
import { CATEGORY_MAP } from "@/lib/skills";
import type { DailyQuest } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, Progress } from "./ui";

export function QuestView({
  quest,
  journalTaskId,
  savedJournal,
}: {
  quest: DailyQuest;
  journalTaskId: string | null;
  savedJournal: string | null;
}) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const [completing, setCompleting] = useState(false);
  const [journal, setJournal] = useState(savedJournal ?? "");
  const [savingJournal, setSavingJournal] = useState(false);
  const [journalXp, setJournalXp] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [newTask, setNewTask] = useState("");

  // Drop optimistic ticks once the server's version of the quest arrives.
  // Holding them forever hides a failed save and leaves a "Complete Quest"
  // button that looks ready but is rejected on the server every time.
  const serverState = quest.tasks.map((t) => `${t.id}:${t.completed}`).join("|");
  const lastServerState = useRef(serverState);
  useEffect(() => {
    if (lastServerState.current !== serverState) {
      lastServerState.current = serverState;
      setOptimistic({});
    }
  }, [serverState]);
  const [result, setResult] = useState<{
    xpAwarded: number;
    reflection: string;
    streak: number;
  } | null>(
    quest.status === "completed" && quest.reflection
      ? {
          xpAwarded: quest.rewardXp,
          reflection: quest.reflection,
          streak: 0,
        }
      : null,
  );

  const meta = CATEGORY_MAP[quest.category];
  const isCompleted = quest.status === "completed";
  const tasks = quest.tasks.map((t) => ({
    ...t,
    completed: optimistic[t.id] ?? t.completed,
  }));
  const done = tasks.filter((t) => t.completed).length;
  const allDone = done === tasks.length && tasks.length > 0;

  function toggle(taskId: string) {
    const current = tasks.find((t) => t.id === taskId);
    setOptimistic((prev) => ({
      ...prev,
      [taskId]: !(current?.completed ?? false),
    }));
    startTransition(() => toggleQuestTaskAction(quest.id, taskId));
  }

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    setNewTask("");
    startTransition(() => addQuestTaskAction(quest.id, title));
  }

  function rename(taskId: string, title: string) {
    const clean = title.trim();
    const current = quest.tasks.find((t) => t.id === taskId)?.title;
    if (!clean || clean === current) return;
    startTransition(() => renameQuestTaskAction(quest.id, taskId, clean));
  }

  function removeTask(taskId: string) {
    startTransition(() => removeQuestTaskAction(quest.id, taskId));
  }

  function saveJournal() {
    if (!journalTaskId || !journal.trim()) return;
    setSavingJournal(true);
    setError(null);
    startTransition(async () => {
      try {
        const res = await saveQuestJournalAction(quest.id, journalTaskId, journal);
        if (res.ok) {
          setOptimistic((prev) => ({ ...prev, [journalTaskId]: true }));
          setJournalXp(res.totalXp);
        } else {
          setError("Journal entry was not saved. Write something first.");
        }
      } catch {
        setError("Journal entry could not be saved. Try again.");
      }
      setSavingJournal(false);
    });
  }

  function complete() {
    setCompleting(true);
    setError(null);
    startTransition(async () => {
      try {
        const res = await completeQuestAction(quest.id);
        if (res.ok && res.xpAwarded) {
          setResult({
            xpAwarded: res.xpAwarded,
            reflection: res.reflection ?? "",
            streak: res.streak ?? 0,
          });
        } else {
          setOptimistic({});
          setError(
            "Couldn't complete the quest — a task didn't save. Check the boxes again.",
          );
        }
      } catch {
        setError("Couldn't complete the quest. Try again.");
      }
      setCompleting(false);
    });
  }

  return (
    <div className="space-y-5">
      <Card className="animate-fade-up">
        <div className="px-6 pb-6 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Today&apos;s Quest
            </span>
            {meta && <Badge className={meta.tailwind}>{meta.shortName}</Badge>}
            <Badge className="text-xp">+{quest.rewardXp} XP</Badge>
            {isCompleted && <Badge className="text-reef">Completed</Badge>}
            {!isCompleted && (
              <button
                onClick={() => setEditing((e) => !e)}
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-ink-700 px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:border-ink-600 hover:text-zinc-200"
              >
                <Pencil size={12} /> {editing ? "Done editing" : "Edit tasks"}
              </button>
            )}
          </div>

          <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-50">
            {quest.title}
          </h1>

          {quest.description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              {quest.description}
            </p>
          )}

          <div className="mt-5 space-y-2">
            {tasks.map((task) =>
              editing && task.id !== journalTaskId ? (
                <div
                  key={task.id}
                  className="flex items-center gap-2 rounded-lg border border-ink-700/60 bg-ink-850/60 px-3 py-2"
                >
                  <input
                    defaultValue={task.title}
                    onBlur={(e) => rename(task.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                    className="min-w-0 flex-1 rounded-md border border-ink-700 bg-ink-900/70 px-3 py-2 text-sm text-zinc-200 focus:border-ink-600 focus:outline-none"
                  />
                  <button
                    onClick={() => removeTask(task.id)}
                    disabled={pending}
                    aria-label="Remove task"
                    className="rounded-md p-2 text-zinc-600 transition-colors hover:text-red-400"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : task.id === journalTaskId ? (
                <div
                  key={task.id}
                  className={cn(
                    "rounded-lg border px-4 py-3",
                    task.completed
                      ? "border-reef/25 bg-reef/5"
                      : "border-ink-700/60 bg-ink-850/60",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        task.completed
                          ? "border-reef bg-reef text-ink-950"
                          : "border-ink-600 text-transparent",
                      )}
                    >
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        task.completed ? "text-zinc-400" : "text-zinc-200",
                      )}
                    >
                      {task.title}
                    </span>
                  </div>

                  {task.completed ? (
                    <div className="mt-3 rounded-lg border border-ink-800 bg-ink-900/70 px-3.5 py-3">
                      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-reef">
                        <BookOpen size={13} /> Saved to the Activity Log
                        {journalXp !== null && journalXp > 0 && (
                          <span className="tnum text-xp">+{journalXp} XP</span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "mt-2 whitespace-pre-wrap text-sm leading-relaxed",
                          journal ? "text-zinc-300" : "text-zinc-500",
                        )}
                      >
                        {journal || "Today's entry is on the Activity Log page."}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <textarea
                        value={journal}
                        onChange={(e) => setJournal(e.target.value)}
                        rows={4}
                        placeholder="What actually moved today, what stalled, and the one thing tomorrow."
                        className="w-full resize-y rounded-lg border border-ink-700 bg-ink-900/70 px-3.5 py-2.5 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-ink-600 focus:outline-none"
                      />
                      <div className="mt-2 flex items-center gap-3">
                        <Button
                          onClick={saveJournal}
                          disabled={!journal.trim() || savingJournal || isCompleted}
                        >
                          {savingJournal ? "Saving…" : "Save journal entry"}
                        </Button>
                        <span className="text-[11px] text-zinc-600">
                          Journaling can&apos;t be ticked off — it has to be written and
                          saved.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
              <button
                key={task.id}
                onClick={() => !isCompleted && toggle(task.id)}
                disabled={pending || isCompleted}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-150",
                  task.completed
                    ? "border-reef/25 bg-reef/5"
                    : "border-ink-700/60 bg-ink-850/60 hover:border-ink-600",
                  isCompleted && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150",
                    task.completed
                      ? "border-reef bg-reef text-ink-950"
                      : "border-ink-600 text-transparent",
                  )}
                >
                  <Check size={13} strokeWidth={3} />
                </span>
                <span
                  className={cn(
                    "text-sm",
                    task.completed ? "text-zinc-400 line-through" : "text-zinc-200",
                  )}
                >
                  {task.title}
                </span>
              </button>
              ),
            )}

            {editing && (
              <div className="flex gap-2 pt-1">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="Add a task to today — what actually needs doing"
                  className="min-w-0 flex-1 rounded-lg border border-ink-700 bg-ink-900/70 px-3.5 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-ink-600 focus:outline-none"
                />
                <button
                  onClick={addTask}
                  disabled={pending || !newTask.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-white disabled:opacity-40"
                >
                  <Plus size={15} /> Add
                </button>
              </div>
            )}
          </div>

          {editing && (
            <p className="mt-2 text-[11px] text-zinc-600">
              Journaling stays on every day. The reward scales with the number of
              tasks.
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Progress
              value={tasks.length ? done / tasks.length : 0}
              className="flex-1"
              barClassName={meta?.bar}
            />
            <span className="tnum text-[11px] font-medium text-zinc-500">
              {done}/{tasks.length}
            </span>
          </div>

          {!isCompleted && (
            <div className="mt-5">
              <Button
                onClick={complete}
                disabled={!allDone || completing || pending}
                className="w-full sm:w-auto"
              >
                {completing ? (
                  "Completing…"
                ) : allDone ? (
                  <>
                    <CheckCircle2 size={15} /> Complete Quest · +{quest.rewardXp} XP
                  </>
                ) : (
                  `Finish the real work first (${done}/${tasks.length})`
                )}
              </Button>
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-lg border border-red-500/25 bg-red-500/5 px-3.5 py-2.5 text-[13px] text-red-300">
              {error}
            </p>
          )}
        </div>
      </Card>

      {result && (
        <Card className="animate-pop-in border-xp/25 bg-gradient-to-b from-xp/5 to-ink-900/70">
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-xp">
              <PartyPopper size={16} />
              Quest Complete — +{result.xpAwarded} XP
              {result.streak > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-orange-400">
                  <Flame size={14} /> {result.streak} day streak
                </span>
              )}
            </div>
            {result.reflection && (
              <div className="mt-3 flex gap-2.5 rounded-lg border border-ink-700/60 bg-ink-900/70 px-4 py-3">
                <Sparkles size={15} className="mt-0.5 shrink-0 text-xp" />
                <p className="text-sm leading-relaxed text-zinc-300">
                  {result.reflection}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
