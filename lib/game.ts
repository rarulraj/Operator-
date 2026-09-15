import { buildPersonalQuest, isGenericQuest, JOURNAL_TASK } from "./daily-quest";
import { applyXpDelta, normalizeXpEvent } from "./ledger";
import { GOLD_REWARDS, SHOP_ITEM_MAP } from "./shop";
import { defaultSkillForCategory, SKILL_DEF_MAP } from "./skills";
import { getStore } from "./store";
import { dateKey } from "./store/types";
import { TASK_XP } from "./xp";
import type {
  ActivityLog,
  AppState,
  TrackableCategory,
  ClassifiedActivity,
  DailyQuest,
  XpEvent,
} from "./types";

// ── High-level game operations ──────────────────────────────────────────────
// All rules live here; stores stay dumb.

export function totalXp(state: AppState): number {
  return state.xpEvents.reduce((sum, e) => sum + e.amount, 0);
}

/** Gold moves with real work. Always goes through the store (atomic save). */
async function awardGold(amount: number): Promise<void> {
  const store = getStore();
  if (store.mutate) {
    await store.mutate((state) => {
      state.inventory.gold = Math.max(0, state.inventory.gold + amount);
    });
    return;
  }
  const state = await store.getState();
  const gold = Math.max(0, state.inventory.gold + amount);
  await store.saveInventory({ ...state.inventory, gold });
}

/** Today's quest is built from Arun's board, missions, and weekday —
 *  not from the old discovery curriculum. Generic leftover quests are
 *  replaced in place so the day is never a worksheet. */
export async function ensureTodayQuest(state: AppState): Promise<DailyQuest> {
  const today = dateKey(new Date());
  const store = getStore();

  // Fast path: a good quest already exists in the snapshot we were handed.
  const snapshot = state.quests.find((q) => q.date === today);
  if (
    snapshot &&
    (snapshot.status === "completed" ||
      (!isGenericQuest(snapshot) &&
        snapshot.tasks.some((t) => t.title === JOURNAL_TASK) &&
        snapshot.rewardXp === 80 + snapshot.tasks.length * 20))
  ) {
    return snapshot;
  }

  // Anything that creates or edits the day's quest happens inside one
  // read-modify-write. Two concurrent renders used to each append their own
  // quest for today, and whichever one the user then ticked was the copy
  // that never rendered again.
  if (!store.mutate) return ensureTodayQuestLegacy(state, today);
  let resolved: DailyQuest | null = null;
  await store.mutate((live) => {
    const sameDay = live.quests.filter((q) => q.date === today);
    // Collapse any duplicates a previous race already wrote: keep the
    // completed one, else the one with the most progress.
    let current =
      sameDay.find((q) => q.status === "completed") ??
      sameDay.sort(
        (a, b) =>
          b.tasks.filter((t) => t.completed).length -
          a.tasks.filter((t) => t.completed).length,
      )[0] ??
      null;
    if (sameDay.length > 1 && current) {
      live.quests = live.quests.filter(
        (q) => q.date !== today || q.id === current!.id,
      );
    }

    if (current && current.status === "completed") {
      resolved = current;
      return;
    }

    if (!current || isGenericQuest(current)) {
      const built = buildPersonalQuest(live);
      built.date = today;
      if (current) {
        built.id = current.id;
        live.quests[live.quests.findIndex((q) => q.id === current!.id)] = built;
      } else {
        live.quests.push(built);
      }
      current = built;
    } else if (!current.tasks.some((t) => t.title === JOURNAL_TASK)) {
      // Quests built before journaling was mandatory still need the beat —
      // and the reward has to grow with the extra work.
      current.tasks.push({
        id: crypto.randomUUID(),
        title: JOURNAL_TASK,
        completed: false,
      });
      current.rewardXp = 80 + current.tasks.length * 20;
      const journalSkill = defaultSkillForCategory(current.category);
      if (journalSkill && !current.skillIds.includes(journalSkill)) {
        current.skillIds.push(journalSkill);
      }
    }
    // Keep the reward honest for days that grew a task after being built.
    if (current.status !== "completed") {
      current.rewardXp = 80 + current.tasks.length * 20;
    }
    resolved = current;
  });
  return resolved ?? buildPersonalQuest(state);
}

