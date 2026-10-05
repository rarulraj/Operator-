import { promises as fs } from "fs";
import path from "path";
import { reconcileSkillXp } from "../ledger";
import {
  brandMissions,
  buildSeedState,
  physiqueMissions,
  promotionMission,
  wealthMissions,
} from "../seed";
import { SKILL_DEFS } from "../skills";
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
import { migrateNote, isTrashExpired } from "../notes";
import { dateKey, type Store } from "./types";

// Data lives in .data/ for `next dev`, or in the OS app-data dir when running
// inside the packaged Electron app (where the bundle itself is read-only).
const DATA_DIR =
  process.env.OPERATOR_DATA_DIR || path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
const BACKUP_FILE = path.join(DATA_DIR, "store.backup.json");
const SNAPSHOT_DIR = path.join(DATA_DIR, "backups");
const MAX_SNAPSHOTS = 14;

/**
 * Zero-config file-backed store for local/demo mode.
 * Single-user scale, so read-modify-write of one JSON document is fine.
 *
 * Durability guarantees:
 * - Every mutation is serialized through a queue (no lost updates from
 *   concurrent server actions) and flushed to disk before returning.
 * - Writes are atomic: tmp file → fsync → rename. A kill mid-write can
 *   never corrupt store.json.
 * - store.backup.json mirrors the last good write, and a daily snapshot is
 *   kept for 14 days. On load, corruption falls back main → backup →
 *   newest snapshot, and the corrupt file is preserved for forensics.
 */
export class LocalStore implements Store {
  private queue: Promise<unknown> = Promise.resolve();
  private cached: AppState | null = null;
  /** Identity of the file as we last wrote/read it. If store.json changed
   *  underneath us, the cache is stale and must not be written back. */
  private cachedStamp: string | null = null;

  private clone(state: AppState): AppState {
    return JSON.parse(JSON.stringify(state)) as AppState;
  }

  /** Serialize all store operations so concurrent actions can't clobber
   *  each other's read-modify-write cycles. */
  private enqueue<T>(op: () => Promise<T>): Promise<T> {
    const result = this.queue.then(op);
    this.queue = result.catch(() => undefined);
    return result;
  }

