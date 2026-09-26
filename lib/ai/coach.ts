import { CATEGORY_MAP, emptyCategoryTotals } from "../skills";
import { todoNotes } from "../todos";
import { levelFromXp } from "../xp";
import type { AppState, CategoryId } from "../types";
import { coachSystemPrompt, getOpenAI, openAiModel } from "./openai";
import { loadSituation, type Situation } from "./situation";

// ── AI Coach ────────────────────────────────────────────────────────────────
// Produces 1-3 sharp recommendations from current state.
// OpenAI when configured; otherwise a rule engine that looks at the same data.

const DAY = 86_400_000;

function recentEvents(state: AppState, days: number) {
  const cutoff = Date.now() - days * DAY;
  return state.xpEvents.filter((e) => new Date(e.createdAt).getTime() >= cutoff);
}

function categoryXpIn(events: { category: CategoryId | null; amount: number }[]) {
  const totals: Record<CategoryId, number> = emptyCategoryTotals();
  for (const e of events) {
    if (e.category) totals[e.category] += e.amount;
  }
  return totals;
}

function skillXpIn(events: { skillId: string | null; amount: number }[]) {
  const totals = new Map<string, number>();
  for (const e of events) {
    if (e.skillId) totals.set(e.skillId, (totals.get(e.skillId) ?? 0) + e.amount);
  }
  return totals;
}

function ruleBasedCoach(state: AppState, situation?: Situation): string[] {
  const recs: string[] = [];
  if (situation?.mode === "conference") {
    recs.push(
      "You are at the conference. One real booth conversation (name, company, why they stopped) and a LinkedIn extract from the floor beat any desk work you invented this morning.",
    );
  } else if (situation?.mode === "travel") {
    recs.push(
      "You are on the road. Protect one real conversation and one written follow-up. Do not build a full home-office day from here.",
    );
  }
  const last14 = recentEvents(state, 14);
  const catTotals = categoryXpIn(last14);
  const skillTotals = skillXpIn(last14);

  // 1. Category imbalance
  const entries = Object.entries(catTotals) as [CategoryId, number][];
  const max = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const min = entries.reduce((a, b) => (b[1] < a[1] ? b : a));
  if (max[1] > 0 && max[1] >= Math.max(100, min[1] * 2)) {
    if (max[0] === "ai_gtm" && min[0] !== "ai_gtm") {
      recs.push(
        min[0] === "tfe"
          ? "Your AI GTM XP is compounding while TFE sits idle. Turn one lesson from this week's AI work into a short post: distribution debt is the hardest to pay down later."
          : "Your AI GTM work is outpacing Reefly. Point one discovery or architecture exercise this week at your own product.",
      );
    } else if (max[0] === "reefly" && min[0] === "tfe") {
      recs.push(
        "Reefly is getting all the reps and TFE none. Your publishing streak is slipping: turn one lesson from this week's product work into a short post.",
      );
    } else {
      recs.push(
        `${CATEGORY_MAP[max[0]].shortName} XP is growing much faster than ${CATEGORY_MAP[min[0]].shortName}. Deliberately route one real task this week into ${CATEGORY_MAP[min[0]].shortName}.`,
      );
    }
  }

  // 2. Technical vs. selling imbalance within AI GTM
  const tech = (skillTotals.get("ai_architecture") ?? 0) + (skillTotals.get("rag") ?? 0) + (skillTotals.get("agents") ?? 0);
  const selling = (skillTotals.get("executive_selling") ?? 0) + (skillTotals.get("roi_business_cases") ?? 0);
  if (tech >= 100 && selling * 2 < tech) {
    recs.push(
      "Your architecture XP is growing much faster than your executive-selling XP. Try turning one technical customer conversation this week into a 3-minute business-value explanation.",
    );
  }

  // 3. Product work without customer conversations
  const productXp = skillTotals.get("product") ?? 0;
  const convXp = (skillTotals.get("customer_discovery") ?? 0) + (skillTotals.get("discovery") ?? 0);
  if (productXp >= 100 && convXp === 0) {
    recs.push(
      "You have logged product work for Reefly this week but no customer conversations. Schedule one user interview before you ship anything else.",
    );
  }

  // 4. Personal brand / LinkedIn gap
  if ((catTotals.brand ?? 0) < 25 && recs.length < 3) {
    recs.push(
      "Personal brand is quiet. 10,000 LinkedIn followers will not happen from lurk-mode: post one specific story from a TDengine or customer moment this week.",
    );
  }

  // 5. TFE publishing gap
  const writingXp = skillTotals.get("writing") ?? 0;
  if (writingXp === 0 && catTotals.tfe < 50 && recs.length < 3) {
    recs.push(
      "TFE is idle. If you already posted on LinkedIn, fine: if not, turn one real work moment into a short note for founders.",
    );
  }

  // 5. Active mission with no recent movement
  const staleMission = state.missions.find(
    (m) => m.status === "active" && m.progress > 0 && m.progress < 100,
  );
  if (staleMission && recs.length < 3) {
    recs.push(
      `"${staleMission.title}" is at ${staleMission.progress}%. Define the single next action that moves it and do that first tomorrow.`,
    );
  }

  // 6. Fallback: weakest skill
  if (!recs.length) {
    const weakest = [...state.skills].sort((a, b) => a.xp - b.xp)[0];
    recs.push(
      weakest
        ? `Your weakest skill is ${weakest.name} (level ${levelFromXp(weakest.xp).level}). Find one real task this week that forces you to use it.`
        : "Log today's real work to calibrate the coach.",
    );
  }

  return recs.slice(0, 3);
}

