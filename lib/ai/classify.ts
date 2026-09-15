import { SKILL_DEF_MAP, SKILL_DEFS } from "../skills";
import type { AppState, ClassifiedActivity } from "../types";
import { coachSystemPrompt, getOpenAI, openAiModel } from "./openai";

// ── Activity classification ─────────────────────────────────────────────────
// OpenAI when a key is configured; otherwise a deterministic heuristic engine
// so the app is fully playable with zero external dependencies.

export interface ClassificationResult {
  entries: ClassifiedActivity[];
  insight: string;
  nextFocus: string;
}

// Keyword → skill affinities. Order matters only for tie-breaking.
const SKILL_KEYWORDS: Record<string, string[]> = {
  discovery: ["discovery", "diagnose", "workflow map", "pain", "business problem", "requirements", "discovery call", "customer call", "use case around", "mapped"],
  ai_architecture: ["architect", "architecture", "system design", "designed", "whiteboard", "use case", "solution"],
  agents: ["agent", "agentic", "automation", "autonomous", "tool-using", "workflow automation"],
  rag: ["rag", "retrieval", "embedding", "vector", "knowledge base", "chunking", "citations"],
  pocs: ["poc", "proof of concept", "prototype", "pilot", "scoped", "success criteria"],
  security: ["security", "permissions", "data access", "compliance", "privacy", "soc 2", "encryption", "ciso"],
  governance: ["governance", "accountability", "oversight", "policy", "approval", "audit", "guardrails"],
  implementation: ["implementation", "deploy", "production", "rollout", "integration", "go-live", "adoption plan"],
  executive_selling: ["executive", "pitch", "c-suite", "demo", "stakeholder", "business value", "champion", "cfo", "cio", "readout"],
  roi_business_cases: ["roi", "business case", "cost model", "savings", "payback", "value model"],
  writing: ["wrote", "writing", "draft", "post", "article", "blog", "published", "essay", "newsletter"],
  storytelling: ["story", "narrative", "storytelling", "framing"],
  audience: ["audience", "followers", "subscribers", "engagement", "impressions", "distribution"],
  networking: ["networking", "intro", "intros", "connected with", "met with", "coffee chat"],
  community: ["community", "members", "discord", "slack group", "founder group"],
  events: ["event", "hosted", "meetup", "webinar", "conference", "dinner", "ama"],
  partnerships: ["partnership", "partner", "collaboration", "design partner", "integration partner"],
  executive_communication: ["presentation", "presented", "briefing", "one-pager", "deck", "board update", "memo"],
  product: ["product", "feature", "onboarding", "shipped", "ux", "ui", "improvement", "bug fix", "release"],
  customer_discovery: ["interview", "user call", "customer call", "feedback", "user conversation", "customer interview", "talked to users"],
  growth: ["growth", "signup", "signups", "activation", "acquisition", "funnel", "conversion"],
  sales: ["sales", "closed", "deal", "pricing call", "proposal", "contract"],
  retention: ["retention", "churn", "weekly active", "engagement", "closed the loop"],
  monetization: ["monetization", "revenue", "mrr", "pricing", "payment", "paid plan", "subscription"],
  finance: ["finance", "budget", "runway", "accounting", "burn", "cash"],
  leadership: ["leadership", "team", "hiring", "hire", "culture", "1:1", "coaching"],
  operations: ["operations", "process", "ops", "runbook", "automation", "internal tool"],
  // TDengine (Work)
  demos: ["demo", "demoed", "product walkthrough", "walked through the product", "live demo"],
  tsdb_domain: ["tdengine", "time-series", "timeseries", "tsdb", "sql", "database", "query", "schema"],
  enablement: ["enablement", "documentation", "docs", "training session", "onboarded", "knowledge base article"],
  se_leadership: ["mentored", "mentoring", "shadowed", "shadowing", "interview panel", "se team", "ramped"],
  customer_outcomes: ["customer win", "go-live", "went live", "renewal", "expansion", "production issue", "escalation", "customer success"],
  // Physical
  strength: ["bench", "squat", "deadlift", "lifted", "lifting", "weights", "gym", "strength", "5x5", "press", "rows", "pull-up", "pullups"],
  conditioning: ["run", "ran", "running", "cardio", "hike", "hiked", "bike", "cycling", "swim", "swam", "hiit", "basketball"],
  nutrition: ["protein", "meal prep", "diet", "calories", "calorie", "fasting", "cooked", "nutrition", "meal plan", "cut", "bulk"],
  recovery: ["sleep", "slept", "rest day", "stretch", "stretching", "mobility", "recovery", "sauna", "ice bath"],
  // Social
  friendships: ["friend", "friends", "buddy", "caught up with", "called a friend", "hung out"],
  family: ["family", "mom", "dad", "parents", "mother", "father", "sister", "brother", "called home", "cousin"],
  community_social: ["neighborhood", "volunteer", "volunteered", "local club", "church", "community event"],
  hosting: ["hosted dinner", "hosted friends", "had people over", "party", "gathering", "bbq", "barbecue", "game night", "dinner party", "hosted a"],
  // Wealth
  investing: ["invested", "investing", "portfolio", "index fund", "etf", "stocks", "brokerage", "401k", "roth", "ira", "real estate", "rebalanced"],
  income_growth: ["raise", "salary", "promotion comp", "side income", "consulting fee", "contract rate", "negotiated pay", "new income stream"],
  equity_ownership: ["equity", "shares", "vesting", "rsu", "cap table", "ownership stake", "options grant"],
  capital_efficiency: ["saved", "savings rate", "budget", "expenses", "cut spending", "net worth", "emergency fund", "debt", "paid off"],
  financial_literacy: ["financial", "wealth book", "tax strategy", "taxes", "accountant", "financial advisor", "compounding", "asset allocation"],
  // Personal Brand
  linkedin_presence: ["linkedin", "followers", "connection request", "li post", "linked in"],
  personal_writing: ["personal essay", "wrote a post", "drafted a post", "newsletter issue"],
  thought_leadership: ["thought leadership", "point of view", "pov", "keynote", "talked on a panel"],
  personal_network: ["dm'd", "dmed", "linkedin dm", "reached out to", "new connection"],
  positioning: ["personal brand", "positioning", "how i'm known", "my brand", "reputation"],
};

