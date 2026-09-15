import { ShopClient } from "@/components/shop-client";
import { totalXp } from "@/lib/game";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const state = await getStore().getState();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Shop</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pierre&apos;s, basically. Gold comes from real work — tasks, quests, journal
          entries, missions — and buys style only. Power still comes from XP.
        </p>
      </div>
      <ShopClient inventory={state.inventory} totalXp={totalXp(state)} />
    </div>
  );
}
