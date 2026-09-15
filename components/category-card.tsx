import Link from "next/link";
import { CATEGORY_MAP } from "@/lib/skills";
import type { CategoryId, Skill } from "@/lib/types";
import { formatXp, levelFromXp } from "@/lib/xp";
import { Card, Progress } from "./ui";

export function CategoryCard({
  category,
  skills,
}: {
  category: CategoryId;
  skills: Skill[];
}) {
  const meta = CATEGORY_MAP[category];
  const xp = skills.reduce((s, x) => s + x.xp, 0);
  const lvl = levelFromXp(xp);
  const topSkill = [...skills].sort((a, b) => b.xp - a.xp)[0];

  return (
    <Link href="/skills" className="block transition-transform duration-150 hover:-translate-y-0.5">
      <Card className="h-full px-5 py-4 hover:border-ink-600">
        <div className="flex items-center justify-between">
          <span className={`text-[12px] font-semibold uppercase tracking-wider ${meta.tailwind}`}>
            {meta.shortName}
          </span>
          <span className="tnum text-[11px] font-medium text-zinc-500">
            Lv {lvl.level}
          </span>
        </div>
        <div className="tnum mt-2 text-2xl font-semibold text-zinc-100">
          {formatXp(xp)}
          <span className="ml-1 text-sm font-normal text-zinc-500">XP</span>
        </div>
        <Progress value={lvl.progress} className="mt-3" barClassName={meta.bar} />
        <div className="mt-2 truncate text-[11px] text-zinc-500">
          {topSkill && topSkill.xp > 0
            ? `Top skill: ${topSkill.name} · Lv ${levelFromXp(topSkill.xp).level}`
            : "No XP yet — log real work to begin"}
        </div>
      </Card>
    </Link>
  );
}
