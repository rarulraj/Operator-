import { CATEGORY_MAP } from "../skills";
import { totalXp } from "../game";
import type { AppState } from "../types";
import { levelFromXp, rankFromXp } from "../xp";
import { coachSystemPrompt, getOpenAI, openAiModel } from "./openai";

// ── Live chat with the coach ────────────────────────────────────────────────
// OpenAI when configured; otherwise a deterministic fallback that still
// answers from real state. Everything Arun says can be saved as a context
// note, which then feeds every other AI surface (classify, coach, weekly…).

function stateSummary(state: AppState): string {
  const xp = totalXp(state);
  const lvl = levelFromXp(xp);
  const rank = rankFromXp(xp);

  const pillars = Object.values(CATEGORY_MAP)
    .map((c) => {
      const total = state.skills
        .filter((s) => s.category === c.id)
        .reduce((sum, s) => sum + s.xp, 0);
      return `${c.shortName}: ${total} XP`;
    })
    .join(" | ");

  const missions = state.missions
    .filter((m) => m.status !== "completed")
    .map((m) => `${m.title} — ${m.status}, ${m.progress}%`)
    .join("\n");

  const openTasks = state.todos
    .filter((t) => !t.completed)
    .map((t) => t.title)
    .slice(0, 12)
    .join("; ");

  const recentLogs = state.activityLogs
    .slice(-4)
    .map((l) => l.rawText)
    .join("\n");

  const today = state.quests[state.quests.length - 1];

  return [
    `Level ${lvl.level} (${rank.title}), ${xp} total XP, ${state.streak.current}-day streak, ${state.inventory.gold} gold.`,
    `Pillar XP → ${pillars}`,
    `Today's quest: ${today ? `${today.title} (${today.status})` : "none yet"}`,
    `Open missions:\n${missions || "none"}`,
    `Open tasks: ${openTasks || "none"}`,
    `Recent activity:\n${recentLogs || "nothing logged yet"}`,
  ].join("\n");
}

function heuristicReply(state: AppState, message: string): string {
  const lower = message.toLowerCase();
  const xp = totalXp(state);
  const lvl = levelFromXp(xp);
  const weakest = [...state.skills].sort((a, b) => a.xp - b.xp)[0];
  const openTasks = state.todos.filter((t) => !t.completed);
  const activeMissions = state.missions.filter((m) => m.status === "active");

  if (/\b(streak)\b/.test(lower)) {
    return `You're on a ${state.streak.current}-day streak (longest: ${state.streak.longest}). The streak only counts if something real ships today — a task, a log, or the quest.`;
  }
  if (/\b(mission|goal|boss)\b/.test(lower)) {
    const list = activeMissions
      .map((m) => `${m.title} at ${m.progress}%`)
      .join("; ");
    return `Active missions: ${list || "none"}. Pick the one with the nearest deadline and move it 1% today — that's what the task board is for.`;
  }
  if (/\b(skill|weak|improve|level)\b/.test(lower)) {
    return `Level ${lvl.level}. Weakest skill right now: ${weakest?.name ?? "—"} at ${weakest?.xp ?? 0} XP. One logged rep there beats three in a skill you're already comfortable in.`;
  }
  if (/\b(gold|shop|buy)\b/.test(lower)) {
    return `You have ${state.inventory.gold} gold. Tasks pay 5, quests 50, missions 250. The shop sells style, not shortcuts.`;
  }
  if (/\b(linkedin|followers|personal brand|10k|10,000)\b/.test(lower)) {
    return `The goal is 10,000 LinkedIn followers. Posts that compound come from real TDengine, customer, or founder work — a specific moment, not a generic AI take. Log the post in the journal so Brand XP actually moves.`;
  }
  if (/\b(wealth|money|net worth|20 ?m|million|invest)\b/.test(lower)) {
    return `The $20M mission is the long game. What moves it this year: income growth at TDengine, equity in what you build, and a savings rate you can sustain. Log financial moves in the journal and the Wealth pillar grows.`;
  }
  if (/\b(quest|today)\b/.test(lower)) {
    const today = state.quests[state.quests.length - 1];
    return today
      ? `Today's quest: "${today.title}" — ${today.status}. ${today.status === "completed" ? "Done. Log anything else you shipped and bank the day." : "Finish the three tasks, write the reflection, bank it."}`
      : "No quest yet today — open the Daily Quest page and it'll generate one.";
  }
  return `Noted. Right now: ${openTasks.length} open task${openTasks.length === 1 ? "" : "s"}, weakest skill is ${weakest?.name ?? "—"}, and the day isn't banked until something ships. Tell me more about your life and I'll save it as context — that's how my advice gets sharper. (For full conversational answers, add an OpenAI key in Settings.)`;
}

export async function chatReply(state: AppState, message: string): Promise<string> {
  const openai = getOpenAI();
  if (openai) {
    try {
      const history = state.chat.slice(-16).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      const res = await openai.chat.completions.create({
        model: openAiModel(),
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content:
              (await coachSystemPrompt(state.contextNotes)) +
              "\n\nYou are in a live chat with Arun. Answer directly, concisely, in your advisor voice. When he shares durable facts about his life (people, constraints, plans, numbers), acknowledge them — they are being remembered and will shape future coaching. Never mention this mechanism unless he asks.",
          },
          {
            role: "user",
            content: `CURRENT STATE (for your reference, do not recite):\n${stateSummary(state)}`,
          },
          ...history,
          { role: "user", content: message },
        ],
      });
      const reply = res.choices[0]?.message?.content?.trim();
      if (reply) return reply;
    } catch (err) {
      console.error("OpenAI chat failed, using fallback:", err);
    }
  }
  return heuristicReply(state, message);
}
