import { SKILL_DEFS } from "./skills";
import { dateKey, daysAgo } from "./store/types";
import type {
  ActivityLog,
  AppState,
  DailyQuest,
  Mission,
  Skill,
  XpEvent,
} from "./types";

// ── Seed data ───────────────────────────────────────────────────────────────

function seedSkills(): Skill[] {
  return SKILL_DEFS.map((s) => ({ ...s, xp: 0 }));
}

/** The day-job mission. Exported so the store can backfill it into saves
 *  that predate it. */
export function promotionMission(now: Date): Mission {
  return {
    id: "mission-tdengine-promotion",
    title: "Earn the TDengine Promotion",
    description:
      "Solutions Engineer → Senior SE. Build an undeniable promotion case: POC wins, measurable customer impact, and scope beyond your patch.",
    category: "work",
    progress: 0,
    target: "Promotion case approved by management",
    deadline: null,
    xpReward: 2500,
    status: "active",
    createdAt: now.toISOString(),
  };
}

/** Physique goals. Exported so the store can backfill them into saves that
 *  predate them. */
export function physiqueMissions(now: Date): Mission[] {
  const created = now.toISOString();
  const deadline = "2027-07-01"; // shredded by July 2027: bench along the way
  return [
    {
      id: "mission-shredded-2027",
      title: "Get Shredded by July 2027",
      description:
        "Lean down to a visibly shredded physique: abs, definition, the whole thing. Training and nutrition consistency every week.",
      category: "physical",
      progress: 0,
      target: "Visibly shredded physique",
      deadline,
      xpReward: 2000,
      status: "active",
      createdAt: created,
    },
    {
      id: "mission-bench-225",
      title: "Bench 225",
      description: "Build to a full 225 lb bench press: two plates a side.",
      category: "physical",
      progress: 0,
      target: "1 rep at 225 lb",
      deadline,
      xpReward: 800,
      status: "active",
      createdAt: created,
    },
  ];
}

/** Personal brand. Exported so the store can backfill into existing saves. */
export function brandMissions(now: Date): Mission[] {
  return [
    {
      id: "mission-linkedin-10k",
      title: "Reach 10,000 LinkedIn Followers",
      description:
        "Personal brand, not TFE volume. Get to 10k by posting from real TDengine, AI, and founder work: specific stories, not generic takes.",
      category: "brand",
      progress: 0,
      target: "10,000 LinkedIn followers",
      deadline: null,
      xpReward: 2500,
      status: "active",
      createdAt: now.toISOString(),
    },
  ];
}

/** The long game. Exported so the store can backfill into existing saves. */
export function wealthMissions(now: Date): Mission[] {
  const created = now.toISOString();
  return [
    {
      id: "mission-20m",
      title: "Build $20M Net Worth",
      description:
        "The long game. Compound income, ownership, and investments into $20M. Every other pillar feeds this one: the ventures create the equity, the day job funds the runway.",
      category: "wealth",
      progress: 0,
      target: "$20,000,000 net worth",
      deadline: null,
      xpReward: 10000,
      status: "active",
      createdAt: created,
    },
    {
      id: "mission-first-million",
      title: "First $1M Net Worth",
      description:
        "The hardest milestone on the road to $20M. Savings rate, invested capital, and the first real equity position.",
      category: "wealth",
      progress: 0,
      target: "$1,000,000 net worth",
      deadline: null,
      xpReward: 3000,
      status: "active",
      createdAt: created,
    },
    {
      id: "mission-income-streams",
      title: "Build Three Income Streams",
      description:
        "Salary plus two more: Reefly revenue, consulting, writing, or equity. Concentration is the risk; optionality is the hedge.",
      category: "wealth",
      progress: 0,
      target: "3 meaningful income streams",
      deadline: null,
      xpReward: 1500,
      status: "active",
      createdAt: created,
    },
  ];
}

