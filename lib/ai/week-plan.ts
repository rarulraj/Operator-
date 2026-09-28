import { getWeekPlan, saveWeekPlan, type WeekDayPlan, type WeekPlan } from "../config";
import { modeOn, refreshKnowledge, type KnowledgeGraph } from "../knowledge/graph";
import { dateKey } from "../store/types";
import type { AppState } from "../types";
import { coachSystemPrompt, getOpenAI, openAiModel } from "./openai";
import { loadSituation, type Situation } from "./situation";

const LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekOfMonday(now = new Date()): string {
  const d = new Date(now);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return dateKey(d);
}

function dateForDow(weekOf: string, dow: number): string {
  const [y, m, d] = weekOf.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const offset = dow === 0 ? 6 : dow - 1;
  date.setDate(date.getDate() + offset);
  return dateKey(date);
}

export function weekGraphKey(graph: KnowledgeGraph, weekOf: string): string {
  return [1, 2, 3, 4, 5, 6, 0]
    .map((dow) => {
      const day = dateForDow(weekOf, dow);
      return `${day}:${modeOn(graph, day)}`;
    })
    .join(",");
}

function planDump(state: AppState, situation: Situation, dayList: string): string {
  const missions = state.missions
    .filter((m) => m.status === "active")
    .map((m) => `${m.title} (${m.progress}%)`)
    .join("\n");
  const pinned = state.todos
    .filter((t) => !t.completed && t.pinned)
    .map((t) => t.title)
    .slice(0, 6)
    .join("; ");
  const open = state.todos
    .filter((t) => !t.completed)
    .slice(0, 8)
    .map((t) => t.title)
    .join("; ");
  const streak = state.streak.current;
  return [
    `Streak: ${streak} days`,
    `Live situation:\n${situation.text || "desk week"}`,
    `Per-day modes (authoritative; one conference date does not paint the week):\n${dayList}`,
    `Active missions (this is the plan he put in):\n${missions || "none"}`,
    `Pinned: ${pinned || "none"}`,
    `Open board: ${open || "none"}`,
  ].join("\n\n");
}

function deskDay(
  dow: number,
  promo?: { title: string },
  brand?: { title: string },
  body?: { title: string },
  reef?: { title: string },
): Omit<WeekDayPlan, "label"> {
  switch (dow) {
    case 1:
      return { d: 1, title: "Evidence Monday", line: promo ? `One piece for "${promo.title}". Something a manager can point at.` : "One piece of work evidence. Not a clean inbox." };
    case 2:
      return { d: 2, title: "Make it public", line: brand ? "A real TDengine or customer moment onto LinkedIn. 10k is a volume game of specifics." : "Extract one public note from yesterday's work." };
    case 3:
      return { d: 3, title: "Founder hour", line: reef ? "Talk to a Reefly user or ship what they already asked for." : "One hour on the venture. Users over features." };
    case 4:
      return { d: 4, title: "Visible work", line: "Enablement, a POC note, or a follow-up a manager can see." };
    case 5:
      return { d: 5, title: "Ship in public", line: "Close a loop people can see. Post, send, cut. Then stop." };
    case 6:
      return { d: 6, title: "Body first", line: body ? `Train. ${body.title} does not care that you were busy.` : "Hard session. Saturday is for the body." };
    default:
      return { d: 0, title: "Scoreboard Sunday", line: "Count what moved. Then write Monday's one action before the week invents itself." };
  }
}

function fallbackPlan(
  state: AppState,
  situation: Situation,
  weekOf: string,
  graph: KnowledgeGraph,
): WeekPlan {
  const missions = state.missions.filter((m) => m.status === "active");
  const promo = missions.find((m) => /promotion|tdengine/i.test(m.title));
  const brand = missions.find((m) => /linkedin|10k|brand/i.test(m.title));
  const body = missions.find((m) => /shred|bench|physic/i.test(m.title));
  const reef = missions.find((m) => /reefly/i.test(m.title));

  const modes = [1, 2, 3, 4, 5, 6, 0].map((dow) => modeOn(graph, dateForDow(weekOf, dow)));
  const conferenceDays = modes.filter((m) => m === "conference").length;

  const manifesto =
    situation.mode === "conference"
      ? `Today is on the floor: demos, names, one public extract. That fact is dated to today. The other days keep the normal scoreboard unless the graph has a fact for them. ${brand ? "10,000 followers come from a specific moment, not a recap of the event." : ""}`.trim()
      : situation.mode === "travel"
        ? `You are on the road today. One real conversation and one written extract. The rest of the week follows its own facts. ${body ? "The body still counts when you are home." : ""}`.trim()
        : conferenceDays
          ? `A conference day is already in the graph, and it is not today. Today is a desk day: ${[promo?.title, brand?.title, reef?.title].filter(Boolean).join(", ") || "the missions you chose"}.`
          : `This is your week. The plan is what you already put on the board: ${[promo?.title, brand?.title, reef?.title, body?.title].filter(Boolean).join(", ") || "the missions you chose"}. Each day follows the graph. Do the next visible thing, then do it again tomorrow.`;

  const days: Omit<WeekDayPlan, "label">[] = [1, 2, 3, 4, 5, 6, 0].map((dow) => {
    const mode = modeOn(graph, dateForDow(weekOf, dow));
    if (mode === "conference") {
      return {
        d: dow,
        title: "On the floor",
        line: "Demos, names, and one public extract. Inbox and founder homework wait until home.",
      };
    }
    if (mode === "travel") {
      return {
        d: dow,
        title: "On the road",
        line: "One real conversation and one written extract. Do not invent a full desk day.",
      };
    }
    return deskDay(dow, promo, brand, body, reef);
  });

  return {
    weekOf,
    manifesto: manifesto.replace(/\s+/g, " ").trim(),
    days: days.map((d) => ({ ...d, label: LABELS[d.d] })),
    mode: situation.mode,
    graphKey: weekGraphKey(graph, weekOf),
  };
}

