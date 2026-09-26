"use client";

import { MapPin } from "lucide-react";
import { useState, useTransition } from "react";
import { saveSituationAction } from "@/app/actions";
import { Button, Card, CardHeader } from "./ui";

export function SituationSettings({
  initial,
  updatedAt,
  agentPreview,
}: {
  initial: string;
  updatedAt: string | null;
  agentPreview: string;
}) {
  const [text, setText] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    startTransition(async () => {
      await saveSituationAction(text);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    });
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="What's going on today"
        icon={<MapPin size={14} className="text-xp" />}
      />
      <div className="space-y-3 px-5 pb-5 pt-1">
        <p className="text-sm leading-relaxed text-zinc-400">
          Conference, travel, on-site, sick day. The daily quest, coach, and
          insights read this plus Hermes&apos; log. If the agent knows and the
          board doesn&apos;t, put it here.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="I'm at ICC. Booth day: demos, names, one LinkedIn extract."
          className="w-full resize-none rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-ink-600"
        />
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={pending}>
            {saved ? "Saved" : pending ? "Saving…" : "Save situation"}
          </Button>
          {updatedAt && (
            <span className="text-[11px] text-zinc-600">
              Updated {updatedAt.slice(0, 10)}
            </span>
          )}
        </div>
        {agentPreview && (
          <div className="rounded-lg border border-ink-800 bg-ink-850/50 px-3 py-2">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              What the coach can see from Hermes
            </div>
            <p className="max-h-28 overflow-y-auto whitespace-pre-wrap text-[12px] leading-relaxed text-zinc-400">
              {agentPreview.slice(0, 700)}
              {agentPreview.length > 700 ? "…" : ""}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}