  private applyMigrations(state: AppState): AppState {
    if (!Array.isArray(state.todos)) state.todos = [];
    for (const todo of state.todos) {
      if (todo.notes === undefined) todo.notes = "";
      if (todo.pinned === undefined) todo.pinned = false;
    }
    if (!Array.isArray(state.notes)) state.notes = [];
    if (!Array.isArray(state.noteFolders)) state.noteFolders = [];
    state.notes = state.notes.map(migrateNote).filter((n) => !isTrashExpired(n));
    if (!Array.isArray(state.chat)) state.chat = [];
    if (!Array.isArray(state.contextNotes)) state.contextNotes = [];
    if (!Array.isArray(state.customWeeks)) state.customWeeks = [];
    if (!Array.isArray(state.rankTiers)) state.rankTiers = [];
    if (!Array.isArray(state.shopStock)) state.shopStock = [];
    if (!Array.isArray(state.weightEntries)) state.weightEntries = [];
    state.weightEntries = state.weightEntries.filter(
      (e) =>
        !!e &&
        typeof e.date === "string" &&
        typeof e.weight === "number" &&
        Number.isFinite(e.weight) &&
        (e.unit === "lb" || e.unit === "kg"),
    );
    for (const entry of state.weightEntries) {
      if (typeof entry.note !== "string") entry.note = "";
      if (typeof entry.updatedAt !== "string") entry.updatedAt = new Date().toISOString();
    }
    if (state.weightUnit !== "lb" && state.weightUnit !== "kg") state.weightUnit = "lb";
    if (typeof state.weightGoal !== "number" || !Number.isFinite(state.weightGoal)) {
      state.weightGoal = null;
    }
    // Backfill skills added after the player's save was created
    for (const def of SKILL_DEFS) {
      if (!state.skills.some((s) => s.id === def.id)) {
        state.skills.push({ ...def, xp: 0 });
      }
    }
    if (!state.inventory) {
      state.inventory = { gold: 0, owned: [], equipped: [] };
    }
    // Backfill content added after the player's save was created
    const now = new Date();
    const additions = [
      ...wealthMissions(now),
      ...brandMissions(now),
      promotionMission(now),
      ...physiqueMissions(now),
    ];
    for (let i = additions.length - 1; i >= 0; i--) {
      if (!state.missions.some((m) => m.id === additions[i].id)) {
        state.missions.unshift(additions[i]);
      }
    }
    // One-time strip of the old Season 1 homework. This MUST stay inside the
    // version gate: it matches on title, so running it on every read would
    // silently delete real tasks like "prep discovery questions for Acme".
    if ((state.campaign.version ?? 1) < 2) {
      state.todos = state.todos.filter(
        (t) => !/workflow map|discovery question|complete day 1:/i.test(t.title),
      );
      state.quests = state.quests.filter(
        (q) =>
          q.status === "completed" ||
          !q.tasks.some((t) =>
            /workflow map|discovery question|complete today's lesson|write one takeaway/i.test(
              t.title,
            ),
          ),
      );
      state.campaign = {
        currentWeek: 1,
        currentDay: 1,
        completedDays: [],
        version: 2,
      };
      const today = dateKey(now);
      state.quests = state.quests.filter(
        (q) => q.date !== today || q.status === "completed",
      );
    }
    reconcileSkillXp(state);
    return state;
  }

  /** Nanosecond mtime + size, so any write we did not make invalidates us. */
  private async fileStamp(): Promise<string | null> {
    try {
      const s = await fs.stat(DATA_FILE, { bigint: true });
      return `${s.mtimeNs}:${s.size}`;
    } catch {
      return null;
    }
  }

  private async readUnlocked(): Promise<AppState> {
    // Clean up orphaned tmp files from a previous mid-write kill. Only our
    // own, or ones old enough that no live write could still own them :
    // deleting another process's tmp file breaks its rename.
    try {
      const mine = `store.json.tmp-${process.pid}`;
      for (const f of await fs.readdir(DATA_DIR)) {
        if (!f.startsWith("store.json.tmp-")) continue;
        const full = path.join(DATA_DIR, f);
        if (f !== mine) {
          const age = await fs
            .stat(full)
            .then((s) => Date.now() - s.mtimeMs)
            .catch(() => 0);
          if (age < 60_000) continue;
        }
        await fs.unlink(full).catch(() => {});
      }
    } catch {
      /* dir may not exist yet */
    }

    if (this.cached && (await this.fileStamp()) === this.cachedStamp) {
      return this.cached;
    }
    this.cached = null;

    const state = await this.readWithRecovery();
    if (state) {
      this.cached = state;
      this.cachedStamp = await this.fileStamp();
      return state;
    }

    // Genuine first run (nothing on disk) or unrecoverable: seed a clean
    // slate. Sample/demo data is only created via an explicit Settings reset.
    const seed = buildSeedState(false);
    await this.write(seed);
    return this.cached ?? seed;
  }

  /** Try main → backup → newest snapshot. Returns null if nothing readable. */
  private async readWithRecovery(): Promise<AppState | null> {
    const candidates: string[] = [DATA_FILE, BACKUP_FILE];
    try {
      const snaps = (await fs.readdir(SNAPSHOT_DIR))
        .filter((f) => /^store-\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .sort()
        .reverse();
      if (snaps[0]) candidates.push(path.join(SNAPSHOT_DIR, snaps[0]));
    } catch {
      /* no snapshot dir yet */
    }

    for (const file of candidates) {
      try {
        const raw = await fs.readFile(file, "utf-8");
        const parsed = JSON.parse(raw) as AppState;
        // Only force a re-write when a migration actually has work to do,
        // otherwise every cold start rewrites the file for nothing.
        const dirty =
          (parsed.campaign?.version ?? 1) < 2 ||
          !parsed.missions?.some((m) => m.id === "mission-linkedin-10k") ||
          !parsed.skills?.some((s) => s.id === "linkedin_presence");
        const state = this.applyMigrations(parsed);
        if (dirty || file !== DATA_FILE) {
          // Recovered from a fallback: restore it as the main file.
          if (file !== DATA_FILE) {
            console.warn(`[store] recovered state from ${path.basename(file)}`);
          }
          await this.write(state);
        }
        return state;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          console.warn(`[store] ${path.basename(file)} unreadable, trying fallback`);
          // Preserve the corrupt file for forensics instead of overwriting it
          await fs
            .copyFile(file, `${file}.corrupt-${Date.now()}`)
            .catch(() => {});
        }
      }
    }
    // Nothing readable (corrupt) or nothing at all (first run): caller seeds
    return null;
  }

  private async write(state: AppState): Promise<void> {
    try {
      await this.writeUnsafe(state);
    } catch (err) {
      // Never leave a never-persisted state in the cache: the next read
      // would serve it and the UI would report a save that didn't happen.
      this.cached = null;
      this.cachedStamp = null;
      throw err;
    }
  }

  private async writeUnsafe(state: AppState): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(SNAPSHOT_DIR, { recursive: true });

    // First write of the day: snapshot the CURRENT state before overwriting
    const today = new Date().toISOString().slice(0, 10);
    const snapFile = path.join(SNAPSHOT_DIR, `store-${today}.json`);
    try {
      await fs.access(snapFile);
    } catch {
      try {
        await fs.copyFile(DATA_FILE, snapFile);
      } catch {
        /* no main file yet on first ever write */
      }
    }
    await this.rotateSnapshots();

    // Atomic write: tmp → fsync → rename (rename is atomic on same volume)
    const tmp = `${DATA_FILE}.tmp-${process.pid}`;
    const handle = await fs.open(tmp, "w");
    try {
      await handle.writeFile(JSON.stringify(state, null, 2), "utf-8");
      await handle.sync(); // flush to disk before the rename lands
    } finally {
      await handle.close();
    }
    await fs.rename(tmp, DATA_FILE);
    // Cache only what is actually on disk, and stamp it in the same breath.
    this.cached = state;
    this.cachedStamp = await this.fileStamp();

    // Mirror to the backup file (non-critical if this fails)
    await fs.copyFile(DATA_FILE, BACKUP_FILE).catch(() => {});
  }

  private async rotateSnapshots(): Promise<void> {
    try {
      const snaps = (await fs.readdir(SNAPSHOT_DIR))
        .filter((f) => /^store-\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .sort()
        .reverse();
      for (const stale of snaps.slice(MAX_SNAPSHOTS)) {
        await fs.unlink(path.join(SNAPSHOT_DIR, stale)).catch(() => {});
      }
    } catch {
      /* best effort */
    }
  }

  async getState(): Promise<AppState> {
    return this.enqueue(async () => this.clone(await this.readUnlocked()));
  }

  async mutate(fn: (state: AppState) => void): Promise<AppState> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      fn(state);
      await this.write(state);
      return this.clone(state);
    });
  }

  async addXpEvents(events: XpEvent[]): Promise<void> {
    return this.enqueue(async () => {
      const { applyXpDelta, normalizeXpEvent } = await import("../ledger");
      const state = await this.readUnlocked();
      for (const ev of events) {
        normalizeXpEvent(ev);
        state.xpEvents.push(ev);
        applyXpDelta(state.skills, ev, 1);
      }
      await this.write(state);
    });
  }

  async removeXpEvent(id: string): Promise<void> {
    return this.enqueue(async () => {
      const { applyXpDelta } = await import("../ledger");
      const state = await this.readUnlocked();
      const event = state.xpEvents.find((e) => e.id === id);
      if (event) applyXpDelta(state.skills, event, -1);
      state.xpEvents = state.xpEvents.filter((e) => e.id !== id);
      await this.write(state);
    });
  }

  async addActivityLog(log: ActivityLog, events: XpEvent[]): Promise<void> {
    return this.enqueue(async () => {
      const { applyXpDelta, normalizeXpEvent } = await import("../ledger");
      const state = await this.readUnlocked();
      state.activityLogs.push(log);
      for (const ev of events) {
        normalizeXpEvent(ev);
        state.xpEvents.push(ev);
        applyXpDelta(state.skills, ev, 1);
      }
      await this.write(state);
    });
  }

  async saveQuest(quest: DailyQuest): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      const idx = state.quests.findIndex((q) => q.id === quest.id);
      if (idx >= 0) state.quests[idx] = quest;
      else state.quests.push(quest);
      await this.write(state);
    });
  }

  async updateMission(id: string, patch: Partial<Mission>): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      const idx = state.missions.findIndex((m) => m.id === id);
      if (idx >= 0) state.missions[idx] = { ...state.missions[idx], ...patch };
      await this.write(state);
    });
  }

  async addWeeklyReview(review: WeeklyReview): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      state.weeklyReviews.push(review);
      await this.write(state);
    });
  }

  async saveStreak(streak: StreakState): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      state.streak = streak;
      await this.write(state);
    });
  }

  async saveCampaign(campaign: CampaignProgress): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      state.campaign = campaign;
      await this.write(state);
    });
  }

  async addTodo(todo: TodoItem): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      state.todos.push(todo);
      await this.write(state);
    });
  }

  async updateTodo(id: string, patch: Partial<TodoItem>): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      const idx = state.todos.findIndex((t) => t.id === id);
      if (idx >= 0) state.todos[idx] = { ...state.todos[idx], ...patch };
      await this.write(state);
    });
  }

  async deleteTodo(id: string): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      state.todos = state.todos.filter((t) => t.id !== id);
      await this.write(state);
    });
  }

  async addNote(note: NoteItem): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      state.notes.push(note);
      await this.write(state);
    });
  }

  async updateNote(id: string, patch: Partial<NoteItem>): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      const idx = state.notes.findIndex((n) => n.id === id);
      if (idx < 0) return;
      state.notes[idx] = { ...state.notes[idx], ...patch };
      await this.write(state);
    });
  }

  async deleteNote(id: string): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      state.notes = state.notes.filter((n) => n.id !== id);
      await this.write(state);
    });
  }

  async saveInventory(inventory: Inventory): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      state.inventory = inventory;
      await this.write(state);
    });
  }

  async addChatMessages(messages: ChatMessage[]): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      state.chat.push(...messages);
      await this.write(state);
    });
  }

  async clearChat(): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      state.chat = [];
      await this.write(state);
    });
  }

  async addContextNote(note: ContextNote): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      state.contextNotes.push(note);
      await this.write(state);
    });
  }

  async deleteContextNote(id: string): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      state.contextNotes = state.contextNotes.filter((n) => n.id !== id);
      await this.write(state);
    });
  }

  async addCustomWeek(week: CurriculumWeek): Promise<void> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      if (!state.customWeeks.some((w) => w.week === week.week)) {
        state.customWeeks.push(week);
        await this.write(state);
      }
    });
  }

  async addAiInsight(): Promise<void> {
    // Local mode derives insights on the fly; nothing to persist.
  }

  async resetAll(withSampleData: boolean): Promise<void> {
    return this.enqueue(async () => {
      this.cached = null;
      this.cachedStamp = null;
      await this.write(buildSeedState(withSampleData));
    });
  }
}