/** Fallback for stores without mutate(). */
async function ensureTodayQuestLegacy(
  state: AppState,
  today: string,
): Promise<DailyQuest> {
  const store = getStore();
  const existing = state.quests.find((q) => q.date === today);
  if (existing && existing.status === "completed") return existing;
  const quest = buildPersonalQuest(state);
  quest.date = today;
  if (existing) quest.id = existing.id;
  await store.saveQuest(quest);
  return quest;
}

/** Toggle a single quest task. Returns the updated quest. */
export async function toggleQuestTask(
  questId: string,
  taskId: string,
): Promise<DailyQuest | null> {
  const store = getStore();
  if (!store.mutate) {
    const state = await store.getState();
    const quest = state.quests.find((q) => q.id === questId);
    if (!quest || quest.status === "completed") return null;
    const task = quest.tasks.find((t) => t.id === taskId);
    if (!task) return null;
    task.completed = !task.completed;
    await store.saveQuest(quest);
    return quest;
  }
  let updated: DailyQuest | null = null;
  await store.mutate((state) => {
    const quest = state.quests.find((q) => q.id === questId);
    if (!quest || quest.status === "completed") return;
    const task = quest.tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.completed = !task.completed;
    updated = quest;
  });
  return updated;
}

/** Force a quest task done (not a toggle) — used by the journal, which is
 *  only ever marked complete by actually saving an entry. */
export async function markQuestTaskDone(
  questId: string,
  taskId: string,
): Promise<void> {
  const store = getStore();
  const apply = (state: AppState) => {
    const quest = state.quests.find((q) => q.id === questId);
    if (!quest || quest.status === "completed") return null;
    const task = quest.tasks.find((t) => t.id === taskId);
    if (!task || task.completed) return null;
    task.completed = true;
    return quest;
  };
  if (store.mutate) {
    await store.mutate((state) => {
      apply(state);
    });
    return;
  }
  const state = await store.getState();
  const quest = apply(state);
  if (quest) await store.saveQuest(quest);
}

/** Edit the day's task list by hand. The generated quest is a starting
 *  point, not a contract — but journaling stays put and the reward tracks
 *  the amount of work. */
async function editQuest(
  questId: string,
  fn: (quest: DailyQuest) => void,
): Promise<DailyQuest | null> {
  const store = getStore();
  const apply = (state: AppState): DailyQuest | null => {
    const quest = state.quests.find((q) => q.id === questId);
    if (!quest || quest.status === "completed") return null;
    fn(quest);
    quest.rewardXp = 80 + quest.tasks.length * 20;
    return quest;
  };
  if (store.mutate) {
    let updated: DailyQuest | null = null;
    await store.mutate((state) => {
      updated = apply(state);
    });
    return updated;
  }
  const state = await store.getState();
  const quest = apply(state);
  if (quest) await store.saveQuest(quest);
  return quest;
}

export async function addQuestTask(
  questId: string,
  title: string,
): Promise<void> {
  const clean = title.trim();
  if (!clean) return;
  await editQuest(questId, (quest) => {
    // Journaling stays last so the day always closes on the write-up.
    const journalAt = quest.tasks.findIndex((t) => t.title === JOURNAL_TASK);
    const task = { id: crypto.randomUUID(), title: clean, completed: false };
    if (journalAt === -1) quest.tasks.push(task);
    else quest.tasks.splice(journalAt, 0, task);
  });
}

export async function renameQuestTask(
  questId: string,
  taskId: string,
  title: string,
): Promise<void> {
  const clean = title.trim();
  if (!clean) return;
  await editQuest(questId, (quest) => {
    const task = quest.tasks.find((t) => t.id === taskId);
    if (!task || task.title === JOURNAL_TASK) return;
    task.title = clean;
  });
}

export async function removeQuestTask(
  questId: string,
  taskId: string,
): Promise<void> {
  await editQuest(questId, (quest) => {
    const task = quest.tasks.find((t) => t.id === taskId);
    if (!task || task.title === JOURNAL_TASK) return;
    quest.tasks = quest.tasks.filter((t) => t.id !== taskId);
  });
}

