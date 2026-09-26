"use client";

import { Calendar, Pause, Play, Swords, Target } from "lucide-react";
import { useState, useTransition } from "react";
import { updateMissionAction } from "@/app/actions";
import { badgeMeta } from "@/lib/skills";
import type { Mission, MissionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, Progress } from "./ui";

const STATUS_LABEL: Record<MissionStatus, string> = {
  not_started: "Not Started",
  active: "Active",
  completed: "Completed",
  paused: "Paused",
};

const STATUS_STYLE: Record<MissionStatus, string> = {
  not_started: "text-zinc-400",
  active: "text-gtm",
  completed: "text-reef",
  paused: "text-amber-300",
};

function MissionCard({ mission }: { mission: Mission }) {
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState(mission.progress);
  const meta = badgeMeta(mission.category);
  const completed = mission.status === "completed";

  function save(nextProgress: number) {
    setProgress(nextProgress);
    startTransition(() =>
      updateMissionAction(mission.id, { progress: nextProgress }),
    );
  }

  function setStatus(status: MissionStatus) {
    startTransition(() => updateMissionAction(mission.id, { status }));
  }

  return (
    <Card
      className={cn(
        "animate-fade-up px-5 py-4",
        completed && "border-reef/25 bg-reef/5",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={cn(
                "text-[15px] font-semibold tracking-tight",
                completed ? "text-zinc-400 line-through" : "text-zinc-100",
              )}
            >
              {mission.title}
            </h3>
            <Badge className={STATUS_STYLE[mission.status]}>
              {STATUS_LABEL[mission.status]}
            </Badge>
            {meta && <Badge className={meta.tailwind}>{meta.shortName}</Badge>}
            <Badge className="text-xp">+{mission.xpReward} XP</Badge>
          </div>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-zinc-400">
            {mission.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <Target size={11} /> {mission.target}
            </span>
            {mission.deadline && (
              <span className="flex items-center gap-1">
                <Calendar size={11} /> {mission.deadline}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          disabled={pending || completed}
          onChange={(e) => setProgress(Number(e.target.value))}
          onMouseUp={(e) => save(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => save(Number((e.target as HTMLInputElement).value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink-700 accent-amber-400 disabled:cursor-default disabled:opacity-50"
        />
        <Progress value={progress / 100} className="hidden" />
        <span className="tnum w-10 text-right text-[12px] font-semibold text-zinc-300">
          {progress}%
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {mission.status === "not_started" && (
          <Button variant="ghost" onClick={() => setStatus("active")} disabled={pending}>
            <Play size={13} /> Start
          </Button>
        )}
        {mission.status === "active" && !completed && (
          <Button variant="ghost" onClick={() => setStatus("paused")} disabled={pending}>
            <Pause size={13} /> Pause
          </Button>
        )}
        {mission.status === "paused" && (
          <Button variant="ghost" onClick={() => setStatus("active")} disabled={pending}>
            <Play size={13} /> Resume
          </Button>
        )}
        {completed && (
          <span className="text-[12px] font-medium text-reef">
            Mission complete: +{mission.xpReward} XP earned
          </span>
        )}
      </div>
    </Card>
  );
}

export function MissionsClient({ missions }: { missions: Mission[] }) {
  const groups: { status: MissionStatus; label: string }[] = [
    { status: "active", label: "Active: Boss Battles" },
    { status: "not_started", label: "Not Started" },
    { status: "paused", label: "Paused" },
    { status: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-6">
      {groups.map(({ status, label }) => {
        const list = missions.filter((m) => m.status === status);
        if (!list.length) return null;
        return (
          <section key={status}>
            <div className="mb-3 flex items-center gap-2 text-[13px] font-medium uppercase tracking-wider text-zinc-400">
              <Swords size={14} className="text-zinc-500" />
              {label}
              <span className="tnum text-zinc-600">({list.length})</span>
            </div>
            <div className="space-y-3">
              {list.map((m) => (
                <MissionCard key={m.id} mission={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
