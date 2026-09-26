"use client";

import { CalendarClock, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { generateWeeklyReviewAction } from "@/app/actions";
import type { WeeklyReview } from "@/lib/types";
import { Button, Card, CardHeader } from "./ui";

function renderContent(content: string) {
  // Minimal markdown: **bold** and newlines
  return content.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={j} className="font-semibold text-zinc-100">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={j}>{part}</span>
      ),
    );
    return (
      <p key={i} className={line.trim() ? "" : "h-2"}>
        {parts}
      </p>
    );
  });
}

export function WeeklyReviewPanel({ reviews }: { reviews: WeeklyReview[] }) {
  const [pending, startTransition] = useTransition();
  const [list, setList] = useState(reviews);
  const latest = list[list.length - 1];

  function generate() {
    startTransition(async () => {
      const review = await generateWeeklyReviewAction();
      setList((prev) => [
        ...prev,
        { ...review, weekOf: "", createdAt: new Date().toISOString() },
      ]);
    });
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Weekly Review"
        icon={<CalendarClock size={14} className="text-zinc-500" />}
        action={
          <Button variant="ghost" onClick={generate} disabled={pending}>
            <Sparkles size={13} className="text-xp" />
            {pending ? "Writing…" : "Generate this week's review"}
          </Button>
        }
      />
      <div className="px-5 pb-5 pt-2">
        {!latest && !pending && (
          <p className="py-3 text-sm text-zinc-500">
            No reviews yet. Generate one any time: Sundays are the ritual.
          </p>
        )}
        {pending && (
          <p className="animate-pulse-subtle py-3 text-sm text-zinc-500">
            Reviewing your week…
          </p>
        )}
        {latest && !pending && (
          <div className="space-y-1.5 text-sm leading-relaxed text-zinc-300">
            {renderContent(latest.content)}
          </div>
        )}
        {list.length > 1 && (
          <p className="mt-4 border-t border-ink-800 pt-3 text-[11px] text-zinc-600">
            {list.length - 1} earlier {list.length - 1 === 1 ? "review" : "reviews"} on
            file.
          </p>
        )}
      </div>
    </Card>
  );
}