async function openAiCoach(
  state: AppState,
  situation?: Situation,
): Promise<string[] | null> {
  const openai = getOpenAI();
  if (!openai) return null;

  const last14 = recentEvents(state, 14);
  const catTotals = categoryXpIn(last14);
  const topSkills = [...state.skills]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5)
    .map((s) => `${s.name} L${levelFromXp(s.xp).level} (${s.xp} XP)`);
  const weakSkills = [...state.skills]
    .sort((a, b) => a.xp - b.xp)
    .slice(0, 5)
    .map((s) => `${s.name} (${s.xp} XP)`);
  const activeMissions = state.missions
    .filter((m) => m.status === "active")
    .map((m) => `${m.title}: ${m.progress}%`)
    .join("; ");
  const recentLogs = state.activityLogs
    .slice(-4)
    .map((l) => l.rawText.slice(0, 140))
    .join(" | ");
  const openTasks = state.todos
    .filter((t) => !t.completed)
    .slice(0, 10)
    .map((t) => {
      const bits = [t.title];
      if (t.pinned) bits.push("pinned");
      const notes = todoNotes(t);
      if (notes) bits.push(`note: ${notes.slice(0, 120)}`);
      return bits.join(": ");
    })
    .join("\n");

  try {
    const res = await openai.chat.completions.create({
      model: openAiModel(),
      response_format: { type: "json_object" },
      temperature: 0.5,
      messages: [
        { role: "system", content: await coachSystemPrompt(state.contextNotes) },
        {
          role: "user",
          content: `Give Arun 2-3 coaching recommendations based on his current state.

Last 14 days XP by category: AI GTM ${catTotals.ai_gtm}, TFE ${catTotals.tfe}, Reefly ${catTotals.reefly}, Work ${catTotals.work}, Brand ${catTotals.brand}, Physical ${catTotals.physical}, Wealth ${catTotals.wealth}
Strongest skills: ${topSkills.join(", ")}
Weakest skills: ${weakSkills.join(", ")}
Streak: ${state.streak.current} days
Active missions: ${activeMissions || "none"}
Open tasks (working notes matter):
${openTasks || "none"}
Recent activity logs: ${recentLogs || "none"}
Campaign position: Week ${state.campaign.currentWeek}, Day ${state.campaign.currentDay}
Live situation (obey this over a normal weekday script):
${situation?.text || "none captured"}

Rules: each recommendation 1-2 sentences, specific, references his actual data, names the gap and the move. No motivation, no fluff. If he is at a conference or on the road, coach that day.

Return JSON: { "recommendations": string[] }`,
        },
      ],
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
    const recs = (parsed.recommendations ?? []).filter(
      (r: unknown): r is string => typeof r === "string" && r.length > 10,
    );
    return recs.length ? recs.slice(0, 3) : null;
  } catch (err) {
    console.error("OpenAI coach failed, falling back to rules:", err);
    return null;
  }
}

export async function coachRecommendations(
  state: AppState,
  opts?: { allowAi?: boolean },
): Promise<string[]> {
  const situation = await loadSituation(state);
  if (opts?.allowAi !== false) {
    const ai = await openAiCoach(state, situation);
    if (ai) return ai;
  }
  return ruleBasedCoach(state, situation);
}
