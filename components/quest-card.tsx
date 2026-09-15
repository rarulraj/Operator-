import { ArrowRight, CheckCircle2, Circle, ScrollText } from "lucide-react";
import Link from "next/link";
import { CATEGORY_MAP } from "@/lib/skills";
import type { DailyQuest } from "@/lib/types";
import { Badge, Card, CardHeader, Progress } from "./ui";

export function QuestCard({ quest }: { quest: DailyQuest }) {
  const meta = CATEGORY_MAP[quest.category];
  const done = quest.tasks.filter((t) => t.completed).length;
  const total = quest.tasks.length;
  const complete = quest.status === "completed";

  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Today's Quest"
        icon={<ScrollText size={14} className="text-zinc-500" />}
        action={
          <Link
            href="/quest"
            className="flex items-center gap-1 text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Open <ArrowRight size={13} />
          </Link>
        }
      />
      <div className="px-5 pb-5 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {meta && <Badge className={meta.tailwind}>{meta.shortName}</Badge>}
          <Badge className="text-xp">+{quest.rewardXp} XP</Badge>
          {complete && <Badge className="text-reef">Complete</Badge>}
        </div>
        <h3 className="mt-2.5 text-[17px] font-semibold tracking-tight text-zinc-100">
          {quest.title}
        </h3>
        <ul className="mt-3 space-y-1.5">
          {quest.tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              {t.completed ? (
                <CheckCircle2 size={15} className="shrink-0 text-reef" />
              ) : (
                <Circle size={15} className="shrink-0 text-zinc-600" />
              )}
              <span className={t.completed ? "text-zinc-500 line-through" : "text-zinc-300"}>
                {t.title}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={total ? done / total : 0} className="flex-1" barClassName={meta.bar} />
          <span className="tnum text-[11px] font-medium text-zinc-500">
            {done}/{total}
          </span>
        </div>
      </div>
    </Card>
  );
}
