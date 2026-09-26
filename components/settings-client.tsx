"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { resetDataAction } from "@/app/actions";
import { Button, Card, CardHeader } from "./ui";

export function SettingsClient({ dataDir }: { dataDir: string }) {
  const [pending, startTransition] = useTransition();

  function reset(withSampleData: boolean) {
    const message = withSampleData
      ? "Reset everything and reload the sample history?"
      : "Wipe ALL data and start completely fresh? This cannot be undone.";
    if (!window.confirm(message)) return;
    startTransition(() => resetDataAction(withSampleData));
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader title="Data" icon={<RotateCcw size={14} className="text-zinc-500" />} />
      <div className="space-y-3 px-5 pb-5 pt-2">
        <p className="text-sm leading-relaxed text-zinc-400">
          This copy keeps its save in{" "}
          <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[12px] text-zinc-300">
            {dataDir}
          </code>
          . Tasks, notes, chat, and settings stay there. To move them onto another
          machine, quit Operator and run{" "}
          <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[12px] text-zinc-300">
            npm run storage:export
          </code>
          , then on the other machine{" "}
          <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[12px] text-zinc-300">
            npm run storage:import -- ~/Desktop/operator-storage-….tar.gz
          </code>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => reset(true)} disabled={pending}>
            <RotateCcw size={13} />
            Reset with sample data
          </Button>
          <Button variant="danger" onClick={() => reset(false)} disabled={pending}>
            <Trash2 size={13} />
            Start completely fresh
          </Button>
        </div>
      </div>
    </Card>
  );
}
