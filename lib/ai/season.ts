import { CATEGORIES, CATEGORY_MAP, SKILL_DEF_MAP, SKILL_DEFS } from "../skills";
import { levelFromXp } from "../xp";
import type { AppState, CategoryId, CurriculumDay, CurriculumWeek } from "../types";
import { coachSystemPrompt, getOpenAI, openAiModel } from "./openai";

// ── Self-learning campaign generator ────────────────────────────────────────
// When the static Season 1 curriculum runs out (or whenever the cursor moves
// past known weeks), the system generates the next week from Arun's actual
// state: weakest skills, stalest skills, active mission gaps, recent patterns.
// With an OpenAI key the week is written by the coach; otherwise a rule
// engine builds it from templates. Either way it targets his real gaps.

const DAY = 86_400_000;

interface SkillSignal {
  id: string;
  name: string;
  category: CategoryId;
  xp: number;
  level: number;
  daysSincePracticed: number; // Infinity if never
  score: number; // higher = needs more attention
}

export function skillSignals(state: AppState): SkillSignal[] {
  const now = Date.now();
  const lastPracticed = new Map<string, number>();
  for (const e of state.xpEvents) {
    if (!e.skillId) continue;
    const t = new Date(e.createdAt).getTime();
    if (t > (lastPracticed.get(e.skillId) ?? 0)) lastPracticed.set(e.skillId, t);
  }
  return state.skills
    .map((s) => {
      const last = lastPracticed.get(s.id);
      const daysSince = last ? (now - last) / DAY : 30; // treat "never" as 30 days stale
      const level = levelFromXp(s.xp).level;
      // Low level + long untouched = high priority
      const score = 100 / (level + 1) + Math.min(daysSince, 30) * 2;
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        xp: s.xp,
        level,
        daysSincePracticed: daysSince,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// Escalating application pattern: learn → build → apply with real people →
// ship/publish → extract the playbook. Execution always outranks consumption.
const DAY_PATTERN: {
  title: (skill: string) => string;
  lesson: (skill: string, ctx: string) => string;
  deliverable: (skill: string) => string;
}[] = [
  {
    title: (s) => `${s}: Sharpen the Mental Model`,
    lesson: (s, ctx) =>
      `Study the core frameworks of ${s.toLowerCase()} — but with a target: ${ctx}. One hour of learning, then write down how it applies to that real situation.`,
    deliverable: (s) => `${s} Framework Notes #001`,
  },
  {
    title: (s) => `${s}: Build the Artifact`,
    lesson: (s, ctx) =>
      `Turn study into a real artifact for ${ctx}. Templates, checklists, and maps count — something you could hand to someone else.`,
    deliverable: (s) => `${s} Artifact #001`,
  },
  {
    title: (s) => `${s}: Apply It With Real People`,
    lesson: (s, ctx) =>
      `Use the artifact in a live situation — a customer call, a user conversation, a real post. ${ctx} is the testing ground. Log what actually happened, not what you hoped.`,
    deliverable: (s) => `${s} Field Notes #001`,
  },
  {
    title: (s) => `${s}: Ship Something Visible`,
    lesson: (s, ctx) =>
      `Convert this week's ${s.toLowerCase()} work into something that exists in the world: a shipped improvement, a published post, a sent proposal. Visible output only.`,
    deliverable: (s) => `${s} Shipped Output #001`,
  },
  {
    title: (s) => `${s}: Extract the Playbook`,
    lesson: (s, ctx) =>
      `Compress the week into a repeatable play: when to use it, the steps, what breaks. This is how ${s.toLowerCase()} stops being effort and becomes a system.`,
    deliverable: (s) => `${s} Playbook Entry #001`,
  },
];

const CATEGORY_CONTEXT: Record<CategoryId, string> = {
  ai_gtm: "your active enterprise AI opportunities",
  tfe: "The Founders Experience audience you're building",
  reefly: "Reefly's users and revenue goals",
  work: "your TDengine solutions engineering work and promotion case",
  physical: "your training, nutrition, and physique goals",
  social: "your friendships, family, and community",
  wealth: "your net worth trajectory toward $20M — investing, income, ownership",
  brand: "your personal brand and the 10,000 LinkedIn followers goal",
};

function ruleBasedWeek(state: AppState, weekNumber: number): CurriculumWeek {
  const signals = skillSignals(state);

  // Mission pressure: boost categories with active missions
  const missionCats = new Set(
    state.missions.filter((m) => m.status === "active").map((m) => m.category),
  );
  const boosted = signals.map((s) => ({
    ...s,
    score: s.score + (missionCats.has(s.category) ? 15 : 0),
  }));
  boosted.sort((a, b) => b.score - a.score);

  // Pick 5 focus skills, ensuring at least 2 categories are represented
  const focus: SkillSignal[] = [];
  for (const s of boosted) {
    if (focus.length >= 5) break;
    focus.push(s);
    const cats = new Set(focus.map((f) => f.category));
    if (focus.length === 3 && cats.size === 1) {
      // force diversity on picks 4-5
      const other = boosted.find((b) => b.category !== s.category && !focus.includes(b));
      if (other) focus.push(other);
    }
  }

  const season = Math.ceil(weekNumber / 12);
  const weakest = focus[0];
  const days: CurriculumDay[] = focus.slice(0, 5).map((skill, i) => {
    const pattern = DAY_PATTERN[i % DAY_PATTERN.length];
    const ctx = CATEGORY_CONTEXT[skill.category];
    return {
      day: i + 1,
      title: pattern.title(skill.name),
      lesson: pattern.lesson(skill.name, ctx),
      deliverable: pattern.deliverable(skill.name),
      category: skill.category,
      skillIds: [skill.id],
    };
  });

  return {
    week: weekNumber,
    title: `Focus: ${weakest.name} & Co.`,
    theme: `Generated from your data — weakest skill: ${weakest.name} (Lv ${weakest.level}), plus ${focus
      .slice(1, 3)
      .map((f) => f.name)
      .join(", ")}. Learn → build → apply → ship → systematize.`,
    days,
  };
}

async function openAiWeek(state: AppState, weekNumber: number): Promise<CurriculumWeek | null> {
  const openai = getOpenAI();
  if (!openai) return null;

  const signals = skillSignals(state);
  const weakest = signals.slice(0, 8).map((s) => `${s.name} (Lv ${s.level}, ${Math.round(s.daysSincePracticed)}d since practiced)`);
  const strongest = [...signals].sort((a, b) => a.score - b.score).slice(0, 4).map((s) => `${s.name} (Lv ${s.level})`);
  const missions = state.missions
    .filter((m) => m.status === "active")
    .map((m) => `${m.title} (${m.progress}%, ${CATEGORY_MAP[m.category as CategoryId]?.shortName ?? "general"})`)
    .join("; ");
  const recentLogs = state.activityLogs.slice(-5).map((l) => l.rawText.slice(0, 120)).join(" | ");
  const skillList = SKILL_DEFS.map((s) => `${s.id} (${s.name}, ${s.category})`).join("\n");

  try {
    const res = await openai.chat.completions.create({
      model: openAiModel(),
      response_format: { type: "json_object" },
      temperature: 0.6,
      messages: [
        { role: "system", content: await coachSystemPrompt(state.contextNotes) },
        {
          role: "user",
          content: `Design next week's campaign chapter (Week ${weekNumber}) for Arun. It must attack his real gaps.

His data:
- Weakest / stalest skills: ${weakest.join(", ")}
- Strongest skills: ${strongest.join(", ")}
- Active missions: ${missions || "none"}
- Recent journal entries: ${recentLogs || "none"}

Valid skill ids (use exactly):
${skillList}

Rules:
- 5 days. Each day escalates: learn → build an artifact → apply with real people → ship/publish something visible → extract a repeatable play.
- Every day has a concrete deliverable that exists in the real world.
- Weight toward his weakest skills and active missions, but keep at least 2 of the 3 pillars in the week.
- Lessons are 1-2 sentences, demanding-advisor voice, specific to his situation.

Return JSON:
{
  "title": string (short chapter name),
  "theme": string (one sentence),
  "days": [{ "day": 1-5, "title": string, "lesson": string, "deliverable": string, "category": "ai_gtm"|"tfe"|"reefly", "skillIds": string[] (1-2 valid ids) }]
}`,
        },
      ],
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
    if (!Array.isArray(parsed.days) || parsed.days.length === 0) return null;

    const days: CurriculumDay[] = parsed.days.slice(0, 5).map(
      (d: Partial<CurriculumDay>, i: number) => {
        const validSkillIds = (d.skillIds ?? []).filter(
          (id): id is string => typeof id === "string" && id in SKILL_DEF_MAP,
        );
        const category: CategoryId = CATEGORIES.some((c) => c.id === d.category)
          ? (d.category as CategoryId)
          : validSkillIds.length
            ? SKILL_DEF_MAP[validSkillIds[0]].category
            : "ai_gtm";
        return {
          day: i + 1,
          title: String(d.title ?? `Day ${i + 1}`),
          lesson: String(d.lesson ?? ""),
          deliverable: String(d.deliverable ?? `Deliverable #${i + 1}`),
          category,
          skillIds: validSkillIds.length ? validSkillIds : [SKILL_DEFS.find((s) => s.category === category)!.id],
        };
      },
    );

    return {
      week: weekNumber,
      title: String(parsed.title ?? `Week ${weekNumber}`),
      theme: String(parsed.theme ?? "Generated from your current gaps."),
      days,
    };
  } catch (err) {
    console.error("OpenAI week generation failed, using rule engine:", err);
    return null;
  }
}

/** Generate the campaign week numbered `weekNumber` from current state. */
export async function generateWeek(
  state: AppState,
  weekNumber: number,
): Promise<CurriculumWeek> {
  const ai = await openAiWeek(state, weekNumber);
  return ai ?? ruleBasedWeek(state, weekNumber);
}
