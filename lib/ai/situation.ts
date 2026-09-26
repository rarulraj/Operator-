import { promises as fs } from "fs";
import path from "path";
import { getManualSituation } from "../config";
import { dateKey } from "../store/types";
import type { AppState } from "../types";

// ── Live situation ──────────────────────────────────────────────────────────
// Hermes already knows "I'm at a conference." Operator did not. This file
// is the bridge: today's Hermes log, standing MEMORY, a SITUATION.md, plus
// anything typed in Settings. Coach, quest, insights, and chat all read it.

export type SituationMode = "conference" | "travel" | "normal";

export interface Situation {
  text: string;
  mode: SituationMode;
  sources: string[];
}

const HERMES_DIR =
  process.env.OPERATOR_HERMES_DIR ||
  "/Users/aruntdengine/hermes-agent/workspace";

const MAX_FILE = 2500;
const MAX_TOTAL = 9000;
const CACHE_MS = 15_000;

let cache: { at: number; value: Situation } | null = null;

export function situationMode(text: string): SituationMode {
  const t = text.toLowerCase();
  if (
    /conference|booth|icc\b|ignition community|on.?site|expo hall|trade show|on the floor|at the show/.test(
      t,
    )
  ) {
    return "conference";
  }
  if (
    /airport|hotel|traveling|on the road|in transit|away from home|on.?site visit/.test(
      t,
    )
  ) {
    return "travel";
  }
  return "normal";
}

export function invalidateSituationCache(): void {
  cache = null;
}

async function readIfExists(file: string, max = MAX_FILE): Promise<string> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    const trimmed = raw.trim();
    if (!trimmed) return "";
    return trimmed.length > max ? trimmed.slice(0, max) + "\n… [truncated]" : trimmed;
  } catch {
    return "";
  }
}

async function recentHermesFiles(): Promise<{ label: string; body: string }[]> {
  const memoryDir = path.join(HERMES_DIR, "memory");
  const out: { label: string; body: string }[] = [];
  const today = dateKey(new Date());
  const days: string[] = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateKey(d));
  }

  const standing = await readIfExists(path.join(memoryDir, "SITUATION.md"), 2000);
  if (standing) out.push({ label: "Hermes now", body: standing });

  for (const day of days) {
    const body = await readIfExists(path.join(memoryDir, `${day}.md`), 1800);
    if (body) out.push({ label: day === today ? "Today's log" : `Log ${day}`, body });
  }

  try {
    const names = await fs.readdir(memoryDir);
    const notes = names
      .filter((n) => n.startsWith("notes-") && n.endsWith(".md"))
      .sort()
      .reverse()
      .slice(0, 4);
    for (const name of notes) {
      const body = await readIfExists(path.join(memoryDir, name), 1200);
      if (body) out.push({ label: name.replace(/^notes-/, "").replace(/\.md$/, ""), body });
    }
  } catch {
    /* no memory dir */
  }

  const memory = await readIfExists(path.join(HERMES_DIR, "MEMORY.md"), 1500);
  if (memory) out.push({ label: "Hermes memory", body: memory });

  try {
    const raw = await fs.readFile(path.join(HERMES_DIR, "tasks.json"), "utf-8");
    const parsed = JSON.parse(raw) as { tasks?: { title: string; status: string; due?: string; notes?: string }[] };
    const open = (parsed.tasks ?? [])
      .filter((t) => t.status !== "done")
      .slice(0, 8)
      .map((t) => `- ${t.title}${t.due ? ` (due ${t.due})` : ""}${t.notes ? `: ${t.notes.slice(0, 80)}` : ""}`);
    if (open.length) out.push({ label: "Hermes inbox", body: open.join("\n") });
  } catch {
    /* no tasks */
  }

  return out;
}

function clipBlocks(blocks: { label: string; body: string }[]): string {
  const lines: string[] = [];
  let used = 0;
  for (const b of blocks) {
    const chunk = `[${b.label}]\n${b.body}`;
    if (used + chunk.length > MAX_TOTAL) break;
    lines.push(chunk);
    used += chunk.length;
  }
  return lines.join("\n\n");
}

export async function loadSituation(state?: AppState): Promise<Situation> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;

  const blocks: { label: string; body: string }[] = [];
  const manual = getManualSituation();
  if (manual.text) {
    blocks.push({
      label: manual.at ? `Settings (${manual.at.slice(0, 10)})` : "Settings",
      body: manual.text,
    });
  }

  blocks.push(...(await recentHermesFiles()));

  if (state?.notes?.length) {
    const recent = state.notes
      .filter((n) => !n.deletedAt)
      .slice(-6)
      .map((n) => {
        const title = (n.title || "").trim() || "Note";
        const body = (n.body || n.text || "").replace(/<[^>]+>/g, " ").trim().slice(0, 180);
        return `- ${title}${body && body !== title ? `: ${body}` : ""}`;
      });
    if (recent.length) blocks.push({ label: "Operator notes", body: recent.join("\n") });
  }

  const text = clipBlocks(blocks);
  const value: Situation = {
    text,
    mode: situationMode(text),
    sources: blocks.map((b) => b.label),
  };
  cache = { at: Date.now(), value };
  return value;
}

export function situationPromptBlock(situation: Situation): string {
  if (!situation.text.trim()) return "";
  return `

---
WHAT IS TRUE RIGHT NOW (from Hermes / today's log / Settings). This is
fresher than the thesis above. If he is at a conference, on the road, or
otherwise not in a normal home-office day, coach THAT day: booth, people,
follow-ups, one public extract. Do not assign founder-day homework, gym
as the main quest, or inbox-clearing as if he were at his desk.
${situation.text}`;
}

export function questMismatchesSituation(
  quest: { title: string; description: string; tasks: { title: string }[] },
  situation: Situation,
): boolean {
  if (situation.mode === "normal") return false;
  const blob = `${quest.title} ${quest.description} ${quest.tasks.map((t) => t.title).join(" ")}`;
  if (situation.mode === "conference") {
    return !/conference|booth|icc|ignition|on.?site|floor|show|prospect/i.test(blob);
  }
  if (situation.mode === "travel") {
    return !/travel|road|hotel|airport|on.?site/i.test(blob);
  }
  return false;
}
