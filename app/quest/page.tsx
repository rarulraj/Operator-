import { QuestView } from "@/components/quest-view";
import { WeekPlanCard } from "@/components/week-plan-card";
import { JOURNAL_TASK } from "@/lib/daily-quest";
import { ensureWeekPlan } from "@/lib/ai/week-plan";
import { ensureTodayQuest } from "@/lib/game";
import { getStore } from "@/lib/store";
import { dateKey } from "@/lib/store/types";

export const dynamic = "force-dynamic";

export default async function QuestPage() {
  const store = getStore();
  const state = await store.getState();
  const quest = await ensureTodayQuest(state);
  const week = await ensureWeekPlan(state);
  const now = new Date();
  const journalTask = quest.tasks.find((t) => t.title === JOURNAL_TASK);
  const todayKey = dateKey(now);
  const savedJournal =
    [...state.activityLogs]
      .reverse()
      .find((l) => dateKey(new Date(l.createdAt)) === todayKey)?.rawText ?? null;

  return (
    <div className="space-y-6">
      <QuestView
        quest={quest}
        journalTaskId={journalTask?.id ?? null}
        savedJournal={savedJournal}
      />

      <WeekPlanCard plan={week} today={now.getDay()} />
    </div>
  );
}