function seedMissions(now: Date): Mission[] {
  const created = now.toISOString();
  const in90 = daysAgo(-90, now).toISOString().slice(0, 10);
  const in60 = daysAgo(-60, now).toISOString().slice(0, 10);
  return [
    ...wealthMissions(now),
    ...brandMissions(now),
    promotionMission(now),
    ...physiqueMissions(now),
    {
      id: "mission-ai-career",
      title: "Master the Enterprise AI Motion",
      description:
        "Become exceptional at taking enterprise AI from Discovery → Architecture → POC → Security → Production → ROI.",
      category: "ai_gtm",
      progress: 0,
      target: "Complete the 12-week AI GTM campaign and run 3 real enterprise POCs",
      deadline: null,
      xpReward: 2000,
      status: "active",
      createdAt: created,
    },
    {
      id: "mission-tfe-platform",
      title: "Build The Founders Experience",
      description:
        "Build TFE into a meaningful founder network and personal distribution platform.",
      category: "tfe",
      progress: 0,
      target: "Consistent publishing engine + an engaged founder community",
      deadline: null,
      xpReward: 2000,
      status: "active",
      createdAt: created,
    },
    {
      id: "mission-reefly-business",
      title: "Make Reefly a Real Business",
      description:
        "Build Reefly into a real recurring-revenue software business with strong user engagement.",
      category: "reefly",
      progress: 0,
      target: "Recurring revenue with retained, active users",
      deadline: null,
      xpReward: 2000,
      status: "active",
      createdAt: created,
    },
    {
      id: "mission-enterprise-poc",
      title: "Complete an Enterprise AI POC",
      description:
        "Take one enterprise AI proof of concept from charter to a production proposal.",
      category: "ai_gtm",
      progress: 0,
      target: "1 POC delivered with a written production proposal",
      deadline: in90,
      xpReward: 1000,
      status: "active",
      createdAt: created,
    },
    {
      id: "mission-reefly-250",
      title: "Get Reefly to 250 Active Users",
      description: "Grow Reefly to 250 weekly-active users with healthy retention.",
      category: "reefly",
      progress: 0,
      target: "250 active users",
      deadline: in90,
      xpReward: 1200,
      status: "active",
      createdAt: created,
    },
    {
      id: "mission-tfe-25-posts",
      title: "Publish 25 TFE Posts",
      description:
        "Publish 25 meaningful posts that turn real AI GTM and founder work into distribution.",
      category: "tfe",
      progress: 0,
      target: "25 published posts",
      deadline: in60,
      xpReward: 800,
      status: "active",
      createdAt: created,
    },
    {
      id: "mission-reefly-mrr",
      title: "Generate Reefly's First $1,000 MRR",
      description: "Convert engaged Reefly users into the first $1,000 of monthly recurring revenue.",
      category: "reefly",
      progress: 0,
      target: "$1,000 MRR",
      deadline: in90,
      xpReward: 1000,
      status: "active",
      createdAt: created,
    },
    {
      id: "mission-20-interviews",
      title: "Conduct 20 Customer Interviews",
      description:
        "Twenty structured conversations with Reefly users and prospects about their workflows.",
      category: "reefly",
      progress: 0,
      target: "20 interviews",
      deadline: in60,
      xpReward: 600,
      status: "active",
      createdAt: created,
    },
    {
      id: "mission-tfe-event",
      title: "Host a TFE Event",
      description: "Host the first Founders Experience event: dinner, AMA, or small summit.",
      category: "tfe",
      progress: 0,
      target: "1 event hosted with 10+ founders",
      deadline: null,
      xpReward: 600,
      status: "not_started",
      createdAt: created,
    },
  ];
}

// ── Sample history ──────────────────────────────────────────────────────────
// A realistic ~2 weeks of activity so the dashboard, streaks, and insights
// are alive on first run. Wipe it from Settings → "Start fresh".

interface SampleEntry {
  daysBack: number;
  text: string;
  entries: { skillId: string; xp: number; note: string }[];
  insight: string;
}

