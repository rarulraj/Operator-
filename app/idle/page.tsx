import { IdleScene } from "@/components/idle-scene";
import { totalXp } from "@/lib/game";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function IdlePage() {
  const state = await getStore().getState();
  return (
    <IdleScene
      name={state.playerName}
      totalXp={totalXp(state)}
      streak={state.streak.current}
      inventory={state.inventory}
    />
  );
}
