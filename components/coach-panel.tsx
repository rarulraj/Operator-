"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { coachAction } from "@/app/actions";
import { Card, CardHeader } from "./ui";

export function CoachPanel({ initial }: { initial: string[] }) {
  const [recs, setRecs] = useState(initial);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      setRecs(await coachAction());
    });
  }

  return (
    <Card className="animate-fade-up border-ink-600/70 bg-gradient-to-b from-ink-850/80 to-ink-900/70">
      <CardHeader
        title="AI Coach"
        icon={<Sparkles size={14} className="text-xp" />}
        action={
          <button
            onClick={refresh}
            disabled={pending}
            className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-100 disabled:opacity-40"
          >
            <RefreshCw size={12} className={pending ? "animate-spin" : ""} />
            {pending ? "Thinking…" : "Refresh"}
          </button>
        }
      />
      <div className="space-y-3 px-5 pb-5 pt-2">
        {recs.map((rec, i) => (
          <div key={i} className="flex gap-3">
            <span className="tnum mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-ink-600 bg-ink-800 text-[10px] font-semibold text-zinc-400">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-zinc-300">{rec}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
