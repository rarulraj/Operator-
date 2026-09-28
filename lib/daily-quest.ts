import type { Situation } from "./ai/situation";
import { defaultSkillForCategory } from "./skills";
import { todoRank } from "./todos";
import type { AppState, CategoryId, DailyQuest, Mission, TodoItem } from "./types";

const DAY = 86_400_000;

/** Old Season 1 homework. These are not Arun's real day. */
const GENERIC_TITLE =
  /discovery question|workflow map|diagnose business|buyer-pain|status-quo|buyer who owns|quantify the cost|ai buyer/i;
const GENERIC_TASK =
  /complete today's lesson|write one takeaway|build ai workflow|discovery question bank/i;

/** The one task that is on every single day, no matter what. */
export const JOURNAL_TASK =
  "Journal the day in the Activity Log: what actually moved, what stalled, and the one thing tomorrow";

export function isGenericQuest(quest: DailyQuest): boolean {
  if (GENERIC_TITLE.test(quest.title) || GENERIC_TITLE.test(quest.description)) {
    return true;
  }
  return quest.tasks.some((t) => GENERIC_TASK.test(t.title));
}

interface QuestBeat {
  title: string;
  category: CategoryId;
}

function recentCategoryXp(state: AppState, days: number): Record<string, number> {
  const cutoff = Date.now() - days * DAY;
  const totals: Record<string, number> = {};
  for (const e of state.xpEvents) {
    if (new Date(e.createdAt).getTime() < cutoff) continue;
    if (!e.category) continue;
    totals[e.category] = (totals[e.category] ?? 0) + e.amount;
  }
  return totals;
}

function daysSinceCategory(state: AppState, category: CategoryId): number {
  let last = 0;
  for (const e of state.xpEvents) {
    if (e.category !== category) continue;
    const t = new Date(e.createdAt).getTime();
    if (t > last) last = t;
  }
  if (!last) return 30;
  return (Date.now() - last) / DAY;
}

