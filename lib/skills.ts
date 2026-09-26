import type { CategoryId, Skill } from "./types";

// ── Skill tree definitions ──────────────────────────────────────────────────

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  shortName: string;
  description: string;
  color: string; // hex used for charts / accents
  tailwind: string; // text color class
  bg: string; // soft bg class
  bar: string; // progress bar class
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "ai_gtm",
    name: "AI GTM / Implementation",
    shortName: "AI GTM",
    description: "Taking enterprise AI from discovery to production ROI.",
    color: "#38bdf8",
    tailwind: "text-gtm",
    bg: "bg-gtm/10",
    bar: "bg-gtm",
  },
  {
    id: "tfe",
    name: "TFE / Brand & Network",
    shortName: "TFE",
    description: "The Founders Experience: audience, network, distribution.",
    color: "#a78bfa",
    tailwind: "text-tfe",
    bg: "bg-tfe/10",
    bar: "bg-tfe",
  },
  {
    id: "reefly",
    name: "Reefly / Founder",
    shortName: "Reefly",
    description: "Building Reefly into a real recurring-revenue business.",
    color: "#34d399",
    tailwind: "text-reef",
    bg: "bg-reef/10",
    bar: "bg-reef",
  },
  {
    id: "work",
    name: "TDengine (Work)",
    shortName: "Work",
    description: "Solutions Engineering at TDengine: the day job.",
    color: "#fb923c",
    tailwind: "text-orange-400",
    bg: "bg-orange-400/10",
    bar: "bg-orange-400",
  },
  {
    id: "physical",
    name: "Physical",
    shortName: "Physical",
    description: "Training, nutrition, recovery: the body.",
    color: "#fb7185",
    tailwind: "text-rose-400",
    bg: "bg-rose-400/10",
    bar: "bg-rose-400",
  },
  {
    id: "social",
    name: "Social Life",
    shortName: "Social",
    description: "Friendships, family, community, hosting.",
    color: "#2dd4bf",
    tailwind: "text-teal-400",
    bg: "bg-teal-400/10",
    bar: "bg-teal-400",
  },
  {
    id: "wealth",
    name: "Wealth",
    shortName: "Wealth",
    description: "Net worth, investing, income, ownership: the $20M road.",
    color: "#facc15",
    tailwind: "text-yellow-400",
    bg: "bg-yellow-400/10",
    bar: "bg-yellow-400",
  },
  {
    id: "brand",
    name: "Personal Brand",
    shortName: "Brand",
    description: "LinkedIn, writing, positioning: become known for AI that ships.",
    color: "#e879f9",
    tailwind: "text-fuchsia-400",
    bg: "bg-fuchsia-400/10",
    bar: "bg-fuchsia-400",
  },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryMeta>;

/** Badge meta for any task/mission category ("general" gets none). */
export function badgeMeta(
  category: CategoryId | "general",
): CategoryMeta | null {
  if (category === "general") return null;
  return CATEGORY_MAP[category];
}

