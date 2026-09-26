import { ActivityFeed } from "@/components/activity-feed";
import { BossBattles } from "@/components/boss-battles";
import { CategoryCard } from "@/components/category-card";
import { CoachPanel } from "@/components/coach-panel";
import { PlayerHeader } from "@/components/player-header";
import { QuestCard } from "@/components/quest-card";
import { SkillGrowth } from "@/components/skill-growth";
import { TaskBriefPanel } from "@/components/task-brief";
import { TasksClient } from "@/components/tasks-client";
import { coachRecommendations } from "@/lib/ai/coach";
import { summarizeBoard } from "@/lib/ai/task-brief";
import { ensureTodayQuest, totalXp } from "@/lib/game";
import { CATEGORIES } from "@/lib/skills";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const store = getStore();
  const state = await store.getState();
  const quest = await ensureTodayQuest(state);
  const xp = totalXp(state);
  const coach = await coachRecommendations(state, { allowAi: false });
  const brief = await summarizeBoard(state, { allowAi: false });

  return (
    <div className="space-y-5">
      <PlayerHeader
        name={state.playerName}
        totalXp={xp}
        streak={state.streak.current}
        questDoneToday={quest.status === "completed"}
        inventory={state.inventory}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <CategoryCard
            key={c.id}
            category={c.id}
            skills={state.skills.filter((s) => s.category === c.id)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QuestCard quest={quest} />
        <div className="space-y-4">
          <TaskBriefPanel initial={brief} />
          <TasksClient
            todos={[...state.todos].sort(
              (a, b) =>
                Number(a.completed) - Number(b.completed) ||
                +new Date(b.createdAt) - +new Date(a.createdAt),
            )}
            missions={state.missions}
            maxOpen={6}
          />
        </div>
      </div>

      <BossBattles missions={state.missions} />

      <CoachPanel initial={coach} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ActivityFeed events={state.xpEvents} />
        <SkillGrowth skills={state.skills} />
      </div>
    </div>
  );
}
