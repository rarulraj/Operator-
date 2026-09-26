import type {
  AppState,
  CampaignProgress,
  ActivityLog,
  ChatMessage,
  ContextNote,
  CurriculumWeek,
  DailyQuest,
  Inventory,
  Mission,
  NoteItem,
  StreakState,
  TodoItem,
  WeeklyReview,
  XpEvent,
} from "../types";

/**
 * Persistence backend: LocalStore keeps everything in .data/store.json.
 * Single-user scale, so one JSON document is all we need.
 *
 * The store is intentionally "dumb": all game rules (streaks, campaign
 * advancement, level math) live in lib/game.ts.
 */
export interface Store {
  getState(): Promise<AppState>;
  /** One read-modify-write. Use this for compound game ops so XP and gold
   *  land in a single flush instead of 4 or 5 disk writes. */
  mutate?(fn: (state: AppState) => void): Promise<AppState>;
  addXpEvents(events: XpEvent[]): Promise<void>;
  /** Remove an XP event (used when a task is un-completed). */
  removeXpEvent?(id: string): Promise<void>;
  addActivityLog(log: ActivityLog, events: XpEvent[]): Promise<void>;
  saveQuest(quest: DailyQuest): Promise<void>;
  updateMission(id: string, patch: Partial<Mission>): Promise<void>;
  addWeeklyReview(review: WeeklyReview): Promise<void>;
  saveStreak(streak: StreakState): Promise<void>;
  saveCampaign(campaign: CampaignProgress): Promise<void>;
  addTodo(todo: TodoItem): Promise<void>;
  updateTodo(id: string, patch: Partial<TodoItem>): Promise<void>;
  deleteTodo(id: string): Promise<void>;
  addNote(note: NoteItem): Promise<void>;
  updateNote(id: string, patch: Partial<NoteItem>): Promise<void>;
  deleteNote(id: string): Promise<void>;
  saveInventory(inventory: Inventory): Promise<void>;
  addChatMessages(messages: ChatMessage[]): Promise<void>;
  clearChat(): Promise<void>;
  addContextNote(note: ContextNote): Promise<void>;
  deleteContextNote(id: string): Promise<void>;
  addCustomWeek(week: CurriculumWeek): Promise<void>;
  addAiInsight(kind: string, content: string): Promise<void>;
  resetAll(withSampleData: boolean): Promise<void>;
}

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysAgo(n: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
}
