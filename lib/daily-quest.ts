import type { Situation } from "./ai/situation";
import { defaultSkillForCategory } from "./skills";
import type { AppState, DailyQuest } from "./types";

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

const JOURNAL_XP = 100;

/** The day is the journal. Tasks and missions stay on their own boards. */
export function buildPersonalQuest(
  _state: AppState,
  _now = new Date(),
  _situation?: Situation,
): DailyQuest {
  const skill = defaultSkillForCategory("work");
  return {
    id: crypto.randomUUID(),
    date: "",
    title: "Journal",
    description:
      "Write what moved, what stalled, and the one thing tomorrow. It comes back every day.",
    category: "work",
    skillIds: skill ? [skill] : [],
    rewardXp: JOURNAL_XP,
    tasks: [
      {
        id: crypto.randomUUID(),
        title: JOURNAL_TASK,
        completed: false,
      },
    ],
    status: "active",
    reflection: null,
    completedAt: null,
  };
}

/** Drop generated side-quests. Keep the journal, including whether it is already written. */
export function collapseToJournal(quest: DailyQuest): void {
  const journal = quest.tasks.find((task) => task.title === JOURNAL_TASK);
  const skill = defaultSkillForCategory("work");
  quest.title = "Journal";
  quest.description =
    "Write what moved, what stalled, and the one thing tomorrow. It comes back every day.";
  quest.category = "work";
  quest.skillIds = skill ? [skill] : [];
  quest.rewardXp = JOURNAL_XP;
  quest.tasks = [
    {
      id: journal?.id ?? crypto.randomUUID(),
      title: JOURNAL_TASK,
      completed: Boolean(journal?.completed),
    },
  ];
}

export function isJournalOnly(quest: DailyQuest): boolean {
  return (
    quest.tasks.length === 1 &&
    quest.tasks[0]?.title === JOURNAL_TASK &&
    quest.rewardXp === JOURNAL_XP
  );
}
