"use client";

import { ArrowRight, Check, PenLine, Sparkles, X } from "lucide-react";
import { useState, useTransition } from "react";
import { classifyActivityAction, confirmActivityLogAction } from "@/app/actions";
import type { ClassificationResult } from "@/lib/ai/classify";
import { CATEGORY_MAP } from "@/lib/skills";
import type { ClassifiedActivity } from "@/lib/types";
import { Badge, Button, Card, CardHeader } from "./ui";

type Stage =
  | { name: "write" }
  | { name: "confirm"; draft: ClassificationResult }
  | { name: "saved"; totalXp: number; insight: string };

export function LogForm() {
  const [text, setText] = useState("");
  const [stage, setStage] = useState<Stage>({ name: "write" });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function analyze() {
    if (text.trim().length < 10) {
      setError("Write a bit more: what did you actually do today?");
      return;
    }
    setError(null);
    startTransition(async () => {
      const draft = await classifyActivityAction(text);
      setStage({ name: "confirm", draft });
    });
  }

  function updateEntry(idx: number, patch: Partial<ClassifiedActivity>) {
    if (stage.name !== "confirm") return;
    const entries = stage.draft.entries.map((e, i) =>
      i === idx ? { ...e, ...patch } : e,
    );
    setStage({ name: "confirm", draft: { ...stage.draft, entries } });
  }

  function removeEntry(idx: number) {
    if (stage.name !== "confirm") return;
    const entries = stage.draft.entries.filter((_, i) => i !== idx);
    setStage({ name: "confirm", draft: { ...stage.draft, entries } });
  }

  function confirm() {
    if (stage.name !== "confirm") return;
    const { draft } = stage;
    startTransition(async () => {
      const res = await confirmActivityLogAction({
        rawText: text,
        entries: draft.entries,
        insight: draft.insight,
        nextFocus: draft.nextFocus,
      });
      if (res.ok) {
        setStage({ name: "saved", totalXp: res.totalXp, insight: draft.insight });
        setText("");
      } else {
        setError("Nothing to save: add at least one XP entry.");
      }
    });
  }

  const total =
    stage.name === "confirm"
      ? stage.draft.entries.reduce((s, e) => s + e.xp, 0)
      : 0;

  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Today's Entry"
        icon={<PenLine size={14} className="text-zinc-500" />}
      />
      <div className="px-5 pb-5 pt-2">
        {stage.name === "write" && (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder={
                "Write naturally about what you actually did today…\n\ne.g. Had a customer call today. Architected an AI use case around predictive maintenance. Customer was concerned about data permissions. I also shipped improvements to Reefly onboarding."
              }
              className="w-full resize-y rounded-lg border border-ink-700 bg-ink-850/70 px-4 py-3 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-ink-600 focus:outline-none"
            />
            {error && <p className="mt-2 text-[12px] text-red-400">{error}</p>}
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] text-zinc-600">
                The coach reads this, attributes XP to skills, and tells you what to
                focus on next. Outcomes earn: hours don&apos;t.
              </p>
              <Button onClick={analyze} disabled={pending}>
                {pending ? "Analyzing…" : "Analyze"}
                <ArrowRight size={14} />
              </Button>
            </div>
          </>
        )}

        {stage.name === "confirm" && (
          <div className="animate-pop-in">
            <p className="text-[13px] text-zinc-400">
              Proposed XP: adjust anything before it goes on the ledger:
            </p>
            <div className="mt-3 space-y-2">
              {stage.draft.entries.map((entry, i) => {
                const meta = CATEGORY_MAP[entry.category];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-ink-700/60 bg-ink-850/60 px-4 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${meta.tailwind}`}>
                          {entry.skillName}
                        </span>
                        <Badge>{meta.shortName}</Badge>
                      </div>
                      {entry.note && (
                        <div className="mt-0.5 truncate text-[12px] text-zinc-500">
                          {entry.note}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        step={5}
                        value={entry.xp}
                        onChange={(e) =>
                          updateEntry(i, { xp: Number(e.target.value) })
                        }
                        className="tnum w-20 rounded-md border border-ink-600 bg-ink-900 px-2 py-1 text-right text-sm text-xp focus:outline-none"
                      />
                      <span className="text-[11px] text-zinc-500">XP</span>
                    </div>
                    <button
                      onClick={() => removeEntry(i)}
                      className="rounded p-1 text-zinc-600 hover:text-zinc-300"
                      aria-label="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg border border-ink-700/60 bg-ink-900/70 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-xp">
                <Sparkles size={12} /> Coach insight
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                {stage.draft.insight}
              </p>
              {stage.draft.nextFocus && (
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
                  <span className="font-medium text-zinc-200">Next focus: </span>
                  {stage.draft.nextFocus}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="tnum text-sm font-semibold text-xp">
                Total: +{total} XP
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setStage({ name: "write" })}
                  disabled={pending}
                >
                  Back
                </Button>
                <Button onClick={confirm} disabled={pending || !stage.draft.entries.length}>
                  <Check size={14} />
                  {pending ? "Saving…" : "Confirm & Save"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {stage.name === "saved" && (
          <div className="animate-pop-in py-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-reef">
              <Check size={16} /> Entry saved: +{stage.totalXp} XP on the ledger
            </div>
            {stage.insight && (
              <p className="mt-3 flex gap-2.5 rounded-lg border border-ink-700/60 bg-ink-900/70 px-4 py-3 text-sm leading-relaxed text-zinc-300">
                <Sparkles size={15} className="mt-0.5 shrink-0 text-xp" />
                {stage.insight}
              </p>
            )}
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setStage({ name: "write" })}
            >
              <PenLine size={14} /> Write another entry
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
