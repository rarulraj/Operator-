import { getWeekPlan, saveWeekPlan, type WeekDayPlan, type WeekPlan } from "../config";
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

function planDump(state: AppState, situation: Situation): string {
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
    `Active missions (this is the plan he put in):\n${missions || "none"}`,
    `Pinned: ${pinned || "none"}`,
    `Open board: ${open || "none"}`,
  ].join("\n\n");
}

function fallbackPlan(state: AppState, situation: Situation, weekOf: string): WeekPlan {
  const missions = state.missions.filter((m) => m.status === "active");
  const promo = missions.find((m) => /promotion|tdengine/i.test(m.title));
  const brand = missions.find((m) => /linkedin|10k|brand/i.test(m.title));
  const body = missions.find((m) => /shred|bench|physic/i.test(m.title));
  const reef = missions.find((m) => /reefly/i.test(m.title));

  const conference = situation.mode === "conference";
  const travel = situation.mode === "travel";

  const manifesto = conference
    ? `This week you are on the floor, not in a course. The plan you wrote is the booth: demos, names, one story that can live on LinkedIn. ${promo ? "The TDengine promotion case is built from conversations like these." : ""} ${brand ? "10,000 followers come from a specific moment, not a recap of the event." : ""} Show up tomorrow the same way. Consistency is the flex.`
    : travel
      ? `You are on the road. The plan does not pause because the desk did. One real conversation and one written extract a day keeps the streak honest. ${body ? "The body still counts: walk, protein, do not invent a rest week." : ""} Come home with proof, not jet lag as an excuse.`
      : `This is your week. The plan is what you already put on the board: ${[promo?.title, brand?.title, reef?.title, body?.title].filter(Boolean).join(", ") || "the missions you chose"}. Seven days of the same scoreboard. Skip the homework energy. Do the next visible thing, then do it again tomorrow.`;

  const days: Omit<WeekDayPlan, "label">[] = conference
    ? [
        { d: 1, title: "On the floor", line: "One real booth conversation. Name, company, why they stopped." },
        { d: 2, title: "Write it hot", line: "The LinkedIn post from yesterday's moment, tonight. Specific, not a recap." },
        { d: 3, title: "Second pass", line: "Another prospect. Ask what they would buy if the demo was already in production." },
        { d: 4, title: "Follow the names", line: "Write the three follow-ups. Promotion cases are made of this, not tickets." },
        { d: 5, title: "Close the loop", line: "Ship the post or the note. Friday is for evidence people can see." },
        { d: 6, title: "Body still counts", line: "Train or walk it off. The conference is not a bye week." },
        { d: 0, title: "Count the week", line: "Names captured, posts shipped, energy left. Set Monday's one work move." },
      ]
    : [
        { d: 1, title: "Evidence Monday", line: promo ? `One piece for "${promo.title}". Something a manager can point at.` : "One piece of work evidence. Not a clean inbox." },
        { d: 2, title: "Make it public", line: brand ? "A real TDengine or customer moment onto LinkedIn. 10k is a volume game of specifics." : "Extract one public note from yesterday's work." },
        { d: 3, title: "Founder hour", line: reef ? `Talk to a Reefly user or ship what they already asked for.` : "One hour on the venture. Users over features." },
        { d: 4, title: "Visible work", line: "Enablement, a POC note, or a follow-up a manager can see." },
        { d: 5, title: "Ship in public", line: "Close a loop people can see. Post, send, cut. Then stop." },
        { d: 6, title: "Body first", line: body ? `Train. ${body.title} does not care that you were busy.` : "Hard session. Saturday is for the body." },
        { d: 0, title: "Scoreboard Sunday", line: "Count what moved. Then write Monday's one action before the week invents itself." },
      ];

  return {
    weekOf,
    manifesto: manifesto.replace(/\s+/g, " ").trim(),
    days: days.map((d) => ({ ...d, label: LABELS[d.d] })),
    mode: situation.mode,
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

async function openAiPlan(state: AppState, situation: Situation, weekOf: string): Promise<WeekPlan | null> {
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

${planDump(state, situation)}

Rules:
- manifesto: 3-5 sentences. Warm and demanding. Name HIS goals (LinkedIn 10k, TDengine promotion, Reefly, body) and THIS week's situation. Make him want to keep the streak. No asterisks. No "your week not a course" product copy.
- days: exactly 7. d is JS weekday (1 Mon … 6 Sat, 0 Sun). title: 2-5 words. line: one concrete, motivating sentence for that day.
- If he is at a conference, the on-site days are booth / names / extract. Home days can return to the longer plan.
- Consistency over novelty. Same scoreboard all week.

Return JSON: { "manifesto": string, "days": [{ "d": number, "title": string, "line": string }] }`,
        },
      ],
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
    const manifesto = typeof parsed.manifesto === "string" ? parsed.manifesto.trim() : "";
    const days = normalizeDays(parsed.days);
    if (!manifesto || days.length < 7) return null;
    return { weekOf, manifesto, days, mode: situation.mode };
  } catch (err) {
    console.error("OpenAI week plan failed:", err);
    return null;
  }
}

export async function ensureWeekPlan(
  state: AppState,
  opts?: { force?: boolean },
): Promise<WeekPlan> {
  const situation = await loadSituation(state);
  const weekOf = weekOfMonday();
  const existing = getWeekPlan();
  if (
    !opts?.force &&
    existing &&
    existing.weekOf === weekOf &&
    existing.mode === situation.mode &&
    existing.days.length === 7
  ) {
    return existing;
  }
  const ai = await openAiPlan(state, situation, weekOf);
  const plan = ai ?? fallbackPlan(state, situation, weekOf);
  saveWeekPlan(plan);
  return plan;
}
