import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORY_MAP } from "@/lib/skills";
import type { Skill } from "@/lib/types";
import { levelFromXp } from "@/lib/xp";
import { Card, CardHeader, Progress } from "./ui";

export function SkillGrowth({ skills }: { skills: Skill[] }) {
  const top = [...skills].sort((a, b) => b.xp - a.xp).slice(0, 6);

  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Skill Growth"
        icon={<TrendingUp size={14} className="text-zinc-500" />}
        action={
          <Link
            href="/skills"
            className="flex items-center gap-1 text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Full tree <ArrowRight size={13} />
          </Link>
        }
      />
      <div className="space-y-3 px-5 pb-5 pt-2">
        {top.map((s) => {
          const meta = CATEGORY_MAP[s.category];
          const lvl = levelFromXp(s.xp);
          return (
            <div key={s.id}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="text-zinc-300">
                  {s.name}
                  <span className={`ml-2 ${meta.tailwind}`}>{meta.shortName}</span>
                </span>
                <span className="tnum text-zinc-500">
                  Lv {lvl.level} · {s.xp} XP
                </span>
              </div>
              <Progress value={lvl.progress} barClassName={meta.bar} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
