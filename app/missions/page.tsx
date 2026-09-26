import { MissionsClient } from "@/components/missions-client";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MissionsPage() {
  const state = await getStore().getState();
  const order = { active: 0, not_started: 1, paused: 2, completed: 3 };
  const missions = [...state.missions].sort(
    (a, b) => order[a.status] - order[b.status] || b.xpReward - a.xpReward,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Missions</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Larger real-world goals. Update progress honestly: completing a mission pays
          out its full XP reward.
        </p>
      </div>
      <MissionsClient missions={missions} />
    </div>
  );
}
