import { ArrowRight, Swords } from "lucide-react";
import Link from "next/link";
import { badgeMeta } from "@/lib/skills";
import type { Mission } from "@/lib/types";
import { Badge, Card, CardHeader, Progress } from "./ui";

export function BossBattles({ missions }: { missions: Mission[] }) {
  const active = missions
    .filter((m) => m.status === "active")
    .sort((a, b) => b.xpReward - a.xpReward)
    .slice(0, 4);

  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Boss Battles"
        icon={<Swords size={14} className="text-zinc-500" />}
        action={
          <Link
            href="/missions"
            className="flex items-center gap-1 text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-100"
          >
            All missions <ArrowRight size={13} />
          </Link>
        }
      />
      <div className="space-y-3 px-5 pb-5 pt-2">
        {active.length === 0 && (
          <p className="py-4 text-sm text-zinc-500">
            No active missions. Activate one from the Missions page.
          </p>
        )}
        {active.map((m) => {
          const meta = badgeMeta(m.category);
          return (
            <div
              key={m.id}
              className="rounded-lg border border-ink-700/50 bg-ink-850/60 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-100">
                    {m.title}
                  </div>
                  <div className="mt-0.5 truncate text-[12px] text-zinc-500">
                    {m.target}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {meta && <Badge className={meta.tailwind}>{meta.shortName}</Badge>}
                  <Badge className="text-xp">+{m.xpReward}</Badge>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <Progress
                  value={m.progress / 100}
                  className="flex-1"
                  barClassName={meta?.bar ?? "bg-zinc-400"}
                />
                <span className="tnum w-9 text-right text-[11px] font-medium text-zinc-400">
                  {m.progress}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