const SAMPLE_HISTORY: SampleEntry[] = [
  {
    daysBack: 12,
    text: "Completed the first discovery lesson and sketched a workflow map for a manufacturing maintenance process.",
    entries: [
      { skillId: "discovery", xp: 30, note: "Completed discovery lesson" },
      { skillId: "discovery", xp: 50, note: "Drafted first workflow map" },
    ],
    insight: "Mapping workflows before pitching is the right instinct: it turns AI from a demo into a diagnosis.",
  },
  {
    daysBack: 11,
    text: "Customer call with a plant ops director. Walked through their downtime reporting workflow and where the data lives.",
    entries: [
      { skillId: "discovery", xp: 75, note: "Customer discovery call" },
      { skillId: "executive_selling", xp: 25, note: "Framed pain in business terms" },
    ],
    insight: "You got to the data-estate question in call one. That is where enterprise AI deals are actually won.",
  },
  {
    daysBack: 10,
    text: "Drafted a TFE post about why AI discovery beats AI demos.",
    entries: [{ skillId: "writing", xp: 50, note: "Drafted TFE post" }],
    insight: "Drafts don't compound: shipping does. Get it published.",
  },
  {
    daysBack: 9,
    text: "Architected an AI use case around predictive maintenance: sensor data, retrieval over maintenance logs, and a human approval step.",
    entries: [
      { skillId: "ai_architecture", xp: 75, note: "Designed predictive-maintenance architecture" },
      { skillId: "rag", xp: 25, note: "Scoped retrieval over maintenance logs" },
    ],
    insight: "Including the human approval step in v1 of the diagram will pay off in the security review.",
  },
  {
    daysBack: 8,
    text: "Shipped improvements to Reefly onboarding: cut setup from 6 steps to 3.",
    entries: [{ skillId: "product", xp: 150, note: "Shipped onboarding improvements" }],
    insight: "Onboarding is the highest-leverage surface you own. Instrument the before/after activation rate.",
  },
  {
    daysBack: 7,
    text: "Published the TFE post on AI discovery and shared it with three founder groups.",
    entries: [
      { skillId: "writing", xp: 75, note: "Published TFE post" },
      { skillId: "audience", xp: 25, note: "Distributed to founder groups" },
    ],
    insight: "Publishing plus distribution in the same day: that's the whole TFE engine in miniature.",
  },
  {
    daysBack: 5,
    text: "Two Reefly user interviews. Both asked for better weekly summaries, neither mentioned the feature I expected.",
    entries: [{ skillId: "customer_discovery", xp: 75, note: "Two user interviews" }],
    insight: "Two interviews asking for the same thing you didn't plan to build: that's a signal, not noise.",
  },
  {
    daysBack: 4,
    text: "Customer pushed back on data permissions for the maintenance copilot. Reframed it as an accountability and approval-tier discussion.",
    entries: [
      { skillId: "governance", xp: 50, note: "Handled data-permissions objection" },
      { skillId: "security", xp: 25, note: "Discussed access controls" },
    ],
    insight: "You converted a security objection into a governance conversation. That's a repeatable play: write it down.",
  },
  {
    daysBack: 3,
    text: "Scoped the predictive maintenance POC: success metric, four-week window, single site.",
    entries: [
      { skillId: "pocs", xp: 50, note: "Scoped POC charter" },
      { skillId: "roi_business_cases", xp: 25, note: "Drafted baseline cost model" },
    ],
    insight: "A POC with a written success metric and a deadline converts. One without both stalls.",
  },
  {
    daysBack: 2,
    text: "Three founder intros from the TFE post. One runs a 40-person logistics company with a real AI budget.",
    entries: [
      { skillId: "networking", xp: 50, note: "Three founder intros" },
      { skillId: "partnerships", xp: 25, note: "Qualified a potential design partner" },
    ],
    insight: "TFE is starting to feed the GTM pipeline. That flywheel is the strategy: keep it turning.",
  },
  {
    daysBack: 1,
    text: "Shipped the Reefly weekly summary feature that both interviewees asked for.",
    entries: [
      { skillId: "product", xp: 100, note: "Shipped weekly summaries" },
      { skillId: "retention", xp: 25, note: "Closed the loop with interviewees" },
    ],
    insight: "Interview → ship → close the loop in under a week. That cycle is your retention engine.",
  },
];

