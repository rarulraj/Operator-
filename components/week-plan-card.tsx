"use client";

import { RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { refreshWeekPlanAction } from "@/app/actions";
import type { WeekPlan } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "./ui";

export function WeekPlanCard({
  plan,
  today,
}: {
  plan: WeekPlan;
  today: number;
}) {
  const [live, setLive] = useState(plan);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      const next = await refreshWeekPlanAction();
      setLive(next);
    });
  }

  const ordered = [1, 2, 3, 4, 5, 6, 0]
    .map((d) => live.days.find((x) => x.d === d))
    .filter((x): x is WeekPlan["days"][number] => Boolean(x));

  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Your week"
        action={
          <button
            type="button"
            onClick={refresh}
            disabled={pending}
            className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 hover:text-zinc-100 disabled:opacity-40"
          >
            <RefreshCw size={12} className={pending ? "animate-spin" : ""} />
            {pending ? "Writing…" : "Rewrite week"}
          </button>
        }
      />
      <p className="px-5 pb-1 text-[15px] leading-relaxed text-zinc-200">
        {live.manifesto}
      </p>
      <p className="px-5 pb-2 text-[12px] text-zinc-500">
        Built from the plan you put in: missions, situation, board. Same scoreboard
        all seven days.
      </p>
      <div className="grid grid-cols-1 gap-1.5 px-5 pb-5 pt-2 sm:grid-cols-2 lg:grid-cols-7">
        {ordered.map((day) => {
          const isToday = day.d === today;
          return (
            <div
              key={day.label}
              className={cn(
                "rounded-lg border px-3 py-2.5",
                isToday ? "border-xp/40 bg-xp/10" : "border-ink-800 bg-ink-850/40",
              )}
            >
              <div
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider",
                  isToday ? "text-xp" : "text-zinc-500",
                )}
              >
                {day.label}
                {isToday ? " · today" : ""}
              </div>
              <div className="mt-1 text-[13px] font-semibold text-zinc-100">
                {day.title}
              </div>
              <p className="mt-1 text-[12px] leading-snug text-zinc-400">{day.line}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
