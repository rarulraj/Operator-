// ── Operator domain types ──────────────────────────────────────────────────

import type { ShopItem } from "./shop";
import type { Rank } from "./xp";

/** Life pillars. ai_gtm/tfe/reefly are the ventures; work, physical,
 *  social, wealth, and brand (personal / LinkedIn) are the rest. */
export type CategoryId =
  | "ai_gtm"
  | "tfe"
  | "reefly"
  | "work"
  | "physical"
  | "social"
  | "wealth"
  | "brand";

export type MissionStatus = "not_started" | "active" | "completed" | "paused";

export type XpSourceType = "activity" | "quest" | "mission" | "task" | "seed";

/** Tasks and missions can also be uncategorized ("general"). */
export type TrackableCategory = CategoryId | "general";

export interface TodoItem {
  id: string;
  title: string;
  category: TrackableCategory;
  /** Optional mission this task serves. Completing the task nudges the
   *  mission's progress (+1, capped at 99: only you can declare a mission
   *  complete). */
  missionId?: string | null;
  /** Working notes on this task: context, blockers, next step. */
  notes?: string;
  /** Pinned tasks float to the top of their pillar and get first pick on
   *  the daily quest. */
  pinned?: boolean;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface Skill {
  id: string;
  category: CategoryId;
  name: string;
  xp: number;
}

export interface XpEvent {
  id: string;
  skillId: string | null; // null => general XP not tied to one skill
  category: CategoryId | null;
  amount: number;
  sourceType: XpSourceType;
  sourceId: string;
  description: string;
  createdAt: string; // ISO
}

export interface ClassifiedActivity {
  skillId: string;
  skillName: string;
  category: CategoryId;
  xp: number;
  note: string;
}

export interface ActivityLog {
  id: string;
  rawText: string;
  entries: ClassifiedActivity[];
  insight: string;
  nextFocus: string;
  totalXp: number;
  createdAt: string;
}

export interface QuestTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface DailyQuest {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  category: CategoryId;
  skillIds: string[];
  rewardXp: number;
  tasks: QuestTask[];
  status: "active" | "completed";
  reflection: string | null;
  completedAt: string | null;
  // Campaign linkage
  weekIndex?: number; // 1-based campaign week
  dayIndex?: number; // 1-based day within week
  deliverable?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: TrackableCategory;
  progress: number; // 0-100
  target: string;
  deadline: string | null;
  xpReward: number;
  status: MissionStatus;
  createdAt: string;
}

export interface WeeklyReview {
  id: string;
  weekOf: string; // ISO date of week start
  content: string;
  totalXp: number;
  createdAt: string;
}

export interface StreakState {
  current: number;
  longest: number;
  lastCompletionDate: string | null; // YYYY-MM-DD
  activeDates: string[]; // dates with any XP-earning activity
}

export interface CampaignProgress {
  currentWeek: number; // 1-based
  currentDay: number; // 1-based
  completedDays: string[]; // "w{week}d{day}"
  /** 2+ = personal operating week, not the old discovery curriculum. */
  version?: number;
}

/** A folder in the Notes sidebar, Apple Notes style. */
export interface NoteFolder {
  id: string;
  name: string;
  createdAt: string;
}

/** A note. `text` is the legacy scratchpad field; migrated into title+body. */
export interface NoteItem {
  id: string;
  title: string;
  /** HTML body (headings, lists, checklists, images). */
  body: string;
  folderId: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  /** @deprecated migrated to title/body */
  text?: string;
}

/** Gold wallet + owned/equipped shop items (ids from lib/shop.ts). */
export interface Inventory {
  gold: number;
  owned: string[];
  equipped: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/** A durable fact about Arun's life, fed into every AI prompt. This is how
 *  the coach gets smarter over time without editing ARUN_CONTEXT.md.
 *  fileName is set when the note came from an attached file. */
export interface ContextNote {
  id: string;
  text: string;
  createdAt: string;
  fileName?: string;
}

export type WeightUnit = "lb" | "kg";

/** One scale reading per calendar day. `weight` is stored in `unit`. */
export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
  unit: WeightUnit;
  note: string;
  updatedAt: string;
}

export interface AppState {
  playerName: string;
  skills: Skill[];
  xpEvents: XpEvent[];
  activityLogs: ActivityLog[];
  quests: DailyQuest[];
  missions: Mission[];
  todos: TodoItem[];
  notes: NoteItem[];
  noteFolders: NoteFolder[];
  inventory: Inventory;
  chat: ChatMessage[];
  contextNotes: ContextNote[];
  weeklyReviews: WeeklyReview[];
  streak: StreakState;
  campaign: CampaignProgress;
  /** AI/rule-generated campaign weeks beyond the static Season 1 curriculum. */
  customWeeks: CurriculumWeek[];
  /** Rank titles past the base ladder. The ladder does not end. */
  rankTiers: Rank[];
  /** Cosmetics stocked after the printed catalog. The shop keeps restocking. */
  shopStock: ShopItem[];
  /** Daily scale log. One entry per date. */
  weightEntries: WeightEntry[];
  /** Display unit. Entries keep the unit they were logged in. */
  weightUnit: WeightUnit;
  /** Target weight in `weightUnit`. Null until set. */
  weightGoal: number | null;
}

// ── Curriculum (12-week campaign) ───────────────────────────────────────────

export interface CurriculumDay {
  day: number;
  title: string;
  lesson: string;
  deliverable: string;
  category: CategoryId;
  skillIds: string[];
  deliverableSections?: string[];
}

export interface CurriculumWeek {
  week: number;
  title: string;
  theme: string;
  days: CurriculumDay[];
}