export interface QuestCompletion {
  quest: DailyQuest;
  xpAwarded: number;
  streak: number;
  advancedTo: { week: number; day: number } | null;
}

/** Finish a quest: award XP, bump streak, advance the campaign. */
export async function completeQuest(
  questId: string,
  reflection: string,
): Promise<QuestCompletion | null> {
  const store = getStore();
  if (!store.mutate) return completeQuestLegacy(questId, reflection);

  let result: QuestCompletion | null = null;
  // Status guard, XP, gold and streak all inside one read-modify-write.
  // Split across separate writes, two clicks (or a retry during the AI
  // reflection call) paid the reward twice.
  await store.mutate((state) => {
    const quest = state.quests.find((q) => q.id === questId);
    if (!quest || quest.status === "completed") return;
    if (!quest.tasks.every((t) => t.completed)) return;

    const now = new Date();
    quest.status = "completed";
    quest.completedAt = now.toISOString();
    quest.reflection = reflection;

    const event: XpEvent = normalizeXpEvent({
      id: crypto.randomUUID(),
      skillId: quest.skillIds[0] ?? defaultSkillForCategory(quest.category),
      category: quest.category,
      amount: quest.rewardXp,
      sourceType: "quest",
      sourceId: quest.id,
      description: `Quest complete: ${quest.title}`,
      createdAt: now.toISOString(),
    });
    state.xpEvents.push(event);
    applyXpDelta(state.skills, event, 1);
    state.inventory.gold = Math.max(
      0,
      state.inventory.gold + GOLD_REWARDS.quest,
    );

    const today = dateKey(now);
    const yesterday = dateKey(new Date(now.getTime() - 86_400_000));
    const streak = state.streak;
    if (streak.lastCompletionDate === today) {
      // already counted today
    } else if (streak.lastCompletionDate === yesterday) {
      streak.current += 1;
    } else {
      streak.current = 1;
    }
    streak.lastCompletionDate = today;
    streak.longest = Math.max(streak.longest, streak.current);
    if (!streak.activeDates.includes(today)) streak.activeDates.push(today);

    result = {
      quest,
      xpAwarded: quest.rewardXp,
      streak: streak.current,
      advancedTo: null,
    };
  });
  return result;
}

/** Fallback for stores without mutate(). */
async function completeQuestLegacy(
  questId: string,
  reflection: string,
): Promise<QuestCompletion | null> {
  const store = getStore();
  const state = await store.getState();
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest || quest.status === "completed") return null;
  if (!quest.tasks.every((t) => t.completed)) return null;

  const now = new Date();
  quest.status = "completed";
  quest.completedAt = now.toISOString();
  quest.reflection = reflection;

  const event: XpEvent = normalizeXpEvent({
    id: crypto.randomUUID(),
    skillId: quest.skillIds[0] ?? defaultSkillForCategory(quest.category),
    category: quest.category,
    amount: quest.rewardXp,
    sourceType: "quest",
    sourceId: quest.id,
    description: `Quest complete: ${quest.title}`,
    createdAt: now.toISOString(),
  });
  await store.addXpEvents([event]);
  await store.saveQuest(quest);
  await awardGold(GOLD_REWARDS.quest);

  const today = dateKey(now);
  const yesterday = dateKey(new Date(now.getTime() - 86_400_000));
  const streak = { ...state.streak };
  if (streak.lastCompletionDate === today) {
    // already counted today
  } else if (streak.lastCompletionDate === yesterday) {
    streak.current += 1;
  } else {
    streak.current = 1;
  }
  streak.lastCompletionDate = today;
  streak.longest = Math.max(streak.longest, streak.current);
  if (!streak.activeDates.includes(today)) streak.activeDates.push(today);
  await store.saveStreak(streak);

  return {
    quest,
    xpAwarded: quest.rewardXp,
    streak: streak.current,
    advancedTo: null,
  };
}

