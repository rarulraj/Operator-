import { History } from "lucide-react";
import { skillName } from "@/lib/game";
import { CATEGORY_MAP } from "@/lib/skills";
import type { XpEvent } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { Card, CardHeader } from "./ui";

const SOURCE_LABEL: Record<string, string> = {
  activity: "Activity",
  quest: "Quest",
  mission: "Mission",
  seed: "Seed",
};

export function ActivityFeed({ events }: { events: XpEvent[] }) {
  const recent = [...events]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 10);

  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Recent XP Activity"
        icon={<History size={14} className="text-zinc-500" />}
      />
      <div className="px-5 pb-5 pt-2">
        {recent.length === 0 && (
          <p className="py-4 text-sm text-zinc-500">
            No XP yet. Complete a quest or log real work.
          </p>
        )}
        <ul className="divide-y divide-ink-800">
          {recent.map((e) => {
            const meta = e.category ? CATEGORY_MAP[e.category] : null;
            return (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                <span className="tnum w-14 shrink-0 text-right text-sm font-semibold text-xp">
                  +{e.amount}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-zinc-200">{e.description}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
                    {meta && (
                      <span className={meta.tailwind}>{skillName(e.skillId)}</span>
                    )}
                    {!meta && <span>{skillName(e.skillId)}</span>}
                    <span>·</span>
                    <span>{SOURCE_LABEL[e.sourceType] ?? e.sourceType}</span>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-zinc-600">
                  {timeAgo(e.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
