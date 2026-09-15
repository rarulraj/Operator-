// ── XP engine ───────────────────────────────────────────────────────────────
// Increasing curve: the XP *delta* between consecutive levels grows by 50.
//   L1→0, L2→100, L3→250, L4→450, L5→700, L6→1000, L7→1350, L8→1750 …
// Closed form: threshold(n) = 25·n·(n+1) − 50  for n ≥ 2.

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 25 * level * (level + 1) - 50;
}

export interface LevelInfo {
  level: number;
  /** XP accumulated toward the current level (numerator for display). */
  intoLevel: number;
  /** XP span of the current level (denominator for display). */
  levelSpan: number;
  /** Absolute XP threshold where the current level started. */
  floor: number;
  /** Absolute XP threshold where the next level starts. */
  ceiling: number;
  /** 0–1 progress through the current level. */
  progress: number;
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  const levelSpan = ceiling - floor;
  const intoLevel = xp - floor;
  return {
    level,
    intoLevel,
    levelSpan,
    floor,
    ceiling,
    progress: levelSpan === 0 ? 0 : intoLevel / levelSpan,
  };
}

// ── Ranks / titles ──────────────────────────────────────────────────────────

export interface Rank {
  title: string;
  minXp: number;
}

export const RANKS: Rank[] = [
  { title: "Apprentice", minXp: 0 },
  { title: "Builder", minXp: 250 },
  { title: "Operator", minXp: 700 },
  { title: "Strategist", minXp: 1350 },
  { title: "Architect", minXp: 2200 },
  { title: "Advisor", minXp: 3850 },
  { title: "Principal", minXp: 6750 },
  { title: "Master Operator", minXp: 10450 },
];

export function rankFromXp(xp: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXp) current = rank;
  }
  return current;
}

export function nextRank(xp: number): Rank | null {
  for (const rank of RANKS) {
    if (xp < rank.minXp) return rank;
  }
  return null;
}

// ── Baseline reward table (reference for the AI + heuristics) ───────────────

export const XP_REWARDS = {
  smallLearning: 20,
  dailyLesson: 30,
  artifact: 50,
  publishContent: 75,
  customerConversation: 75,
  applySkillRealWork: 100,
  shipProduct: 150,
  majorMilestone: 250,
} as const;

export function formatXp(n: number): string {
  return n.toLocaleString("en-US");
}

/** Small execution reward for completing a task — outcomes still rule. */
export const TASK_XP = 10;
