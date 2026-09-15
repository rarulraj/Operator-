import { CATEGORY_MAP, emptyCategoryTotals } from "./skills";
import { dateKey } from "./store/types";
import type { AppState, CategoryId } from "./types";

// ── Insights aggregations ───────────────────────────────────────────────────

const DAY = 86_400_000;

export interface WeeklyXpPoint {
  week: string; // label e.g. "Sep 7"
  ai_gtm: number;
  tfe: number;
  reefly: number;
  work: number;
  physical: number;
  social: number;
  wealth: number;
  brand: number;
  general: number;
  total: number;
}

export function weeklyXpSeries(state: AppState, weeks = 8): WeeklyXpPoint[] {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // Monday start
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - dow);
  thisMonday.setHours(0, 0, 0, 0);

  const points: WeeklyXpPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisMonday.getTime() - i * 7 * DAY);
    const end = new Date(start.getTime() + 7 * DAY);
    const events = state.xpEvents.filter((e) => {
      const t = new Date(e.createdAt).getTime();
      return t >= start.getTime() && t < end.getTime();
    });
    const point: WeeklyXpPoint = {
      week: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ai_gtm: 0,
      tfe: 0,
      reefly: 0,
      work: 0,
      physical: 0,
      social: 0,
      wealth: 0,
      brand: 0,
      general: 0,
      total: 0,
    };
    for (const e of events) {
      const key = e.category ?? "general";
      point[key] += e.amount;
      point.total += e.amount;
    }
    points.push(point);
  }
  return points;
}

export function categoryTotals(state: AppState) {
  const totals: Record<CategoryId, number> = emptyCategoryTotals();
  for (const e of state.xpEvents) {
    if (e.category) totals[e.category] += e.amount;
  }
  return (Object.entries(totals) as [CategoryId, number][]).map(([id, value]) => ({
    name: CATEGORY_MAP[id].shortName,
    value,
    fill: CATEGORY_MAP[id].color,
  }));
}

export function cumulativeXpSeries(state: AppState, days = 30) {
  const sorted = [...state.xpEvents].sort(
    (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
  );
  const points: { day: string; xp: number }[] = [];
  let running = 0;
  let idx = 0;
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * DAY);
    const key = dateKey(day);
    while (
      idx < sorted.length &&
      dateKey(new Date(sorted[idx].createdAt)) <= key
    ) {
      running += sorted[idx].amount;
      idx++;
    }
    points.push({
      day: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      xp: running,
    });
  }
  return points;
}

// ── Evidence scoreboard ─────────────────────────────────────────────────────
// From ARUN_CONTEXT.md: "Do not measure only activity. Track evidence."
// Keyword-matched over the XP ledger descriptions.

const EVIDENCE_RULES: { label: string; category: CategoryId | null; pattern: RegExp }[] = [
  { label: "AI workflows mapped", category: "ai_gtm", pattern: /workflow map/i },
  { label: "Architectures designed", category: "ai_gtm", pattern: /architect/i },
  { label: "POCs scoped / run", category: "ai_gtm", pattern: /poc|pilot/i },
  { label: "Security / governance handled", category: "ai_gtm", pattern: /permission|security|governance|compliance/i },
  { label: "Customer conversations", category: null, pattern: /call|conversation|interview/i },
  { label: "Posts published", category: "tfe", pattern: /publish|post/i },
  { label: "Founder relationships", category: "tfe", pattern: /intro|networking|founder/i },
  { label: "Things shipped", category: "reefly", pattern: /ship|launch|deploy|release/i },
  { label: "User interviews", category: "reefly", pattern: /interview|user call/i },
  { label: "Revenue events", category: "reefly", pattern: /revenue|mrr|paid|signed/i },
  { label: "LinkedIn posts", category: "brand", pattern: /linkedin|followers|personal brand/i },
];

export function evidenceScoreboard(state: AppState) {
  return EVIDENCE_RULES.map((rule) => ({
    label: rule.label,
    category: rule.category,
    count: state.xpEvents.filter(
      (e) =>
        rule.pattern.test(e.description) &&
        (rule.category === null || e.category === rule.category),
    ).length,
  }));
}

export function streakCalendar(state: AppState, days = 35): { date: string; active: boolean }[] {
  const set = new Set(state.streak.activeDates);
  const out: { date: string; active: boolean }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY);
    const key = dateKey(d);
    out.push({ date: key, active: set.has(key) });
  }
  return out;
}