/** id, name, category: XP is stored in the DB, definitions live here. */
export const SKILL_DEFS: { id: string; name: string; category: CategoryId }[] = [
  // AI GTM / Implementation
  { id: "discovery", name: "Discovery", category: "ai_gtm" },
  { id: "ai_architecture", name: "AI Architecture", category: "ai_gtm" },
  { id: "agents", name: "Agents", category: "ai_gtm" },
  { id: "rag", name: "RAG", category: "ai_gtm" },
  { id: "pocs", name: "POCs", category: "ai_gtm" },
  { id: "security", name: "Security", category: "ai_gtm" },
  { id: "governance", name: "Governance", category: "ai_gtm" },
  { id: "implementation", name: "Implementation", category: "ai_gtm" },
  { id: "executive_selling", name: "Executive Selling", category: "ai_gtm" },
  { id: "roi_business_cases", name: "ROI & Business Cases", category: "ai_gtm" },
  // TFE / Brand & Network
  { id: "writing", name: "Writing", category: "tfe" },
  { id: "storytelling", name: "Storytelling", category: "tfe" },
  { id: "audience", name: "Audience", category: "tfe" },
  { id: "networking", name: "Networking", category: "tfe" },
  { id: "community", name: "Community", category: "tfe" },
  { id: "events", name: "Events", category: "tfe" },
  { id: "partnerships", name: "Partnerships", category: "tfe" },
  { id: "executive_communication", name: "Executive Communication", category: "tfe" },
  // Reefly / Founder
  { id: "product", name: "Product", category: "reefly" },
  { id: "customer_discovery", name: "Customer Discovery", category: "reefly" },
  { id: "growth", name: "Growth", category: "reefly" },
  { id: "sales", name: "Sales", category: "reefly" },
  { id: "retention", name: "Retention", category: "reefly" },
  { id: "monetization", name: "Monetization", category: "reefly" },
  { id: "finance", name: "Finance", category: "reefly" },
  { id: "leadership", name: "Leadership", category: "reefly" },
  { id: "operations", name: "Operations", category: "reefly" },
  // TDengine (Work)
  { id: "demos", name: "Customer Demos", category: "work" },
  { id: "tsdb_domain", name: "TSDB Domain", category: "work" },
  { id: "enablement", name: "Enablement Assets", category: "work" },
  { id: "se_leadership", name: "SE Leadership", category: "work" },
  { id: "customer_outcomes", name: "Customer Outcomes", category: "work" },
  // Physical
  { id: "strength", name: "Strength", category: "physical" },
  { id: "conditioning", name: "Conditioning", category: "physical" },
  { id: "nutrition", name: "Nutrition", category: "physical" },
  { id: "recovery", name: "Sleep & Recovery", category: "physical" },
  // Social
  { id: "friendships", name: "Friendships", category: "social" },
  { id: "family", name: "Family", category: "social" },
  { id: "community_social", name: "Community", category: "social" },
  { id: "hosting", name: "Hosting & Gatherings", category: "social" },
  // Wealth
  { id: "investing", name: "Investing", category: "wealth" },
  { id: "income_growth", name: "Income Growth", category: "wealth" },
  { id: "equity_ownership", name: "Equity & Ownership", category: "wealth" },
  { id: "capital_efficiency", name: "Saving & Capital Efficiency", category: "wealth" },
  { id: "financial_literacy", name: "Financial Literacy", category: "wealth" },
  // Personal Brand
  { id: "linkedin_presence", name: "LinkedIn Presence", category: "brand" },
  { id: "personal_writing", name: "Personal Writing", category: "brand" },
  { id: "thought_leadership", name: "Thought Leadership", category: "brand" },
  { id: "personal_network", name: "Personal Network", category: "brand" },
  { id: "positioning", name: "Positioning", category: "brand" },
];

export const SKILL_DEF_MAP: Record<string, (typeof SKILL_DEFS)[number]> =
  Object.fromEntries(SKILL_DEFS.map((s) => [s.id, s]));

/** Zeroed totals for every pillar: use instead of hardcoded literals so new
 *  categories never break call sites. */
export function emptyCategoryTotals(): Record<CategoryId, number> {
  return Object.fromEntries(CATEGORIES.map((c) => [c.id, 0])) as Record<
    CategoryId,
    number
  >;
}

export function skillsForCategory(category: CategoryId, skills: Skill[]): Skill[] {
  return skills.filter((s) => s.category === category);
}

export function categoryXp(category: CategoryId, skills: Skill[]): number {
  return skills
    .filter((s) => s.category === category)
    .reduce((sum, s) => sum + s.xp, 0);
}

/** First skill in a pillar: used so category-only XP (tasks, missions)
 *  still lands on the skill tree instead of vanishing. */
export function defaultSkillForCategory(category: CategoryId): string | null {
  return SKILL_DEFS.find((s) => s.category === category)?.id ?? null;
}