/** Persist a confirmed activity log with its XP events. */
export async function saveActivityLog(
  rawText: string,
  entries: ClassifiedActivity[],
  insight: string,
  nextFocus: string,
): Promise<ActivityLog> {
  const store = getStore();
  const now = new Date();
  const logId = crypto.randomUUID();
  const total = entries.reduce((s, e) => s + e.xp, 0);
  const log: ActivityLog = {
    id: logId,
    rawText,
    entries,
    insight,
    nextFocus,
    totalXp: total,
    createdAt: now.toISOString(),
  };
  const events: XpEvent[] = entries.map((e) =>
    normalizeXpEvent({
      id: crypto.randomUUID(),
      skillId: e.skillId,
      category: e.category,
      amount: e.xp,
      sourceType: "activity",
      sourceId: logId,
      description: e.note || e.skillName,
      createdAt: now.toISOString(),
    }),
  );
  await store.addActivityLog(log, events);
  await awardGold(GOLD_REWARDS.activity);

  // Activity counts toward streak activity dates (but doesn't increment the streak)
  const state = await store.getState();
  const today = dateKey(now);
  if (!state.streak.activeDates.includes(today)) {
    await store.saveStreak({
      ...state.streak,
      activeDates: [...state.streak.activeDates, today],
    });
  }
  return log;
}

/** Update mission progress/status; awards XP when a mission completes. */
export async function updateMission(
  missionId: string,
  patch: { progress?: number; status?: string },
): Promise<void> {
  const store = getStore();
  const state = await store.getState();
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission) return;

  const wasCompleted = mission.status === "completed";
  const progress =
    patch.progress !== undefined
      ? Math.max(0, Math.min(100, Math.round(patch.progress)))
      : mission.progress;
  let status = (patch.status as typeof mission.status | undefined) ?? mission.status;
  if (progress >= 100) status = "completed";
  else if (status === "completed" && progress < 100) status = "active";

  await store.updateMission(missionId, { progress, status });

  if (status === "completed" && !wasCompleted) {
    const now = new Date();
    const category = mission.category === "general" ? null : mission.category;
    await store.addXpEvents([
      normalizeXpEvent({
        id: crypto.randomUUID(),
        skillId: category ? defaultSkillForCategory(category) : null,
        category,
        amount: mission.xpReward,
        sourceType: "mission",
        sourceId: mission.id,
        description: `Mission complete: ${mission.title}`,
        createdAt: now.toISOString(),
      }),
    ]);
    await awardGold(GOLD_REWARDS.mission);
  }
}

export function skillName(id: string | null): string {
  if (!id) return "General";
  return SKILL_DEF_MAP[id]?.name ?? id;
}

// ── Tasks (todo list) ───────────────────────────────────────────────────────

export async function addTodo(
  title: string,
  category: TrackableCategory,
  missionId?: string | null,
): Promise<void> {
  const store = getStore();
  await store.addTodo({
    id: crypto.randomUUID(),
    title: title.trim(),
    category,
    missionId: missionId || null,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  });
}

/** Delete a task, taking its XP and gold with it. Leaving the ledger event
 *  behind inflates the skill tree with work that no longer exists. */
export async function deleteTodo(todoId: string): Promise<void> {
  const store = getStore();
  if (!store.mutate) {
    await store.deleteTodo(todoId);
    return;
  }
  await store.mutate((state) => {
    const todo = state.todos.find((t) => t.id === todoId);
    state.todos = state.todos.filter((t) => t.id !== todoId);
    if (!todo?.completed) return;
    for (const event of state.xpEvents.filter(
      (e) => e.sourceType === "task" && e.sourceId === todoId,
    )) {
      applyXpDelta(state.skills, event, -1);
      state.inventory.gold = Math.max(
        0,
        state.inventory.gold - GOLD_REWARDS.task,
      );
    }
    state.xpEvents = state.xpEvents.filter(
      (e) => !(e.sourceType === "task" && e.sourceId === todoId),
    );
  });
}