// Action verbs → suggested XP magnitude.
// Anti-gaming philosophy: learning < application < real-world outcomes.
const XP_ACTIONS: { pattern: RegExp; xp: number }[] = [
  { pattern: /\b(measurable (customer )?value|revenue|mrr|first (paying )?customer)\b/i, xp: 1000 },
  { pattern: /\b(moved .{0,20}production|poc .{0,20}production|went live|go-live|signed contract)\b/i, xp: 500 },
  { pattern: /\b(designed a (real )?poc|poc charter|production proposal)\b/i, xp: 150 },
  { pattern: /\b(shipped|launched|deployed|released)\b/i, xp: 150 },
  { pattern: /\b(closed|signed|won)\b/i, xp: 150 },
  { pattern: /\b(with a (real )?customer|real customer|customer call|user call|interview|conversation with|met with|hosted)\b/i, xp: 100 },
  { pattern: /\b(published|posted)\b/i, xp: 75 },
  { pattern: /\b(architected|designed|whiteboarded|mapped|created|built|framework)\b/i, xp: 50 },
  { pattern: /\b(practiced|rehearsed|scoped|planned|outlined|specced|drafted|wrote)\b/i, xp: 50 },
  { pattern: /\b(handled|reframed|answered|resolved)\b/i, xp: 50 },
  { pattern: /\b(completed .{0,15}lesson|finished .{0,15}lesson)\b/i, xp: 20 },
  { pattern: /\b(read|studied|watched|researched|learned|article|book)\b/i, xp: 10 },
  // Physical / social magnitudes
  { pattern: /\b(new pr|personal record|pr’d|pr'ed|hit \d+ ?(lb|kg|pound))/i, xp: 100 },
  { pattern: /\b(workout|worked out|lifted|trained|training session|ran|gym)\b/i, xp: 50 },
  { pattern: /\b(hosted|had people over|dinner party|game night)\b/i, xp: 75 },
];

const DEFAULT_XP = 25;

function splitIntoClauses(text: string): string[] {
  return text
    .split(/(?<=[.!?\n])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

function scoreSkills(clause: string): { skillId: string; hits: number }[] {
  const lower = clause.toLowerCase();
  const scores: { skillId: string; hits: number }[] = [];
  for (const [skillId, keywords] of Object.entries(SKILL_KEYWORDS)) {
    let hits = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) hits += kw.includes(" ") ? 2 : 1;
    }
    if (hits > 0) scores.push({ skillId, hits });
  }
  return scores.sort((a, b) => b.hits - a.hits);
}

function xpForClause(clause: string): number {
  for (const { pattern, xp } of XP_ACTIONS) {
    if (pattern.test(clause)) return xp;
  }
  return DEFAULT_XP;
}

function noteForClause(clause: string): string {
  const clean = clause.replace(/\s+/g, " ").trim();
  const sentence = clean.charAt(0).toUpperCase() + clean.slice(1);
  return sentence.length > 80 ? sentence.slice(0, 77) + "…" : sentence;
}

function heuristicInsight(entries: ClassifiedActivity[], raw: string): string {
  const lower = raw.toLowerCase();
  const has = (...ids: string[]) => entries.some((e) => ids.includes(e.skillId));

  if (/(permission|data access|security|compliance|privacy)/.test(lower) && has("governance", "security")) {
    return "You encountered a real governance objection today. This is a strong opportunity to practice turning data-access concerns into an accountability and permissions discussion.";
  }
  if (has("customer_discovery") && has("product")) {
    return "You talked to users and shipped in the same window. That loop — hear it, build it, close the loop — is the entire retention engine. Keep the cycle time short.";
  }
  if (has("discovery") && has("ai_architecture")) {
    return "Discovery and architecture in the same day means the use case is grounded in a real workflow. Next test: can you explain the business value in three minutes without a diagram?";
  }
  if (has("writing")) {
    return "You produced content today. Distribution is the multiplier — make sure one real person reads it, not just the feed.";
  }
  if (has("product")) {
    return "Product work logged. The question that matters: which user-visible metric moves because of what you shipped?";
  }
  if (has("customer_discovery", "discovery")) {
    return "Real conversation logged. The value is in what changes because of it — write down one decision this conversation should alter.";
  }
  return "Logged. The pattern to watch: are you balancing building, selling, and distribution — or hiding in the one that's most comfortable?";
}

function heuristicNextFocus(entries: ClassifiedActivity[], state: AppState): string {
  const recentSkillIds = new Set(
    state.xpEvents
      .filter((e) => Date.now() - new Date(e.createdAt).getTime() < 7 * 86_400_000)
      .map((e) => e.skillId),
  );
  if (!recentSkillIds.has("customer_discovery") && !recentSkillIds.has("discovery")) {
    return "No customer conversations in the last week. Schedule one before you build anything else.";
  }
  if (!recentSkillIds.has("writing")) {
    return "Nothing published this week. Turn today's work into a short TFE post while it's fresh.";
  }
  const weakest = [...state.skills].sort((a, b) => a.xp - b.xp)[0];
  if (weakest) {
    return `Your weakest skill is ${weakest.name}. Find one small way to exercise it this week.`;
  }
  return "Keep the streak alive tomorrow.";
}

function heuristicClassify(text: string, state: AppState): ClassificationResult {
  const clauses = splitIntoClauses(text);
  const bySkill = new Map<string, { xp: number; notes: string[] }>();

  for (const clause of clauses) {
    const scored = scoreSkills(clause);
    if (!scored.length) continue;
    // Attribute to the top skill; split across top two if close
    const top = scored[0];
    const xp = xpForClause(clause);
    const entry = bySkill.get(top.skillId) ?? { xp: 0, notes: [] };
    entry.xp += xp;
    entry.notes.push(noteForClause(clause));
    bySkill.set(top.skillId, entry);
  }

  // Cap at 4 skills, merge smallest if needed
  let entries: ClassifiedActivity[] = [...bySkill.entries()]
    .map(([skillId, v]) => {
      const def = SKILL_DEF_MAP[skillId];
      return {
        skillId,
        skillName: def?.name ?? skillId,
        category: def?.category ?? "ai_gtm",
        xp: Math.min(v.xp, 1000),
        note: v.notes[0] ?? "",
      };
    })
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 4);

  if (!entries.length) {
    // Nothing matched — treat as general reflection, small XP to the weakest area
    const weakest = [...state.skills].sort((a, b) => a.xp - b.xp)[0];
    entries = [
      {
        skillId: weakest?.id ?? "discovery",
        skillName: weakest?.name ?? "Discovery",
        category: weakest?.category ?? "ai_gtm",
        xp: 20,
        note: "General work logged",
      },
    ];
  }

  return {
    entries,
    insight: heuristicInsight(entries, text),
    nextFocus: heuristicNextFocus(entries, state),
  };
}

// ── OpenAI path ─────────────────────────────────────────────────────────────

async function openAiClassify(text: string, state: AppState): Promise<ClassificationResult | null> {
  const openai = getOpenAI();
  if (!openai) return null;

  const skillList = SKILL_DEFS.map((s) => `${s.id} (${s.name}, ${s.category})`).join("\n");
  const recentSkills = state.activityLogs
    .slice(-5)
    .flatMap((l) => l.entries.map((e) => e.skillName))
    .join(", ");

  try {
    const res = await openai.chat.completions.create({
      model: openAiModel(),
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: await coachSystemPrompt(state.contextNotes) },
        {
          role: "user",
          content: `Classify this daily activity log into skill XP awards.

Skills (use these exact ids):
${skillList}

Recently active skills: ${recentSkills || "none yet"}

XP scale (anti-gaming: learning < application < real-world outcomes):
- read an article / passive consumption: 10
- complete a lesson: 20
- build an architecture / artifact / framework, practice a framework: 50
- publish meaningful content: 75
- use a framework with a REAL customer / customer or user conversation: 100
- design a real POC / ship a meaningful product improvement: 150
- move a POC into production / close a deal: 500
- generate measurable customer value / revenue: 1000

Rules: reward outcomes and real execution, never effort or hours spent. "Worked on X for 3 hours" earns little; "shipped X that users asked for" earns real XP. 1-4 skill entries max. Cap any single entry at 1000.

Activity log:
"""
${text}
"""

Return JSON:
{
  "entries": [{ "skillId": string, "xp": number, "note": string (≤ 10 words, what he actually did) }],
  "insight": string (1-2 sentences, sharp observation about the day, advisor voice),
  "nextFocus": string (1 sentence, the single most important thing to do next)
}`,
        },
      ],
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
    const entries: ClassifiedActivity[] = (parsed.entries ?? [])
      .filter((e: { skillId?: string }) => e.skillId && SKILL_DEF_MAP[e.skillId])
      .slice(0, 4)
      .map((e: { skillId: string; xp?: number; note?: string }) => ({
        skillId: e.skillId,
        skillName: SKILL_DEF_MAP[e.skillId].name,
        category: SKILL_DEF_MAP[e.skillId].category,
        xp: Math.max(5, Math.min(1000, Math.round(e.xp ?? 25))),
        note: e.note ?? "",
      }));
    if (!entries.length) return null;
    return {
      entries,
      insight: parsed.insight ?? heuristicInsight(entries, text),
      nextFocus: parsed.nextFocus ?? heuristicNextFocus(entries, state),
    };
  } catch (err) {
    console.error("OpenAI classify failed, falling back to heuristic:", err);
    return null;
  }
}

export async function classifyActivity(
  text: string,
  state: AppState,
): Promise<ClassificationResult> {
  const ai = await openAiClassify(text, state);
  return ai ?? heuristicClassify(text, state);
}
