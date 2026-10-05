import { CATEGORY_MAP } from "../skills";
import { totalXp } from "../game";
import { dateKey } from "../store/types";
import { todoNotes } from "../todos";
import type { AppState } from "../types";
import { formatDay, formatDelta, formatWeight, snapshot } from "../weight";
import { levelFromXp, rankFromXp } from "../xp";
import { coachSystemPrompt, getOpenAI, openAiModel } from "./openai";
import { loadSituation } from "./situation";

// ── Live chat with the coach ────────────────────────────────────────────────
// OpenAI when configured; otherwise a deterministic fallback that still
// answers from real state. Everything Arun says can be saved as a context
// note, which then feeds every other AI surface (classify, coach, weekly…).

function noteLine(note: AppState["notes"][number]): string {
  const title =
    (note.title || "").trim() ||
    (note.text || "").split("\n").find((l) => l.trim()) ||
    "Untitled";
  const extra = (note.body || note.text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(title, "")
    .trim()
    .slice(0, 120);
  return extra ? `${title}: ${extra}` : title;
}

function stateSummary(state: AppState): string {
  const xp = totalXp(state);
  const lvl = levelFromXp(xp);
  const rank = rankFromXp(xp, state.rankTiers ?? []);

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
    .map((m) => `${m.title}: ${m.status}, ${m.progress}%`)
    .join("\n");

  const openTodos = state.todos.filter((t) => !t.completed);
  const openTasks = openTodos
    .map((t) => {
      const bits = [t.title];
      if (t.pinned) bits.push("PINNED");
      const notes = todoNotes(t);
      if (notes) bits.push(`notes: ${notes.slice(0, 160)}`);
      return bits.join(": ");
    })
    .slice(0, 12)
    .join("\n");

  const recentLogs = state.activityLogs
    .slice(-4)
    .map((l) => l.rawText)
    .join("\n");

  const todayQuest =
    [...state.quests].reverse().find((q) => q.status === "active") ??
    state.quests[state.quests.length - 1];
  const questTasks = todayQuest
    ? todayQuest.tasks
        .map((t) => `${t.completed ? "[x]" : "[ ]"} ${t.title}`)
        .join("\n")
    : "";

  const notes = (state.notes ?? [])
    .filter((n) => !n.deletedAt)
    .slice(-8)
    .map(noteLine)
    .join("\n");

  const remembered = (state.contextNotes ?? [])
    .slice(-6)
    .map((n) => (n.fileName ? `[${n.fileName}] ${n.text.slice(0, 160)}` : n.text.slice(0, 160)))
    .join("\n");

  const weigh = snapshot(
    state.weightEntries ?? [],
    state.weightUnit ?? "lb",
    state.weightGoal ?? null,
    dateKey(new Date()),
  );
  const weightLine = weigh.latest
    ? `Body weight: ${formatWeight(weigh.latest.weight, weigh.unit)} on ${weigh.latest.date}${weigh.delta != null ? ` (${formatDelta(weigh.delta, weigh.unit)} vs prior)` : ""}. ${weigh.loggedToday ? "Logged today." : "Not logged today."}${weigh.goal != null ? ` Goal ${formatWeight(weigh.goal, weigh.unit)}.` : ""}`
    : "Body weight: nothing logged yet. Page: Weight.";

  return [
    `Level ${lvl.level} (${rank.title}), ${xp} total XP, ${state.streak.current}-day streak, ${state.inventory.gold} gold.`,
    `Pillar XP: ${pillars}`,
    `Today's quest: ${todayQuest ? `${todayQuest.title} (${todayQuest.status})` : "none yet"}`,
    questTasks ? `Quest tasks:\n${questTasks}` : "",
    `Open missions:\n${missions || "none"}`,
    `Open tasks:\n${openTasks || "none"}`,
    `Notes:\n${notes || "none"}`,
    `Remembered context:\n${remembered || "none"}`,
    weightLine,
    `Recent activity:\n${recentLogs || "nothing logged yet"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function heuristicReply(state: AppState, message: string): string {
  const lower = message.toLowerCase();
  const xp = totalXp(state);
  const lvl = levelFromXp(xp);
  const weakest = [...state.skills].sort((a, b) => a.xp - b.xp)[0];
  const openTasks = state.todos.filter((t) => !t.completed);
  const activeMissions = state.missions.filter((m) => m.status === "active");

  if (/\b(weight|weigh-?in)\b/.test(lower)) {
    if (/\b(how|where|page)\b/.test(lower)) return appHelp("weight", state);
    const weigh = snapshot(
      state.weightEntries ?? [],
      state.weightUnit ?? "lb",
      state.weightGoal ?? null,
      dateKey(new Date()),
    );
    if (!weigh.latest) {
      return "No weigh-ins yet. Open Weight in the sidebar, or type today's number on the dashboard card. One entry per day.";
    }
    const delta = weigh.delta != null ? ` ${formatDelta(weigh.delta, weigh.unit)} versus the prior entry.` : "";
    const goal =
      weigh.goal != null ? ` Goal is ${formatWeight(weigh.goal, weigh.unit)}.` : "";
    return `Latest weigh-in: ${formatWeight(weigh.latest.weight, weigh.unit)} on ${formatDay(weigh.latest.date)}.${delta}${goal} ${weigh.loggedToday ? "Today is already logged." : "Today is not logged yet."}`;
  }
  if (/\b(streak)\b/.test(lower)) {
    return `You're on a ${state.streak.current}-day streak (longest: ${state.streak.longest}). The streak only counts if something real ships today: a task, a log, or the quest.`;
  }
  if (/\b(mission|goal|boss)\b/.test(lower)) {
    const list = activeMissions
      .map((m) => `${m.title} at ${m.progress}%`)
      .join("; ");
    return `Active missions: ${list || "none"}. Pick the one with the nearest deadline and move it 1% today: that's what the task board is for.`;
  }
  if (/\b(skill|weak|improve|level)\b/.test(lower)) {
    return `Level ${lvl.level}. Weakest skill right now: ${weakest?.name ?? "none"} at ${weakest?.xp ?? 0} XP. One logged rep there beats three in a skill you're already comfortable in.`;
  }
  if (/\b(gold|shop|buy)\b/.test(lower)) {
    return `You have ${state.inventory.gold} gold. Tasks pay 5, quests 50, missions 250. The shop sells style, not shortcuts.`;
  }
  if (/\b(linkedin|followers|personal brand|10k|10,000)\b/.test(lower)) {
    return `The goal is 10,000 LinkedIn followers. Posts that compound come from real TDengine, customer, or founder work: a specific moment, not a generic AI take. Log the post in the journal so Brand XP actually moves.`;
  }
  if (/\b(wealth|money|net worth|20 ?m|million|invest)\b/.test(lower)) {
    return `The $20M mission is the long game. What moves it this year: income growth at TDengine, equity in what you build, and a savings rate you can sustain. Log financial moves in the journal and the Wealth pillar grows.`;
  }
  if (/\b(quest|today)\b/.test(lower)) {
    const today = state.quests[state.quests.length - 1];
    return today
      ? `Today's quest: "${today.title}" (${today.status}). ${today.status === "completed" ? "Done. Log anything else you shipped and bank the day." : "Finish the three tasks, write the reflection, bank it."}`
      : "No quest yet today: open the Daily Quest page and it'll generate one.";
  }
  if (/\b(how|help|what is|where|notes?|task|journal|shop|idle)\b/.test(lower)) {
    return appHelp(lower, state);
  }
  return `Noted. Right now: ${openTasks.length} open task${openTasks.length === 1 ? "" : "s"}, weakest skill is ${weakest?.name ?? "none"}, and the day isn't banked until something ships. Tell me more about your life and I'll save it as context: that's how my advice gets sharper. (For full conversational answers, add an OpenAI key in Settings.)`;
}

function appHelp(lower: string, state: AppState): string {
  if (/note/.test(lower)) {
    return "Notes is the scratchpad (left sidebar). Jot anything; it saves locally. The checklist icon on a note turns it into a board task. Task-level notes live on the Tasks board: click the sticky-note icon on a row.";
  }
  if (/task|board|pin/.test(lower)) {
    return "Tasks is the chore board. Add a row, click the title to rename, pin to float it, sticky-note for working context. Completing a task pays a little XP. The Board brief above the list is the agent reading your open work.";
  }
  if (/quest/.test(lower)) {
    return "Daily Quest is built from your board, missions, and the weekday. Tick the tasks, write the journal beat, then Complete Quest. That is what banks the streak.";
  }
  if (/journal|log|activit/.test(lower)) {
    return "Activity Log is the journal. Write what actually happened; the coach classifies it into skills and XP. The same journal beat sits on today's quest.";
  }
  if (/weight|weigh-?in/.test(lower)) {
    return "Weight is the daily scale log in the sidebar. One entry per date: pick the day, type the number, save. lb and kg switch at the top of that page, and old entries convert for display. Set a goal and the chart draws the line. The dashboard card logs today without opening the page.";
  }
  if (/mission|boss/.test(lower)) {
    return "Missions are the long goals. Assign tasks to a mission from the board. Completing those tasks nudges progress; only you can mark a mission done.";
  }
  if (/shop|gold/.test(lower)) {
    return `Shop is cosmetics only. You have ${state.inventory.gold} gold. Tasks, quests, and missions pay gold. Equip from the shop; it changes the character, not the XP.`;
  }
  return "I can see your board, quest, missions, notes, journal, and remembered context. Ask what to do today, how a page works, or dump a situation. Full chat lives under AI Chat if you want a longer thread. Add an OpenAI key in Settings for sharper answers.";
}

const HELPER_ADDON = `
You are the always-on Helper inside Operator, a small panel Arun can open from any page (⌘J).
You have his full live state: tasks and their notes, daily quest, missions, journal, scratchpad notes, shop gold, skills, and remembered facts.
You also know the product:
- Dashboard: quest + board + coach
- Daily Quest: today's three beats + journal
- Tasks: chore board (rename, pin, per-task notes, board brief)
- Notes: scratchpad; checklist icon makes a task
- Activity Log: journal that awards XP
- Weight: one scale reading per day, with a trend chart and optional goal. The dashboard card logs today.
- Missions: long goals; tasks can attach
- Shop / Idle: cosmetics and the screensaver
- AI Chat: the long thread; this Helper is the short one
- Settings: OpenAI key, local store
Answer the question he asked. If it is "what should I do", name one concrete move from the live board. If it is "how do I…", explain the control. Keep replies short. No markdown headings or **bold labels**. No dashes used as punctuation.`;

export async function helperReply(
  state: AppState,
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const openai = getOpenAI();
  const situation = await loadSituation(state);
  if (openai) {
    try {
      const res = await openai.chat.completions.create({
        model: openAiModel(),
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: (await coachSystemPrompt(state.contextNotes)) + HELPER_ADDON,
          },
          {
            role: "user",
            content: `CURRENT STATE (for your reference, do not recite):\n${stateSummary(state)}\n\nLIVE SITUATION:\n${situation.text || "none"}`,
          },
          ...history.slice(-12),
          { role: "user", content: message },
        ],
      });
      const reply = res.choices[0]?.message?.content?.trim();
      if (reply) return reply;
    } catch (err) {
      console.error("OpenAI helper failed, using fallback:", err);
    }
  }
  return heuristicReply(state, message);
}

export async function chatReply(state: AppState, message: string): Promise<string> {
  const openai = getOpenAI();
  const situation = await loadSituation(state);
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
              "\n\nYou are in a live chat with Arun. Answer directly, concisely, in your advisor voice. When he shares durable facts about his life (people, constraints, plans, numbers), acknowledge them: they are being remembered and will shape future coaching. Never mention this mechanism unless he asks.\nWrite like a person in chat. No markdown section labels (never **Physical and Wealth Goals**). No heading asterisks. Short paragraphs. If you need a list, use a few short dashes, not decorated titles.",
          },
          {
            role: "user",
            content: `CURRENT STATE (for your reference, do not recite):\n${stateSummary(state)}\n\nLIVE SITUATION:\n${situation.text || "none"}`,
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