/** Toggle a task; completing one pays a small XP reward to its pillar. */
export async function toggleTodo(todoId: string): Promise<void> {
  const store = getStore();
  if (store.mutate) {
    await store.mutate((state) => {
      const todo = state.todos.find((t) => t.id === todoId);
      if (!todo) return;
      const now = new Date();
      const completing = !todo.completed;
      todo.completed = completing;
      todo.completedAt = completing ? now.toISOString() : null;

      if (completing) {
        const category = todo.category === "general" ? null : todo.category;
        const event = normalizeXpEvent({
          id: crypto.randomUUID(),
          skillId: category ? defaultSkillForCategory(category) : null,
          category,
          amount: TASK_XP,
          sourceType: "task",
          sourceId: todo.id,
          description: `Task done: ${todo.title}`,
          createdAt: now.toISOString(),
        });
        state.xpEvents.push(event);
        applyXpDelta(state.skills, event, 1);
        const today = dateKey(now);
        if (!state.streak.activeDates.includes(today)) {
          state.streak.activeDates.push(today);
        }
        if (todo.missionId) {
          const mission = state.missions.find((m) => m.id === todo.missionId);
          if (mission && mission.status !== "completed") {
            mission.progress = Math.min(99, mission.progress + 1);
          }
        }
        state.inventory.gold = Math.max(0, state.inventory.gold + GOLD_REWARDS.task);
      } else {
        const event = state.xpEvents.find(
          (e) => e.sourceType === "task" && e.sourceId === todoId,
        );
        if (event) {
          applyXpDelta(state.skills, event, -1);
          state.xpEvents = state.xpEvents.filter((e) => e.id !== event.id);
        }
        if (todo.missionId) {
          const mission = state.missions.find((m) => m.id === todo.missionId);
          if (mission && mission.status !== "completed") {
            mission.progress = Math.max(0, mission.progress - 1);
          }
        }
        state.inventory.gold = Math.max(0, state.inventory.gold - GOLD_REWARDS.task);
      }
    });
    return;
  }

  const state = await store.getState();
  const todo = state.todos.find((t) => t.id === todoId);
  if (!todo) return;
  const now = new Date();
  const completing = !todo.completed;
  await store.updateTodo(todoId, {
    completed: completing,
    completedAt: completing ? now.toISOString() : null,
  });
  if (completing) {
    const category = todo.category === "general" ? null : todo.category;
    await store.addXpEvents([
      normalizeXpEvent({
        id: crypto.randomUUID(),
        skillId: category ? defaultSkillForCategory(category) : null,
        category,
        amount: TASK_XP,
        sourceType: "task",
        sourceId: todo.id,
        description: `Task done: ${todo.title}`,
        createdAt: now.toISOString(),
      }),
    ]);
    await awardGold(GOLD_REWARDS.task);
  } else {
    const fresh = await store.getState();
    const event = fresh.xpEvents.find(
      (e) => e.sourceType === "task" && e.sourceId === todoId,
    );
    if (event) await store.removeXpEvent?.(event.id);
    await awardGold(-GOLD_REWARDS.task);
  }
}

// ── The Shop ────────────────────────────────────────────────────────────────
// Gold buys cosmetics only. Power comes from XP; style comes from gold.

export async function buyItem(
  itemId: string,
): Promise<{ ok: boolean; error?: string }> {
  const item = SHOP_ITEM_MAP[itemId];
  if (!item) return { ok: false, error: "Unknown item." };
  const store = getStore();
  const state = await store.getState();
  if (state.inventory.owned.includes(itemId)) return { ok: false, error: "Already owned." };
  if (state.inventory.gold < item.cost) return { ok: false, error: "Not enough gold." };
  await store.saveInventory({
    ...state.inventory,
    gold: state.inventory.gold - item.cost,
    owned: [...state.inventory.owned, itemId],
  });
  return { ok: true };
}

/** Equip/unequip an owned item. One item per type (frame/aura/companion/
 *  title) can be equipped at a time — equipping one unequips the others. */
export async function equipItem(
  itemId: string,
  equip: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const item = SHOP_ITEM_MAP[itemId];
  if (!item) return { ok: false, error: "Unknown item." };
  const store = getStore();
  const state = await store.getState();
  const { owned, equipped } = state.inventory;
  if (!owned.includes(itemId)) return { ok: false, error: "You don't own that yet." };

  let next: string[];
  if (equip) {
    const sameType = new Set(
      SHOP_ITEM_MAP
        ? Object.values(SHOP_ITEM_MAP)
            .filter((i) => i.type === item.type)
            .map((i) => i.id)
        : [],
    );
    next = [...equipped.filter((id) => !sameType.has(id)), itemId];
  } else {
    next = equipped.filter((id) => id !== itemId);
  }
  await store.saveInventory({ ...state.inventory, equipped: next });
  return { ok: true };
}
