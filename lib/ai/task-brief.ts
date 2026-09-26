import { CATEGORY_MAP } from "../skills";
import { sortOpenTodos, todoNotes } from "../todos";
import type { AppState, TodoItem, TrackableCategory } from "../types";
import { coachSystemPrompt, getOpenAI, openAiModel } from "./openai";

export interface TaskBrief {
  headline: string;
  bullets: string[];
}

function pillarLabel(category: TrackableCategory): string {
  if (category === "general") return "General";
  return CATEGORY_MAP[category]?.shortName ?? category;
}

function describeTask(todo: TodoItem): string {
  const bits = [`[${pillarLabel(todo.category)}] ${todo.title}`];
  if (todo.pinned) bits.push("PINNED");
  const notes = todoNotes(todo);
  if (notes) bits.push(`notes: ${notes.slice(0, 220)}`);
  return bits.join(": ");
}

function boardDump(state: AppState): string {
  const open = sortOpenTodos(state.todos.filter((t) => !t.completed));
  const done = state.todos
    .filter((t) => t.completed)
    .sort(
      (a, b) =>
        +new Date(b.completedAt ?? b.createdAt) -
        +new Date(a.completedAt ?? a.createdAt),
    )
    .slice(0, 6);
  const missions = state.missions
    .filter((m) => m.status === "active")
    .map((m) => `${m.title} (${m.progress}%)`)
    .join("; ");
  return [
    `Open (${open.length}):`,
    open.length ? open.map(describeTask).join("\n") : "(empty)",
    `Recently done: ${done.map((t) => t.title).join("; ") || "none"}`,
    `Active missions: ${missions || "none"}`,
  ].join("\n");
}

function ruleBasedBrief(state: AppState): TaskBrief {
  const open = sortOpenTodos(state.todos.filter((t) => !t.completed));
  if (open.length === 0) {
    return {
      headline: "Board is clear. Put the next real thing on it before the day fills with noise.",
      bullets: [],
    };
  }

  const byPillar = new Map<string, number>();
  for (const t of open) {
    const label = pillarLabel(t.category);
    byPillar.set(label, (byPillar.get(label) ?? 0) + 1);
  }
  const loaded = [...byPillar.entries()].sort((a, b) => b[1] - a[1]);
  const pinned = open.filter((t) => t.pinned);
  const noted = open.filter((t) => todoNotes(t));
  const waiting = noted.filter((t) =>
    /wait|block|stuck|pending|follow.?up|legal|champion/i.test(todoNotes(t)),
  );

  const bullets: string[] = [];
  if (pinned[0]) {
    bullets.push(`Pinned: "${pinned[0].title}"${todoNotes(pinned[0]) ? `: ${todoNotes(pinned[0]).slice(0, 120)}` : ""}.`);
  } else {
    bullets.push(`Oldest open: "${open[open.length - 1]?.title}". If it isn't moving, rewrite it or kill it.`);
  }
  if (waiting[0]) {
    bullets.push(`Looks blocked: "${waiting[0].title}". The note says you're waiting: chase it or drop it.`);
  } else if (noted[0] && noted[0] !== pinned[0]) {
    bullets.push(`Has context: "${noted[0].title}".`);
  }
  if (loaded[0] && loaded[0][1] >= 3) {
    bullets.push(
      `${loaded[0][0]} is carrying ${loaded[0][1]} of ${open.length} open tasks. Close one there before adding more.`,
    );
  }

  const mix = loaded.map(([name, n]) => `${name} ${n}`).join(", ");
  return {
    headline: `${open.length} open: ${mix}.`,
    bullets: bullets.slice(0, 3),
  };
}

async function openAiBrief(state: AppState): Promise<TaskBrief | null> {
  const openai = getOpenAI();
  if (!openai) return null;
  try {
    const res = await openai.chat.completions.create({
      model: openAiModel(),
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages: [
        { role: "system", content: await coachSystemPrompt(state.contextNotes) },
        {
          role: "user",
          content: `Read Arun's chore board and write an operator brief. Not a pep talk. Not a recap of every row.

${boardDump(state)}

Coach against what is true today (conference, travel, desk): do not pretend he is at his desk if the live situation says otherwise.

Rules:
- headline: one sentence. Load, concentration, or the real bottleneck. Name a task if that is the point.
- bullets: 0-3 follow-ups. Use the working notes. Call out blockers, pins, and pillars that are overloaded. Skip empty cheerleading.
- If the board is empty, say to put the next real action on it.

Return JSON: { "headline": string, "bullets": string[] }`,
        },
      ],
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
    const headline =
      typeof parsed.headline === "string" ? parsed.headline.trim() : "";
    const bullets = (parsed.bullets ?? []).filter(
      (b: unknown): b is string => typeof b === "string" && b.trim().length > 8,
    );
    if (!headline) return null;
    return { headline, bullets: bullets.slice(0, 3) };
  } catch (err) {
    console.error("OpenAI task brief failed, using fallback:", err);
    return null;
  }
}

export async function summarizeBoard(
  state: AppState,
  opts?: { allowAi?: boolean },
): Promise<TaskBrief> {
  if (opts?.allowAi !== false) {
    const ai = await openAiBrief(state);
    if (ai) return ai;
  }
  return ruleBasedBrief(state);
}
