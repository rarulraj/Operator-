import { Coins, Flame, Shield } from "lucide-react";
import { SHOP_ITEM_MAP } from "@/lib/shop";
import type { Inventory } from "@/lib/types";
import { formatXp, levelFromXp, nextRank, rankFromXp } from "@/lib/xp";
import { Character } from "./character";
import { Card, Progress } from "./ui";

export function PlayerHeader({
  name,
  totalXp,
  streak,
  questDoneToday,
  inventory,
}: {
  name: string;
  totalXp: number;
  streak: number;
  questDoneToday: boolean;
  inventory: Inventory;
}) {
  const lvl = levelFromXp(totalXp);
  const rank = rankFromXp(totalXp);
  const upcoming = nextRank(totalXp);
  const titleId = inventory.equipped.find((id) => id.startsWith("title-"));
  const title = titleId ? SHOP_ITEM_MAP[titleId]?.titleText : null;

  return (
    <Card className="animate-fade-up px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <Character
            totalXp={totalXp}
            streak={streak}
            questDoneToday={questDoneToday}
            inventory={inventory}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-pixel text-xl font-bold tracking-tight text-zinc-50">
                {name}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-xp/25 bg-xp/10 px-2 py-0.5 font-pixel text-[10px] font-bold uppercase tracking-wider text-xp">
                <Shield size={11} strokeWidth={2.4} />
                {rank.title}
              </span>
              {title && (
                <span className="inline-flex items-center rounded-md border border-ink-600 bg-ink-800 px-2 py-0.5 font-pixel text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                  {title}
                </span>
              )}
            </div>
            <div className="mt-1.5 text-sm text-zinc-400">
              Level <span className="tnum font-semibold text-zinc-200">{lvl.level}</span>
              {upcoming && (
                <span className="text-zinc-500">
                  {" "}
                  · {formatXp(upcoming.minXp - totalXp)} XP to {upcoming.title}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="tnum font-pixel text-lg font-bold text-zinc-100">
              {formatXp(totalXp)}
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Total XP
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <Coins size={17} className="text-xp" strokeWidth={2} />
              <span className="tnum font-pixel text-lg font-bold text-zinc-100">
                {inventory.gold}
              </span>
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Gold
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <Flame
                size={18}
                className={streak > 0 ? "text-orange-400" : "text-zinc-600"}
                strokeWidth={2}
              />
              <span className="tnum font-pixel text-lg font-bold text-zinc-100">
                {streak}
              </span>
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Day Streak
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-zinc-500">
          <span>
            Level {lvl.level} → {lvl.level + 1}
          </span>
          <span className="tnum">
            {formatXp(lvl.intoLevel)} / {formatXp(lvl.levelSpan)} XP
          </span>
        </div>
        <Progress value={lvl.progress} className="h-2" shimmer />
      </div>
    </Card>
  );
}
