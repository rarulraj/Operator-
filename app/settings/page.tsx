import { CheckCircle2, Database, FileText } from "lucide-react";
import { ApiKeySettings } from "@/components/api-key-settings";
import { SettingsClient } from "@/components/settings-client";
import { Badge, Card, CardHeader } from "@/components/ui";
import { getOpenAiKeySource, maskedKey } from "@/lib/config";
import { allWeeks } from "@/lib/curriculum";
import { getStore } from "@/lib/store";
import { RANKS } from "@/lib/xp";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const state = await getStore().getState();
  const keySource = getOpenAiKeySource();
  const weeks = allWeeks(state.customWeeks);
  const currentSeason = Math.ceil(state.campaign.currentWeek / 12);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Single-player by design. Your data never leaves this machine.
        </p>
      </div>

      {/* Status */}
      <Card className="animate-fade-up">
        <CardHeader title="System" icon={<Database size={14} className="text-zinc-500" />} />
        <div className="space-y-2.5 px-5 pb-5 pt-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Storage</span>
            <Badge className="text-reef">
              <CheckCircle2 size={11} /> Local JSON store — active
            </Badge>
          </div>
          <div className="flex items-center justify-between border-t border-ink-800 pt-2.5">
            <span className="text-zinc-400">Player</span>
            <span className="text-zinc-200">{state.playerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Campaign</span>
            <span className="text-zinc-200">
              Season {currentSeason} · Week {state.campaign.currentWeek}, Day{" "}
              {state.campaign.currentDay}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Campaign chapters</span>
            <span className="text-zinc-200">
              {weeks.length} weeks ({state.customWeeks.length} self-generated)
            </span>
          </div>
        </div>
      </Card>

      <ApiKeySettings
        configured={keySource !== null}
        source={keySource}
        masked={maskedKey()}
      />

      {/* Rank ladder */}
      <Card className="animate-fade-up">
        <CardHeader title="Rank Ladder" icon={<CheckCircle2 size={14} className="text-zinc-500" />} />
        <div className="grid grid-cols-2 gap-1.5 px-5 pb-5 pt-2 sm:grid-cols-4">
          {RANKS.map((r) => (
            <div
              key={r.title}
              className="rounded-lg border border-ink-800 bg-ink-850/40 px-3 py-2"
            >
              <div className="text-[13px] font-medium text-zinc-200">{r.title}</div>
              <div className="tnum text-[11px] text-zinc-500">
                {r.minXp.toLocaleString()} XP
              </div>
            </div>
          ))}
        </div>
      </Card>

      <SettingsClient />

      <Card className="animate-fade-up">
        <CardHeader title="Context" icon={<FileText size={14} className="text-zinc-500" />} />
        <p className="px-5 pb-5 pt-1 text-[13px] leading-relaxed text-zinc-500">
          The coach reads <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[12px] text-zinc-300">ARUN_CONTEXT.md</code> —
          your operating thesis — on every call. Edit that file to change how it thinks.
          Changing facts (skills, missions, activity) come from the ledger; the thesis
          stays in the file.
        </p>
      </Card>
    </div>
  );
}
