import { defaultSkillForCategory } from "./skills";
import type { AppState, Skill, XpEvent } from "./types";

/** Category-only XP (tasks, missions) must land on a skill or the tree
 *  never moves and it looks like XP was dropped. */
export function normalizeXpEvent(ev: XpEvent): XpEvent {
  if (!ev.skillId && ev.category) {
    ev.skillId = defaultSkillForCategory(ev.category);
  }
  return ev;
}

export function applyXpDelta(skills: Skill[], ev: XpEvent, sign: 1 | -1): void {
  if (!ev.skillId) return;
  const skill = skills.find((s) => s.id === ev.skillId);
  if (skill) skill.xp = Math.max(0, skill.xp + ev.amount * sign);
}

/** Rebuild skill totals from the ledger. Fixes drift and backfills older
 *  task/mission events that were saved with skillId: null. */
export function reconcileSkillXp(state: AppState): void {
  for (const ev of state.xpEvents) normalizeXpEvent(ev);
  const totals = new Map<string, number>();
  for (const ev of state.xpEvents) {
    if (ev.skillId) totals.set(ev.skillId, (totals.get(ev.skillId) ?? 0) + ev.amount);
  }
  for (const skill of state.skills) {
    skill.xp = totals.get(skill.id) ?? 0;
  }
}
