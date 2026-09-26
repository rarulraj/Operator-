import { Flame, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import {
  CategoryDonut,
  CumulativeChart,
  WeeklyXpChart,
} from "@/components/insights-charts";
import { Card, CardHeader } from "@/components/ui";
import { WeeklyReviewPanel } from "@/components/weekly-review";
import {
  categoryTotals,
  cumulativeXpSeries,
  evidenceScoreboard,
  streakCalendar,
  weeklyXpSeries,
} from "@/lib/insights";
import { CATEGORY_MAP } from "@/lib/skills";
import { getStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { levelFromXp } from "@/lib/xp";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const state = await getStore().getState();

  const weekly = weeklyXpSeries(state);
  const categories = categoryTotals(state);
  const cumulative = cumulativeXpSeries(state);
  const evidence = evidenceScoreboard(state);
  const calendar = streakCalendar(state);

  const sortedSkills = [...state.skills].sort((a, b) => b.xp - a.xp);
  const strongest = sortedSkills.slice(0, 3);
  const weakest = sortedSkills.slice(-3).reverse();
  const completedQuests = state.quests.filter((q) => q.status === "completed").length;
  const completedMissions = state.missions.filter((m) => m.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Insights</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Progression over time: and the evidence that you&apos;re becoming the person
          you said you wanted to become.
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Quests completed", value: completedQuests },
          { label: "Missions completed", value: completedMissions },
          { label: "Current streak", value: `${state.streak.current}d` },
          { label: "Longest streak", value: `${state.streak.longest}d` },
        ].map((s) => (
          <Card key={s.label} className="px-4 py-3">
            <div className="tnum text-xl font-semibold text-zinc-100">{s.value}</div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2">
          <CardHeader
            title="XP by Week"
            icon={<TrendingUp size={14} className="text-zinc-500" />}
          />
          <div className="px-3 pb-4 pt-2">
            <WeeklyXpChart data={weekly} />
          </div>
          <div className="flex items-center gap-4 px-5 pb-4 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-gtm" /> AI GTM
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-tfe" /> TFE
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-reef" /> Reefly
            </span>
          </div>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader title="XP by Pillar" />
          <div className="px-3 pb-4 pt-2">
            <CategoryDonut data={categories} />
          </div>
        </Card>
      </div>

      <Card className="animate-fade-up">
        <CardHeader title="Cumulative XP: Last 30 Days" />
        <div className="px-3 pb-4 pt-2">
          <CumulativeChart data={cumulative} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Strongest / weakest */}
        <Card className="animate-fade-up">
          <CardHeader
            title="Skill Balance"
            icon={<TrendingDown size={14} className="text-zinc-500" />}
          />
          <div className="grid grid-cols-2 gap-4 px-5 pb-5 pt-2">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-reef">
                Strongest
              </div>
              <ul className="space-y-2">
                {strongest.map((s) => (
                  <li key={s.id} className="text-[13px]">
                    <span className="text-zinc-200">{s.name}</span>
                    <span className="tnum ml-1.5 text-[11px] text-zinc-500">
                      Lv {levelFromXp(s.xp).level}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                Weakest
              </div>
              <ul className="space-y-2">
                {weakest.map((s) => (
                  <li key={s.id} className="text-[13px]">
                    <span className="text-zinc-200">{s.name}</span>
                    <span className="tnum ml-1.5 text-[11px] text-zinc-500">
                      Lv {levelFromXp(s.xp).level}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Streak calendar */}
        <Card className="animate-fade-up">
          <CardHeader
            title="Streak History: Last 35 Days"
            icon={<Flame size={14} className="text-orange-400" />}
          />
          <div className="px-5 pb-5 pt-3">
            <div className="grid grid-cols-7 gap-1.5">
              {calendar.map((d) => (
                <div
                  key={d.date}
                  title={d.date}
                  className={cn(
                    "aspect-square rounded-[4px]",
                    d.active ? "bg-xp/80" : "bg-ink-800",
                  )}
                />
              ))}
            </div>
            <p className="mt-3 text-[11px] text-zinc-600">
              A day counts when you earn XP: quest, journal entry, or mission.
            </p>
          </div>
        </Card>
      </div>

      {/* Evidence scoreboard */}
      <Card className="animate-fade-up">
        <CardHeader
          title="Evidence Scoreboard"
          icon={<ShieldCheck size={14} className="text-zinc-500" />}
        />
        <p className="px-5 text-[12px] text-zinc-500">
          Outcomes, not activity. This is the long-term answer to &quot;am I becoming
          who I said I would?&quot;
        </p>
        <div className="grid grid-cols-2 gap-2.5 px-5 pb-5 pt-3 sm:grid-cols-3 lg:grid-cols-5">
          {evidence.map((e) => (
            <div
              key={e.label}
              className="rounded-lg border border-ink-800 bg-ink-850/40 px-3 py-2.5"
            >
              <div
                className={cn(
                  "tnum text-lg font-semibold",
                  e.count > 0 ? "text-zinc-100" : "text-zinc-600",
                )}
              >
                {e.count}
              </div>
              <div className="mt-0.5 text-[10.5px] leading-tight text-zinc-500">
                {e.label}
                {e.category && (
                  <span className={cn("ml-1", CATEGORY_MAP[e.category].tailwind)}>
                    · {CATEGORY_MAP[e.category].shortName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <WeeklyReviewPanel reviews={state.weeklyReviews} />
    </div>
  );
}
