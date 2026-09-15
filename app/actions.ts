"use server";

import { revalidatePath } from "next/cache";
import { chatReply } from "@/lib/ai/chat";
import { classifyActivity, type ClassificationResult } from "@/lib/ai/classify";
import { coachRecommendations } from "@/lib/ai/coach";
import { questReflection } from "@/lib/ai/reflect";
import { generateWeeklyReview } from "@/lib/ai/weekly";
import {
  addQuestTask,
  addTodo,
  buyItem,
  completeQuest,
  deleteTodo,
  ensureTodayQuest,
  equipItem,
  markQuestTaskDone,
  removeQuestTask,
  renameQuestTask,
  saveActivityLog,
  toggleQuestTask,
  toggleTodo,
  updateMission,
} from "@/lib/game";
import { getStore } from "@/lib/store";
import { dateKey } from "@/lib/store/types";
import type { CategoryId, ClassifiedActivity, TrackableCategory } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/", "layout");
}

// ── Activity logging ────────────────────────────────────────────────────────

export async function classifyActivityAction(
  text: string,
): Promise<ClassificationResult> {
  const store = getStore();
  const state = await store.getState();
  return classifyActivity(text, state);
}

export async function confirmActivityLogAction(input: {
  rawText: string;
  entries: ClassifiedActivity[];
  insight: string;
  nextFocus: string;
}): Promise<{ ok: boolean; totalXp: number }> {
  const entries = input.entries
    .filter((e) => e.xp > 0)
    .map((e) => ({ ...e, xp: Math.max(5, Math.min(1000, Math.round(e.xp))) }));
  if (!entries.length || !input.rawText.trim()) return { ok: false, totalXp: 0 };
  const log = await saveActivityLog(
    input.rawText.trim(),
    entries,
    input.insight,
    input.nextFocus,
  );
  revalidateAll();
  return { ok: true, totalXp: log.totalXp };
}

// ── Quests ──────────────────────────────────────────────────────────────────

export async function toggleQuestTaskAction(
  questId: string,
  taskId: string,
): Promise<void> {
  await toggleQuestTask(questId, taskId);
  revalidateAll();
}

// ── Editing the day's task list ─────────────────────────────────────────────

export async function addQuestTaskAction(
  questId: string,
  title: string,
): Promise<void> {
  await addQuestTask(questId, title);
  revalidateAll();
}

export async function renameQuestTaskAction(
  questId: string,
  taskId: string,
  title: string,
): Promise<void> {
  await renameQuestTask(questId, taskId, title);
  revalidateAll();
}

export async function removeQuestTaskAction(
  questId: string,
  taskId: string,
): Promise<void> {
  await removeQuestTask(questId, taskId);
  revalidateAll();
}

/** Journaling is the one quest task that can't just be ticked — the entry has
 *  to be written and saved to the Activity Log. */
export async function saveQuestJournalAction(
  questId: string,
  taskId: string,
  text: string,
): Promise<{ ok: boolean; totalXp: number }> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, totalXp: 0 };
  const store = getStore();
  const state = await store.getState();

  // Saving twice must not pay twice. The task is already done, or the same
  // entry was already written today (e.g. from the Activity Log page).
  const task = state.quests
    .find((q) => q.id === questId)
    ?.tasks.find((t) => t.id === taskId);
  if (task?.completed) return { ok: true, totalXp: 0 };
  const today = dateKey(new Date());
  const existing = state.activityLogs.find(
    (l) => dateKey(new Date(l.createdAt)) === today && l.rawText.trim() === trimmed,
  );
  if (existing) {
    await markQuestTaskDone(questId, taskId);
    revalidateAll();
    return { ok: true, totalXp: 0 };
  }

  const result = await classifyActivity(trimmed, state);
  const entries = result.entries
    .filter((e) => e.xp > 0)
    .map((e) => ({ ...e, xp: Math.max(5, Math.min(1000, Math.round(e.xp))) }));
  const log = await saveActivityLog(
    trimmed,
    entries,
    result.insight,
    result.nextFocus,
  );
  await markQuestTaskDone(questId, taskId);
  revalidateAll();
  return { ok: true, totalXp: log.totalXp };
}

export async function completeQuestAction(questId: string): Promise<{
  ok: boolean;
  xpAwarded?: number;
  reflection?: string;
  streak?: number;
}> {
  const store = getStore();
  const state = await store.getState();
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest || !quest.tasks.every((t) => t.completed)) return { ok: false };
  const reflection = await questReflection(quest, state.contextNotes);
  const result = await completeQuest(questId, reflection);
  revalidateAll();
  if (!result) return { ok: false };
  return {
    ok: true,
    xpAwarded: result.xpAwarded,
    reflection,
    streak: result.streak,
  };
}

// ── Missions ────────────────────────────────────────────────────────────────

export async function updateMissionAction(
  missionId: string,
  patch: { progress?: number; status?: string },
): Promise<void> {
  await updateMission(missionId, patch);
  revalidateAll();
}

// ── Coach / weekly review ───────────────────────────────────────────────────

export async function coachAction(): Promise<string[]> {
  const store = getStore();
  const state = await store.getState();
  return coachRecommendations(state);
}

