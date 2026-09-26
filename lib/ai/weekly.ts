import { CATEGORY_MAP, emptyCategoryTotals } from "../skills";
import { dateKey } from "../store/types";
import type { AppState, CategoryId, WeeklyReview } from "../types";
import { coachSystemPrompt, getOpenAI, openAiModel } from "./openai";

// ── Weekly review ───────────────────────────────────────────────────────────

const DAY = 86_400_000;

export interface WeekStats {
  totalXp: number;
  byCategory: Record<CategoryId, number>;
  topSkills: { name: string; xp: number }[];
  questsCompleted: number;
  missionsCompleted: string[];
  daysActive: number;
  biggestWinSource: string | null;
}

export function computeWeekStats(state: AppState, weekStart: Date): WeekStats {
  const start = weekStart.getTime();
  const end = start + 7 * DAY;
  const events = state.xpEvents.filter((e) => {
    const t = new Date(e.createdAt).getTime();
    return t >= start && t < end;
  });

  const byCategory: Record<CategoryId, number> = emptyCategoryTotals();
  const skillTotals = new Map<string, number>();
  const days = new Set<string>();
  for (const e of events) {
    if (e.category) byCategory[e.category] += e.amount;
    if (e.skillId) skillTotals.set(e.skillId, (skillTotals.get(e.skillId) ?? 0) + e.amount);
    days.add(dateKey(new Date(e.createdAt)));
  }

  const topSkills = [...skillTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, xp]) => ({
      name: state.skills.find((s) => s.id === id)?.name ?? id,
      xp,
    }));

  const questsCompleted = state.quests.filter((q) => {
    if (q.status !== "completed" || !q.completedAt) return false;
    const t = new Date(q.completedAt).getTime();
    return t >= start && t < end;
  }).length;

  const missionsCompleted = state.xpEvents
    .filter((e) => {
      const t = new Date(e.createdAt).getTime();
      return e.sourceType === "mission" && t >= start && t < end;
    })
    .map((e) => e.description.replace("Mission complete: ", ""));

  const biggest = [...events].sort((a, b) => b.amount - a.amount)[0];

  return {
    totalXp: events.reduce((s, e) => s + e.amount, 0),
    byCategory,
    topSkills,
    questsCompleted,
    missionsCompleted,
    daysActive: days.size,
    biggestWinSource: biggest?.description ?? null,
  };
}

function fallbackReview(stats: WeekStats, state: AppState): string {
  const cats = (Object.entries(stats.byCategory) as [CategoryId, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const strongest = cats[0];
  const weakest = cats[cats.length - 1];
  const weakestSkill = [...state.skills].sort((a, b) => a.xp - b.xp)[0];

  const lines: string[] = [];
  lines.push(
    `**${stats.totalXp} XP** across ${stats.daysActive} active day${stats.daysActive === 1 ? "" : "s"}, ${stats.questsCompleted} quest${stats.questsCompleted === 1 ? "" : "s"} completed.`,
  );
  lines.push("");
  lines.push(
    `**Progress**: Work +${stats.byCategory.work} · Brand +${stats.byCategory.brand} · AI GTM +${stats.byCategory.ai_gtm} · Reefly +${stats.byCategory.reefly}`,
  );
  if (stats.topSkills.length) {
    lines.push(
      `**Strongest skills this week**: ${stats.topSkills.map((s) => `${s.name} (+${s.xp})`).join(", ")}`,
    );
  }
  if (stats.biggestWinSource) {
    lines.push(`**Biggest win**: ${stats.biggestWinSource}.`);
  }
  if (stats.missionsCompleted.length) {
    lines.push(`**Missions completed**: ${stats.missionsCompleted.join("; ")}.`);
  }
  lines.push(
    `**Biggest gap**: ${CATEGORY_MAP[weakest[0]].name} received the least XP (${weakest[1]}). Weakest skill overall: ${weakestSkill?.name ?? "none"}.`,
  );
  lines.push(
    `**Next week**: Keep the ${CATEGORY_MAP[strongest[0]].shortName} momentum, but deliberately route one meaningful task into ${CATEGORY_MAP[weakest[0]].shortName}. Continue the campaign from Week ${state.campaign.currentWeek}, Day ${state.campaign.currentDay}.`,
  );
  return lines.join("\n");
}

export async function generateWeeklyReview(state: AppState): Promise<WeeklyReview> {
  // Week starting Monday
  const now = new Date();
  const weekStart = new Date(now);
  const dow = (now.getDay() + 6) % 7; // Monday = 0
  weekStart.setDate(now.getDate() - dow);
  weekStart.setHours(0, 0, 0, 0);

  const stats = computeWeekStats(state, weekStart);
  let content: string | null = null;

  const openai = getOpenAI();
  if (openai) {
    try {
      const res = await openai.chat.completions.create({
        model: openAiModel(),
        temperature: 0.5,
        max_tokens: 500,
        messages: [
          { role: "system", content: await coachSystemPrompt(state.contextNotes) },
          {
            role: "user",
            content: `Write Arun's weekly review. Use markdown with bold section labels.

Data:
- Total XP: ${stats.totalXp} across ${stats.daysActive} active days
- By category: Work +${stats.byCategory.work}, Brand +${stats.byCategory.brand}, AI GTM +${stats.byCategory.ai_gtm}, TFE +${stats.byCategory.tfe}, Reefly +${stats.byCategory.reefly}
- Top skills: ${stats.topSkills.map((s) => `${s.name} (+${s.xp})`).join(", ") || "none"}
- Quests completed: ${stats.questsCompleted}
- Missions completed: ${stats.missionsCompleted.join("; ") || "none"}
- Biggest single XP event: ${stats.biggestWinSource ?? "none"}
- Campaign position: Week ${state.campaign.currentWeek} Day ${state.campaign.currentDay}

Cover: major accomplishments, total XP, progress per area (AI GTM / TFE / Reefly), biggest win, biggest gap, recommended focus for next week, and 2-3 suggested quests for next week. Sharp and honest, under 250 words. If he was at a conference or on the road this week, review that week, not a generic desk week.`,
          },
        ],
      });
      content = res.choices[0]?.message?.content?.trim() ?? null;
    } catch (err) {
      console.error("OpenAI weekly review failed:", err);
    }
  }

  return {
    id: crypto.randomUUID(),
    weekOf: dateKey(weekStart),
    content: content ?? fallbackReview(stats, state),
    totalXp: stats.totalXp,
    createdAt: new Date().toISOString(),
  };
}
