import { Network } from "lucide-react";
import { Card, CardHeader, Progress } from "@/components/ui";
import { CATEGORIES, skillsForCategory } from "@/lib/skills";
import { getStore } from "@/lib/store";
import type { Skill } from "@/lib/types";
import { formatXp, levelFromXp } from "@/lib/xp";

export const dynamic = "force-dynamic";

function SkillRow({
  skill,
  recentNotes,
}: {
  skill: Skill;
  recentNotes: string[];
}) {
  const lvl = levelFromXp(skill.xp);
  return (
    <div className="rounded-lg border border-ink-800 bg-ink-850/40 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-200">{skill.name}</span>
        <span className="tnum shrink-0 text-[12px] text-zinc-500">
          <span className="font-semibold text-zinc-300">Lv {lvl.level}</span> ·{" "}
          {formatXp(skill.xp)} XP
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Progress value={lvl.progress} className="flex-1" />
        <span className="tnum w-16 text-right text-[10px] text-zinc-600">
          {formatXp(lvl.intoLevel)}/{formatXp(lvl.levelSpan)}
        </span>
      </div>
      {recentNotes.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {recentNotes.slice(0, 2).map((note, i) => (
            <li key={i} className="truncate text-[11px] text-zinc-500">
              · {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function SkillsPage() {
  const state = await getStore().getState();

  // Recent contributing activities per skill
  const notesBySkill = new Map<string, string[]>();
  const sorted = [...state.xpEvents].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
  for (const e of sorted) {
    if (!e.skillId) continue;
    const list = notesBySkill.get(e.skillId) ?? [];
    if (list.length < 2 && e.description) list.push(`+${e.amount} ${e.description}`);
    notesBySkill.set(e.skillId, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Skill Tree</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {CATEGORIES.length} pillars, {state.skills.length} skills. Completing a
          task, quest, or log should move the matching tree — if it does not, that is a bug.
        </p>
      </div>

      {CATEGORIES.map((cat) => {
        const skills = skillsForCategory(cat.id, state.skills);
        const catXp = skills.reduce((s, x) => s + x.xp, 0);
        const catLvl = levelFromXp(catXp);
        return (
          <Card key={cat.id} className="animate-fade-up">
            <CardHeader
              title={`${cat.name} — Lv ${catLvl.level}`}
              icon={<Network size={14} className={cat.tailwind} />}
              action={
                <span className={`tnum text-[12px] font-medium ${cat.tailwind}`}>
                  {formatXp(catXp)} XP
                </span>
              }
            />
            <p className="px-5 text-[12px] text-zinc-500">{cat.description}</p>
            <div className="grid grid-cols-1 gap-2.5 px-5 pb-5 pt-3 md:grid-cols-2">
              {skills.map((skill) => (
                <SkillRow
                  key={skill.id}
                  skill={skill}
                  recentNotes={notesBySkill.get(skill.id) ?? []}
                />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
