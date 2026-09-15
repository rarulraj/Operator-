import { QuestView } from "@/components/quest-view";
import { Card, CardHeader } from "@/components/ui";
import { JOURNAL_TASK } from "@/lib/daily-quest";
import { ensureTodayQuest } from "@/lib/game";
import { getStore } from "@/lib/store";
import { dateKey } from "@/lib/store/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const WEEK = [
  { d: 1, label: "Mon", name: "Promotion evidence" },
  { d: 2, label: "Tue", name: "Work → LinkedIn" },
  { d: 3, label: "Wed", name: "Founder day" },
  { d: 4, label: "Thu", name: "Make work visible" },
  { d: 5, label: "Fri", name: "Ship in public" },
  { d: 6, label: "Sat", name: "Body first" },
  { d: 0, label: "Sun", name: "Scoreboard" },
];

export default async function QuestPage() {
  const store = getStore();
  const state = await store.getState();
  const quest = await ensureTodayQuest(state);
  const now = new Date();
  const today = now.getDay();
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

      <Card className="animate-fade-up">
        <CardHeader title="Your week — not a course" />
        <p className="px-5 text-[12px] text-zinc-500">
          Quests come from your board, missions, and the day. Discovery worksheets
          are gone. LinkedIn 10k, the TDengine promotion, Reefly, and the body are
          the scoreboard.
        </p>
        <div className="grid grid-cols-2 gap-1.5 px-5 pb-5 pt-3 sm:grid-cols-4 lg:grid-cols-7">
          {WEEK.map((day) => {
            const isToday = day.d === today;
            return (
              <div
                key={day.label}
                className={cn(
                  "rounded-lg border px-3 py-2.5",
                  isToday
                    ? "border-xp/30 bg-xp/5"
                    : "border-ink-800 bg-ink-850/40",
                )}
              >
                <div
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    isToday ? "text-xp" : "text-zinc-500",
                  )}
                >
                  {day.label}
                  {isToday ? " · today" : ""}
                </div>
                <div className="mt-1 text-[13px] font-medium text-zinc-200">
                  {day.name}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
