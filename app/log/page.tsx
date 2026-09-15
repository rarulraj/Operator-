import { BookOpen, Sparkles } from "lucide-react";
import { LogForm } from "@/components/log-form";
import { Badge, Card } from "@/components/ui";
import { CATEGORY_MAP } from "@/lib/skills";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function LogPage() {
  const state = await getStore().getState();
  const logs = [...state.activityLogs].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
          Activity Log
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your daily journal. Write what you actually did — the coach attributes XP,
          spots the pattern, and tells you what to do next.
        </p>
      </div>

      <LogForm />

      {/* Journal history */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-[13px] font-medium uppercase tracking-wider text-zinc-400">
          <BookOpen size={14} className="text-zinc-500" />
          Journal
          <span className="tnum text-zinc-600">({logs.length} entries)</span>
        </div>
        <div className="space-y-3">
          {logs.length === 0 && (
            <Card className="px-5 py-8 text-center text-sm text-zinc-500">
              No entries yet. Your first journal entry is the beginning of the record.
            </Card>
          )}
          {logs.map((log) => (
            <Card key={log.id} className="animate-fade-up px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-medium text-zinc-500">
                  {formatDay(log.createdAt)}
                </span>
                <span className="tnum text-sm font-semibold text-xp">
                  +{log.totalXp} XP
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                {log.rawText}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {log.entries.map((e, i) => {
                  const meta = CATEGORY_MAP[e.category];
                  return (
                    <Badge key={i} className={meta.tailwind}>
                      {e.skillName} +{e.xp}
                    </Badge>
                  );
                })}
              </div>
              {log.insight && (
                <p className="mt-3 flex gap-2 border-t border-ink-800 pt-3 text-[13px] leading-relaxed text-zinc-400">
                  <Sparkles size={13} className="mt-0.5 shrink-0 text-xp" />
                  {log.insight}
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