function normalizeDays(raw: unknown): WeekDayPlan[] {
  if (!Array.isArray(raw)) return [];
  const byD = new Map<number, WeekDayPlan>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const d = Number(rec.d);
    if (!Number.isInteger(d) || d < 0 || d > 6) continue;
    const title = String(rec.title ?? "").trim();
    const line = String(rec.line ?? rec.why ?? "").trim();
    if (!title || !line) continue;
    byD.set(d, { d, label: LABELS[d], title: title.slice(0, 42), line: line.slice(0, 180) });
  }
  return [1, 2, 3, 4, 5, 6, 0].map((d) => byD.get(d)).filter((x): x is WeekDayPlan => Boolean(x));
}

async function openAiPlan(
  state: AppState,
  situation: Situation,
  weekOf: string,
  graph: KnowledgeGraph,
): Promise<WeekPlan | null> {
  const openai = getOpenAI();
  if (!openai) return null;
  try {
    const res = await openai.chat.completions.create({
      model: openAiModel(),
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [
        { role: "system", content: await coachSystemPrompt(state.contextNotes) },
        {
          role: "user",
          content: `Write Arun's week. Motivating. Consistent. The PLAN is what he already put in: missions, situation, board. Do not invent a course or discovery worksheets.

${planDump(state, situation, [1, 2, 3, 4, 5, 6, 0].map((dow) => `${LABELS[dow]} ${dateForDow(weekOf, dow)}: ${modeOn(graph, dateForDow(weekOf, dow))}`).join("\n"))}

Rules:
- manifesto: 3-5 sentences. Warm and demanding. Name HIS goals (LinkedIn 10k, TDengine promotion, Reefly, body) and THIS week's situation. Make him want to keep the streak. No asterisks. No "your week not a course" product copy.
- days: exactly 7. d is JS weekday (1 Mon … 6 Sat, 0 Sun). title: 2-5 words. line: one concrete, motivating sentence for that day.
- Follow the per-day modes. A conference fact on one date makes only that date a booth day (demos, names, one extract). Do not repaint the rest of the week.
- Consistency over novelty. Same scoreboard on desk days.

Return JSON: { "manifesto": string, "days": [{ "d": number, "title": string, "line": string }] }`,
        },
      ],
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
    const manifesto = typeof parsed.manifesto === "string" ? parsed.manifesto.trim() : "";
    const days = normalizeDays(parsed.days);
    if (!manifesto || days.length < 7) return null;
    return { weekOf, manifesto, days, mode: situation.mode, graphKey: weekGraphKey(graph, weekOf) };
  } catch (err) {
    console.error("OpenAI week plan failed:", err);
    return null;
  }
}

export async function ensureWeekPlan(
  state: AppState,
  opts?: { force?: boolean },
): Promise<WeekPlan> {
  const [situation, graph] = await Promise.all([loadSituation(state), refreshKnowledge()]);
  const weekOf = weekOfMonday();
  const graphKey = weekGraphKey(graph, weekOf);
  const existing = getWeekPlan();
  if (
    !opts?.force &&
    existing &&
    existing.weekOf === weekOf &&
    existing.graphKey === graphKey &&
    existing.days.length === 7
  ) {
    return existing;
  }
  const base = fallbackPlan(state, situation, weekOf, graph);
  // The graph owns the days. A model must not turn a desk Monday into a booth week
  // because last week's logs still mention the conference.
  if (situation.mode === "normal") {
    saveWeekPlan(base);
    return base;
  }
  const ai = await openAiPlan(state, situation, weekOf, graph);
  const plan: WeekPlan = ai ? { ...base, manifesto: ai.manifesto } : base;
  saveWeekPlan(plan);
  return plan;
}