export async function generateWeeklyReviewAction(): Promise<{
  id: string;
  content: string;
  totalXp: number;
}> {
  const store = getStore();
  const state = await store.getState();
  const review = await generateWeeklyReview(state);
  await store.addWeeklyReview(review);
  revalidateAll();
  return { id: review.id, content: review.content, totalXp: review.totalXp };
}

// ── Tasks (todo list) ───────────────────────────────────────────────────────

export async function addTodoAction(
  title: string,
  category: TrackableCategory,
  missionId?: string | null,
): Promise<void> {
  if (!title.trim()) return;
  await addTodo(title, category, missionId);
  revalidateAll();
}

export async function toggleTodoAction(todoId: string): Promise<void> {
  await toggleTodo(todoId);
  revalidateAll();
}

export async function deleteTodoAction(todoId: string): Promise<void> {
  await deleteTodo(todoId);
  revalidateAll();
}

// ── Notes (scratchpad) ──────────────────────────────────────────────────────

export async function addNoteAction(text: string): Promise<void> {
  if (!text.trim()) return;
  await getStore().addNote({
    id: crypto.randomUUID(),
    text: text.trim(),
    createdAt: new Date().toISOString(),
  });
  revalidateAll();
}

export async function deleteNoteAction(noteId: string): Promise<void> {
  await getStore().deleteNote(noteId);
  revalidateAll();
}

// ── AI Chat + living context ────────────────────────────────────────────────

export async function sendChatMessageAction(
  text: string,
): Promise<{ ok: boolean; reply?: string }> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false };
  const store = getStore();
  const state = await store.getState();
  const reply = await chatReply(state, trimmed);
  await store.addChatMessages([
    {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: reply,
      createdAt: new Date().toISOString(),
    },
  ]);
  revalidateAll();
  return { ok: true, reply };
}

export async function clearChatAction(): Promise<void> {
  await getStore().clearChat();
  revalidateAll();
}

/** Save a durable fact about Arun's life — injected into every AI prompt. */
export async function addContextNoteAction(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  await getStore().addContextNote({
    id: crypto.randomUUID(),
    text: trimmed,
    createdAt: new Date().toISOString(),
  });
  revalidateAll();
}

export async function deleteContextNoteAction(id: string): Promise<void> {
  await getStore().deleteContextNote(id);
  revalidateAll();
}

const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".markdown", ".csv", ".json", ".log", ".yaml", ".yml",
  ".xml", ".tsv", ".html", ".css", ".js", ".ts", ".py", ".sql", ".env",
]);
const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3 MB
const MAX_FILE_CHARS = 20_000;

/** Attach a file to the coach's memory. Text files are read directly;
 *  PDFs are parsed. Content is stored as a context note and injected into
 *  every AI prompt. */
export async function uploadContextFileAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received." };
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "File too large — 3 MB max." };
  }

  const name = file.name || "attachment";
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();

  let text: string;
  try {
    if (ext === ".pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({
        data: new Uint8Array(await file.arrayBuffer()),
      });
      try {
        text = (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    } else if (TEXT_EXTENSIONS.has(ext) || file.type.startsWith("text/")) {
      text = await file.text();
    } else {
      return {
        ok: false,
        error: "Unsupported file type — use text files or PDFs.",
      };
    }
  } catch (err) {
    console.error("File extraction failed:", err);
    return { ok: false, error: "Couldn't read that file." };
  }

  text = text.trim();
  if (!text) return { ok: false, error: "That file appears to be empty." };
  if (text.length > MAX_FILE_CHARS) {
    text = text.slice(0, MAX_FILE_CHARS) + "\n… [truncated]";
  }

  await getStore().addContextNote({
    id: crypto.randomUUID(),
    text,
    createdAt: new Date().toISOString(),
    fileName: name,
  });
  revalidateAll();
  return { ok: true };
}

// ── Shop ────────────────────────────────────────────────────────────────────

export async function buyItemAction(
  itemId: string,
): Promise<{ ok: boolean; error?: string }> {
  const result = await buyItem(itemId);
  if (result.ok) revalidateAll();
  return result;
}

export async function equipItemAction(
  itemId: string,
  equip: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const result = await equipItem(itemId, equip);
  if (result.ok) revalidateAll();
  return result;
}

// ── Settings: OpenAI key ────────────────────────────────────────────────────

export async function saveOpenAiKeyAction(key: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const trimmed = key.trim();
  if (!trimmed.startsWith("sk-") || trimmed.length < 20) {
    return { ok: false, error: "That doesn't look like an OpenAI key (starts with sk-)." };
  }
  // Verify the key actually works before saving
  try {
    const OpenAI = (await import("openai")).default;
    const test = new OpenAI({ apiKey: trimmed });
    await test.models.list();
  } catch {
    return { ok: false, error: "Key was rejected by OpenAI. Check it and try again." };
  }
  const { saveOpenAiKey } = await import("@/lib/config");
  saveOpenAiKey(trimmed);
  revalidateAll();
  return { ok: true };
}

export async function clearOpenAiKeyAction(): Promise<void> {
  const { clearOpenAiKey } = await import("@/lib/config");
  clearOpenAiKey();
  revalidateAll();
}

// ── Settings ────────────────────────────────────────────────────────────────

export async function resetDataAction(withSampleData: boolean): Promise<void> {
  await getStore().resetAll(withSampleData);
  revalidateAll();
}

export async function todayQuestAction() {
  const store = getStore();
  const state = await store.getState();
  return ensureTodayQuest(state);
}