function buildSampleHistory(now: Date): {
  xpEvents: XpEvent[];
  activityLogs: ActivityLog[];
  quests: DailyQuest[];
} {
  const xpEvents: XpEvent[] = [];
  const activityLogs: ActivityLog[] = [];
  const quests: DailyQuest[] = [];

  for (const entry of SAMPLE_HISTORY) {
    const date = daysAgo(entry.daysBack, now);
    const logId = crypto.randomUUID();
    const classified = entry.entries.map((e) => {
      const def = SKILL_DEFS.find((s) => s.id === e.skillId)!;
      return {
        skillId: e.skillId,
        skillName: def.name,
        category: def.category,
        xp: e.xp,
        note: e.note,
      };
    });
    const totalXp = classified.reduce((s, c) => s + c.xp, 0);
    activityLogs.push({
      id: logId,
      rawText: entry.text,
      entries: classified,
      insight: entry.insight,
      nextFocus: "",
      totalXp,
      createdAt: date.toISOString(),
    });
    for (const c of classified) {
      xpEvents.push({
        id: crypto.randomUUID(),
        skillId: c.skillId,
        category: c.category,
        amount: c.xp,
        sourceType: "activity",
        sourceId: logId,
        description: c.note,
        createdAt: date.toISOString(),
      });
    }
  }

  // Two completed pre-campaign quests
  const pastQuests: { daysBack: number; title: string; category: "ai_gtm" | "tfe" | "reefly"; reward: number; reflection: string }[] = [
    {
      daysBack: 6,
      title: "Draft your AI opportunity thesis",
      category: "ai_gtm",
      reward: 100,
      reflection: "You turned vague ambition into a written thesis. Discovery now has a target.",
    },
    {
      daysBack: 3,
      title: "Run the interview-to-ship loop once",
      category: "reefly",
      reward: 100,
      reflection: "One full loop: ask, build, close the loop. This is the Reefly operating cadence.",
    },
  ];
  for (const q of pastQuests) {
    const date = daysAgo(q.daysBack, now);
    const questId = crypto.randomUUID();
    quests.push({
      id: questId,
      date: dateKey(date),
      title: q.title,
      description: "",
      category: q.category,
      skillIds: [],
      rewardXp: q.reward,
      tasks: [
        { id: crypto.randomUUID(), title: "Complete today's lesson", completed: true },
        { id: crypto.randomUUID(), title: "Produce the deliverable", completed: true },
        { id: crypto.randomUUID(), title: "Write one takeaway", completed: true },
      ],
      status: "completed",
      reflection: q.reflection,
      completedAt: date.toISOString(),
    });
    xpEvents.push({
      id: crypto.randomUUID(),
      skillId: null,
      category: q.category,
      amount: q.reward,
      sourceType: "quest",
      sourceId: questId,
      description: `Quest complete: ${q.title}`,
      createdAt: date.toISOString(),
    });
  }

  return { xpEvents, activityLogs, quests };
}

export function buildSeedState(withSampleData: boolean, now: Date = new Date()): AppState {
  const skills = seedSkills();
  const missions = seedMissions(now);

  let xpEvents: XpEvent[] = [];
  let activityLogs: ActivityLog[] = [];
  let quests: DailyQuest[] = [];
  let activeDates: string[] = [];

  if (withSampleData) {
    const sample = buildSampleHistory(now);
    xpEvents = sample.xpEvents;
    activityLogs = sample.activityLogs;
    quests = sample.quests;

    // Apply sample XP to skills
    for (const ev of xpEvents) {
      if (ev.skillId) {
        const skill = skills.find((s) => s.id === ev.skillId);
        if (skill) skill.xp += ev.amount;
      }
    }
    activeDates = [...new Set(SAMPLE_HISTORY.map((s) => dateKey(daysAgo(s.daysBack, now))))];
  }

  const yesterday = dateKey(daysAgo(1, now));
  return {
    playerName: "Arun",
    skills,
    xpEvents,
    activityLogs,
    quests,
    missions,
    todos: [
      {
        id: crypto.randomUUID(),
        title: "Schedule one Reefly user interview",
        category: "reefly",
        notes: "Ask what they actually paid for last quarter: not a feature wishlist.",
        pinned: true,
        completed: false,
        createdAt: now.toISOString(),
        completedAt: null,
      },
    ],
    weeklyReviews: [],
    notes: [],
    noteFolders: [],
    inventory: { gold: 0, owned: [], equipped: [] },
    chat: [],
    contextNotes: [],
    customWeeks: [],
    streak: withSampleData
      ? {
          current: 4,
          longest: 6,
          lastCompletionDate: yesterday,
          activeDates,
        }
      : { current: 0, longest: 0, lastCompletionDate: null, activeDates: [] },
    campaign: { currentWeek: 1, currentDay: 1, completedDays: [], version: 2 },
    weightEntries: [],
    weightUnit: "lb",
    weightGoal: null,
  };
}