function pickTodo(
  todos: TodoItem[],
  prefer: CategoryId[],
  used: Set<string>,
): TodoItem | null {
  const ranked = [...todos].sort((a, b) => {
    const urg = todoRank(a) - todoRank(b);
    if (urg !== 0) return urg;
    const ai = prefer.indexOf(a.category as CategoryId);
    const bi = prefer.indexOf(b.category as CategoryId);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return ranked.find((t) => !used.has(t.id)) ?? null;
}

function missionAction(mission: Mission): string {
  switch (mission.id) {
    case "mission-linkedin-10k":
      return "Publish one LinkedIn post from a real TDengine or customer moment: not a take, a specific story";
    case "mission-tdengine-promotion":
      return "Add one piece of promotion evidence: a customer outcome, POC note, or enablement asset you can point at";
    case "mission-shredded-2027":
      return "Hit today's training or lock protein: shredded by July only happens if this week is clean";
    case "mission-bench-225":
      return "Get a bench session in, or log the working sets if you already lifted";
    case "mission-reefly-250":
    case "mission-reefly-business":
    case "mission-reefly-mrr":
      return "Talk to one Reefly user or ship one thing a user already asked for";
    case "mission-tfe-25-posts":
    case "mission-tfe-platform":
      return "Turn one thing from this week's work into a TFE note or a founder conversation";
    case "mission-20m":
    case "mission-first-million":
      return "One money move: transfer, invest, or write down this month's savings rate";
    case "mission-enterprise-poc":
      return "Move the live POC one step: charter, metric, or a written production path";
    default:
      return `Move "${mission.title}": one concrete action, not a plan`;
  }
}

function conferenceSpine(focus?: string): {
  title: string;
  why: string;
  category: CategoryId;
  prefer: CategoryId[];
} {
  return {
    title: "On the floor",
    why:
      focus?.trim() ||
      "You are at the conference. The day is demos, names, and one public extract. Inbox and founder homework wait until you are home.",
    category: "work",
    prefer: ["work", "brand", "ai_gtm", "social"],
  };
}

function travelSpine(): {
  title: string;
  why: string;
  category: CategoryId;
  prefer: CategoryId[];
} {
  return {
    title: "On the road",
    why: "You are not at your desk. Protect one real conversation and one written extract. Do not invent a full home-office day.",
    category: "work",
    prefer: ["work", "brand", "social"],
  };
}

function daySpine(
  dow: number,
  mode: Situation["mode"] = "normal",
  focus?: string,
): {
  title: string;
  why: string;
  category: CategoryId;
  prefer: CategoryId[];
} {
  if (mode === "conference") return conferenceSpine(focus);
  if (mode === "travel") return travelSpine();
  // 0 Sun … 6 Sat. Built around Arun's actual week, not a course.
  switch (dow) {
    case 1:
      return {
        title: "Promotion case, not tickets",
        why: "Monday is for evidence. One TDengine outcome you can put in the Senior SE packet: not a clean inbox.",
        category: "work",
        prefer: ["work", "ai_gtm", "brand"],
      };
    case 2:
      return {
        title: "Customer work to LinkedIn",
        why: "A demo, escalation, or architecture conversation is wasted if it dies in Slack. Extract one public post from it.",
        category: "brand",
        prefer: ["work", "brand", "ai_gtm"],
      };
    case 3:
      return {
        title: "Founder day",
        why: "Reefly and TFE only move if you talk to users or ship. Coding without a user in the loop does not count.",
        category: "reefly",
        prefer: ["reefly", "tfe", "brand"],
      };
    case 4:
      return {
        title: "Make the work visible",
        why: "Enablement, a written POC note, or a follow-up that a manager can see. Promotion cases are built in public inside the company.",
        category: "work",
        prefer: ["work", "ai_gtm", "brand"],
      };
    case 5:
      return {
        title: "Ship something people can see",
        why: "Friday closes loops. Publish the LinkedIn post, send the customer note, or cut a Reefly change users will notice.",
        category: "brand",
        prefer: ["brand", "work", "reefly"],
      };
    case 6:
      return {
        title: "Body first",
        why: "Shredded by July 2027 and a 225 bench are not side quests. Training today, or the week already slipped.",
        category: "physical",
        prefer: ["physical", "social", "brand"],
      };
    default:
      return {
        title: "Scoreboard Sunday",
        why: "Count what actually moved: LinkedIn toward 10k, promotion evidence, Reefly, money. Then set Monday's one work action.",
        category: "brand",
        prefer: ["brand", "wealth", "work", "physical"],
      };
  }
}

function staleMission(state: AppState, missions: Mission[], recent: Record<string, number>): Mission | null {
  const ranked = [...missions].sort((a, b) => {
    const aXp = a.category === "general" ? 99 : (recent[a.category] ?? 0);
    const bXp = b.category === "general" ? 99 : (recent[b.category] ?? 0);
    return aXp - bXp || a.progress - b.progress;
  });
  return ranked[0] ?? null;
}

/** Build a day that is about Arun's real board: not a discovery worksheet. */
export function buildPersonalQuest(
  state: AppState,
  now = new Date(),
  situation?: Situation,
): DailyQuest {
  const mode = situation?.mode ?? "normal";
  const spine = daySpine(now.getDay(), mode, situation?.focus);
  const recent = recentCategoryXp(state, 7);
  const openTodos = state.todos.filter((t) => !t.completed);
  const missions = state.missions.filter((m) => m.status === "active");
  const usedTodos = new Set<string>();

  // Two pools. The day gets one beat from each where possible, so a full
  // board can't crowd out the long-game missions (and an empty board still
  // produces a real day). Conference and travel days do not inherit the
  // desk board: inbox and founder homework wait.
  const board: QuestBeat[] = [];
  if (mode !== "conference" && mode !== "travel") {
    for (let i = 0; i < 2; i++) {
      const todo = pickTodo(openTodos, spine.prefer, usedTodos);
      if (!todo) break;
      usedTodos.add(todo.id);
      board.push({
        title: todo.title,
        category: todo.category === "general" ? spine.category : todo.category,
      });
    }
  }

  const drives: QuestBeat[] = [];
  if (mode === "conference") {
    drives.push({
      title:
        "Run the booth demo and have one real conversation: name, company, why they stopped",
      category: "work",
    });
    drives.push({
      title:
        "Write the LinkedIn post from the floor tonight: a specific moment, not a recap of the event",
      category: "brand",
    });
  } else if (mode === "travel") {
    drives.push({
      title:
        "One real conversation on the road and one written follow-up before the day ends",
      category: "work",
    });
  } else {
    const mission = staleMission(state, missions, recent);
    if (mission) {
      drives.push({
        title: missionAction(mission),
        category: mission.category === "general" ? spine.category : mission.category,
      });
    }
    if (daysSinceCategory(state, "brand") >= 2) {
      drives.push({
        title:
          "Post on LinkedIn from a real moment this week: customer, demo, or a decision you made. Goal is 10,000 followers, not likes on a take.",
        category: "brand",
      });
    }
    if (
      now.getDay() === 0 ||
      now.getDay() === 6 ||
      daysSinceCategory(state, "physical") >= 3
    ) {
      drives.push({
        title:
          "Train: bench work or a hard session. July 2027 shredded does not care that you were busy.",
        category: "physical",
      });
    }
  }

  // One from the board, one from the drives, then fill from whatever's left.
  const dynamic: QuestBeat[] = [];
  const take = (beat: QuestBeat | undefined) => {
    if (!beat || dynamic.length >= 2) return;
    if (dynamic.some((b) => b.title === beat.title)) return;
    dynamic.push(beat);
  };
  take(board[0]);
  take(drives[0]);
  take(board[1]);
  for (const drive of drives.slice(1)) take(drive);
  if (dynamic.length === 0) {
    take({ title: spine.why, category: spine.category });
  }

  // Two dynamic beats, then journaling: which is never optional. The day
  // isn't closed until it's written down.
  const unique: QuestBeat[] = [
    ...dynamic,
    { title: JOURNAL_TASK, category: spine.category },
  ];
  const primary = unique[0]?.category ?? spine.category;

  return {
    id: crypto.randomUUID(),
    date: "",
    title: spine.title,
    description: spine.why,
    category: primary,
    skillIds: [
      ...new Set(
        unique
          .map((b) => defaultSkillForCategory(b.category))
          .filter((id): id is string => Boolean(id)),
      ),
    ],
    rewardXp: 80 + unique.length * 20,
    tasks: unique.map((b) => ({
      id: crypto.randomUUID(),
      title: b.title,
      completed: false,
    })),
    status: "active",
    reflection: null,
    completedAt: null,
  };
}
