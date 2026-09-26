import { TaskBriefPanel } from "@/components/task-brief";
import { TasksClient } from "@/components/tasks-client";
import { summarizeBoard } from "@/lib/ai/task-brief";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const state = await getStore().getState();
  const todos = [...state.todos].sort(
    (a, b) => Number(a.completed) - Number(b.completed) || +new Date(b.createdAt) - +new Date(a.createdAt),
  );
  const brief = await summarizeBoard(state);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Tasks</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The chore board. Small real tasks, tagged to a pillar. Click a title to
          rename, the note icon to keep working context, pin to float it.
          Completing one pays a little XP: the big XP still comes from quests,
          journal entries, and missions.
        </p>
      </div>
      <TaskBriefPanel initial={brief} />
      <TasksClient todos={todos} missions={state.missions} />
    </div>
  );
}
