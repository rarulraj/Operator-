import { WeightClient } from "@/components/weight-client";
import { getStore } from "@/lib/store";
import { dateKey } from "@/lib/store/types";

export const dynamic = "force-dynamic";

export default async function WeightPage() {
  const state = await getStore().getState();
  const today = dateKey(new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Weight</h1>
        <p className="mt-1 text-sm text-zinc-500">
          One scale reading a day. The chart keeps the trend. Set a goal if you want the line.
        </p>
      </div>
      <WeightClient
        today={today}
        unit={state.weightUnit}
        goal={state.weightGoal}
        entries={state.weightEntries}
      />
    </div>
  );
}
