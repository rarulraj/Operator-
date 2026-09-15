import type { CurriculumWeek } from "./types";

// ── AI × Sales × Founder — Season 1 ─────────────────────────────────────────
// 12 weeks. Each week is a chapter; each day has a lesson + a real deliverable.
// Completing a day's quest advances the campaign cursor.
// Structure follows ARUN_CONTEXT.md exactly.

export const CURRICULUM: CurriculumWeek[] = [
  {
    week: 1,
    title: "AI Buyer & Discovery Mastery I",
    theme: "Diagnose business workflows before ever pitching AI.",
    days: [
      {
        day: 1,
        title: "Diagnose Business Workflows Before Selling AI",
        lesson:
          "Enterprise AI deals are won in discovery, not in the demo. Core mental model: Trigger → Information → Reasoning → Decision → Action → Business Outcome. Decompose a workflow into its atomic parts, then ask: where does AI create leverage?",
        deliverable: "AI Workflow Map #001",
        category: "ai_gtm",
        skillIds: ["discovery", "ai_architecture"],
        deliverableSections: [
          "Business problem",
          "Current workflow",
          "Trigger",
          "Inputs",
          "Human reasoning",
          "Action",
          "Business owner",
          "Current metric",
          "AI intervention",
          "Autonomy level",
          "Human approval point",
          "Pilot metric",
          "Smallest safe pilot",
        ],
      },
      {
        day: 2,
        title: "The Nine Discovery Questions",
        lesson:
          "What workflow are we improving? Who performs it? What triggers it? What information is required? What decisions are made? What actions follow? What does it cost? What happens when it fails? Who owns the outcome? Drill these until they're reflexive.",
        deliverable: "Discovery Question Bank #001",
        category: "ai_gtm",
        skillIds: ["discovery"],
      },
      {
        day: 3,
        title: "Find the Buyer Who Owns the Pain",
        lesson:
          "Every workflow has an owner whose number suffers when it breaks. Identify the economic buyer behind a workflow and tie the pain to a metric they are accountable for.",
        deliverable: "Buyer-Pain Map #001",
        category: "ai_gtm",
        skillIds: ["discovery", "executive_selling"],
      },
      {
        day: 4,
        title: "Quantify the Cost of the Status Quo",
        lesson:
          "A workflow without a price tag is a science project. Convert hours, error rates, and cycle time into an annualized cost that justifies a pilot.",
        deliverable: "Cost-of-Status-Quo Model #001",
        category: "ai_gtm",
        skillIds: ["discovery", "roi_business_cases"],
      },
      {
        day: 5,
        title: "Run a Real Discovery Call",
        lesson:
          "Take the workflow map into a live conversation. Ask sharper questions: where does the data live, who approves exceptions, what breaks most often, what did they already try?",
        deliverable: "Discovery Call Notes #001",
        category: "ai_gtm",
        skillIds: ["discovery", "executive_selling"],
      },
    ],
  },
  {
    week: 2,
    title: "AI Buyer & Discovery Mastery II",
    theme: "From good questions to qualified, scored opportunities.",
    days: [
      {
        day: 1,
        title: "Score & Rank AI Opportunities",
        lesson:
          "Not every workflow deserves AI. Build a scoring rubric — data readiness, pain severity, executive sponsorship, pilot feasibility — and rank what you've found.",
        deliverable: "Opportunity Scorecard #001",
        category: "ai_gtm",
        skillIds: ["discovery", "roi_business_cases"],
      },
      {
        day: 2,
        title: "Map the Data Estate Early",
        lesson:
          "Where does the data live, who owns it, what classification does it carry? Surfacing data reality in week one kills bad deals fast and speeds up good ones.",
        deliverable: "Data Estate Map #001",
        category: "ai_gtm",
        skillIds: ["discovery", "security"],
      },
      {
        day: 3,
        title: "Disqualification Is a Skill",
        lesson:
          "The fastest way to look senior is to walk away from bad fits. Write the disqualification criteria for AI opportunities and apply them to your pipeline.",
        deliverable: "Disqualification Checklist #001",
        category: "ai_gtm",
        skillIds: ["discovery", "executive_selling"],
      },
      {
        day: 4,
        title: "Discovery on Your Own Product",
        lesson:
          "Point the discovery lens inward. Map the Reefly user workflow your product intervenes in — trigger, information, reasoning, decision, action, outcome.",
        deliverable: "Reefly Workflow Map #001",
        category: "reefly",
        skillIds: ["customer_discovery", "product"],
      },
      {
        day: 5,
        title: "Publish a Discovery Lesson",
        lesson:
          "Extract one thing you learned about discovery this week and turn it into a short TFE post. Real experience, not generic advice.",
        deliverable: "TFE Post #001",
        category: "tfe",
        skillIds: ["writing", "storytelling"],
      },
    ],
  },
  {
    week: 3,
    title: "AI Architecture Fundamentals",
    theme: "Design AI systems that survive contact with enterprise reality.",
    days: [
      {
        day: 1,
        title: "Decompose an AI System Into Components",
        lesson:
          "Every enterprise AI system is the same skeleton: data sources, retrieval, model, orchestration, guardrails, UX. Learn to draw that skeleton for any use case in under 15 minutes.",
        deliverable: "AI System Diagram #001",
        category: "ai_gtm",
        skillIds: ["ai_architecture"],
      },
      {
        day: 2,
        title: "Model Selection Without Benchmark Chasing",
        lesson:
          "Frontier API vs. open weights vs. small fine-tuned model — the choice is data gravity, latency, cost, and eval results on YOUR task. Build a decision frame you can defend to a CIO.",
        deliverable: "Model Selection Memo #001",
        category: "ai_gtm",
        skillIds: ["ai_architecture", "executive_selling"],
      },
      {
        day: 3,
        title: "Structured + Unstructured Data Together",
        lesson:
          "Real enterprise answers live across databases, docs, and APIs. Design how structured queries and retrieval combine in one system.",
        deliverable: "Hybrid Data Design #001",
        category: "ai_gtm",
        skillIds: ["ai_architecture", "rag"],
      },
      {
        day: 4,
        title: "Whiteboard With a Real Customer",
        lesson:
          "Take a live use case and whiteboard the full architecture in the room. Make it concrete enough that security and data questions surface early.",
        deliverable: "Customer Architecture Whiteboard #001",
        category: "ai_gtm",
        skillIds: ["ai_architecture", "discovery"],
      },
      {
        day: 5,
        title: "The One-Page Architecture Brief",
        lesson:
          "Compress the week's architecture into a single page an executive can read in three minutes: problem, diagram, data needs, risks, pilot path.",
        deliverable: "Architecture Brief #001",
        category: "ai_gtm",
        skillIds: ["ai_architecture", "executive_communication"],
      },
    ],
  },
  {
    week: 4,
    title: "Agents, RAG & Tool Use",
    theme: "When a workflow needs an agent — and when it absolutely doesn't.",
    days: [
      {
        day: 1,
        title: "Agent vs. Automation vs. Assistant",
        lesson:
          "Define the spectrum: deterministic automation, LLM assistant, tool-using agent. Place use cases on it based on variance tolerance and reversibility.",
        deliverable: "Agent Fit Assessment #001",
        category: "ai_gtm",
        skillIds: ["agents", "ai_architecture"],
      },
      {
        day: 2,
        title: "Design a Tool-Using Agent",
        lesson:
          "Tools, memory, orchestration, stopping conditions. Sketch a single-agent design for a real workflow with explicit failure modes and a kill switch.",
        deliverable: "Agent Design Doc #001",
        category: "ai_gtm",
        skillIds: ["agents", "governance"],
      },
      {
        day: 3,
        title: "Permissions-Aware Retrieval",
        lesson:
          "Enterprise RAG must respect document-level ACLs. Learn the patterns for trimming retrieval by user permissions — the first question every security team asks.",
        deliverable: "Permissions Model #001",
        category: "ai_gtm",
        skillIds: ["rag", "security"],
      },
      {
        day: 4,
        title: "Evaluate Answer Quality Honestly",
        lesson:
          "Build a small eval set from real questions. Measure groundedness and citation accuracy before anyone else does. Evals are what separate demos from systems.",
        deliverable: "Eval Set #001",
        category: "ai_gtm",
        skillIds: ["rag", "pocs"],
      },
      {
        day: 5,
        title: "Demo the Agent & Harvest Objections",
        lesson:
          "Show a working prototype to a real stakeholder. The goal is not to impress — it's to collect every objection about trust, control, and accuracy.",
        deliverable: "Objection Log #001",
        category: "ai_gtm",
        skillIds: ["agents", "executive_selling"],
      },
    ],
  },
  {
    week: 5,
    title: "Evaluation, Security, Governance & Accountability",
    theme: "What is the lowest level of AI autonomy that creates meaningful business value?",
    days: [
      {
        day: 1,
        title: "The Accountability Chain",
        lesson:
          "Workflow → Owner → Permissions → Human Approval → Evidence → Metric → Scale Decision. Map this chain for one real deployment: business owner, system owner, data owner, security reviewer, human approver.",
        deliverable: "Accountability Map #001",
        category: "ai_gtm",
        skillIds: ["governance"],
      },
      {
        day: 2,
        title: "Answer the Top 10 Security Questions",
        lesson:
          "Data retention, training usage, tenant isolation, encryption, PII, logging, agent identity, delegated authority. Write crisp, honest answers before the CISO asks.",
        deliverable: "Security FAQ #001",
        category: "ai_gtm",
        skillIds: ["security", "executive_communication"],
      },
      {
        day: 3,
        title: "Design the Audit Trail",
        lesson:
          "Every AI decision should be reconstructable: inputs, model version, output, human override. Spec the observability and audit logging that makes that true.",
        deliverable: "Audit Spec #001",
        category: "ai_gtm",
        skillIds: ["governance", "security"],
      },
      {
        day: 4,
        title: "Handle a Live Governance Objection",
        lesson:
          "Convert a real data-access or accountability objection into a governance conversation that moves the deal forward. Data-access concerns are really accountability questions.",
        deliverable: "Objection Handling Notes #001",
        category: "ai_gtm",
        skillIds: ["governance", "executive_selling"],
      },
      {
        day: 5,
        title: "Autonomy Tiers as a Sales Asset",
        lesson:
          "Codify which actions AI can take alone, which need approval, and which are never automated. Package it so governance becomes the reason they buy, not wait.",
        deliverable: "Autonomy Policy #001",
        category: "ai_gtm",
        skillIds: ["governance", "ai_architecture"],
      },
    ],
  },
  {
    week: 6,
    title: "POC → Production Implementation",
    theme: "POCs that answer business questions, and implementations that actually ship.",
    days: [
      {
        day: 1,
        title: "The POC Charter",
        lesson:
          "Every POC needs: hypothesis, workflow, scope, baseline, success metric, evaluation criteria, timeline, stakeholders, risks, production path. Write one for a real opportunity.",
        deliverable: "POC Charter #001",
        category: "ai_gtm",
        skillIds: ["pocs", "roi_business_cases"],
      },
      {
        day: 2,
        title: "Scope the Smallest Real POC",
        lesson:
          "Cut scope until the POC runs in weeks, not quarters — while still touching real data and real users. A POC without written success criteria is a slow no.",
        deliverable: "POC Scope Doc #001",
        category: "ai_gtm",
        skillIds: ["pocs", "ai_architecture"],
      },
      {
        day: 3,
        title: "Production Readiness Checklist",
        lesson:
          "Monitoring, fallbacks, drift, ownership, SLAs, failure handling, rollback. Your expertise must not end when the demo works — build the checklist that separates demos from deployments.",
        deliverable: "Production Checklist #001",
        category: "ai_gtm",
        skillIds: ["implementation"],
      },
      {
        day: 4,
        title: "Adoption & Change Management",
        lesson:
          "Deployment without adoption is shelfware. Design the enablement, champion motion, and human-in-the-loop rollout for wave one.",
        deliverable: "Adoption Plan #001",
        category: "ai_gtm",
        skillIds: ["implementation", "executive_selling"],
      },
      {
        day: 5,
        title: "The POC Readout That Converts",
        lesson:
          "The readout is a sales meeting: results vs. charter, production architecture, cost, rollout plan, decision ask. Structure it and deliver it.",
        deliverable: "POC Readout Deck #001",
        category: "ai_gtm",
        skillIds: ["pocs", "roi_business_cases", "executive_selling"],
      },
    ],
  },
  {
    week: 7,
    title: "Enterprise AI Selling & Executive Communication",
    theme: "Explain complicated technology simply — to nine different audiences.",
    days: [
      {
        day: 1,
        title: "The Three-Minute Business Value Story",
        lesson:
          "Problem, cost, intervention, payoff — no architecture diagrams. Deliver it out loud until it sounds inevitable.",
        deliverable: "Value Story Script #001",
        category: "ai_gtm",
        skillIds: ["executive_selling", "executive_communication"],
      },
      {
        day: 2,
        title: "Nine Audiences, Nine Conversations",
        lesson:
          "Engineers, architects, security, data teams, product leaders, sales leaders, CIOs, CTOs, CEOs. Write what each one needs to hear about the same system.",
        deliverable: "Audience Matrix #001",
        category: "ai_gtm",
        skillIds: ["executive_communication"],
      },
      {
        day: 3,
        title: "Multi-Thread the Account",
        lesson:
          "Champion, economic buyer, security, end users. Map the stakeholders of a real deal and the story each one needs.",
        deliverable: "Stakeholder Map #001",
        category: "ai_gtm",
        skillIds: ["executive_selling", "discovery"],
      },
      {
        day: 4,
        title: "Run an Executive Meeting",
        lesson:
          "Open with their metric, not your product. Run a real executive conversation and leave with a dated next step.",
        deliverable: "Executive Meeting Notes #001",
        category: "ai_gtm",
        skillIds: ["executive_selling"],
      },
      {
        day: 5,
        title: "Defend the ROI Model Under Fire",
        lesson:
          "Have someone attack your assumptions. Concede the weak ones without losing the deal. Baseline cost, expected improvement, adoption curve, fully-loaded AI cost.",
        deliverable: "Battle-Tested ROI Model #001",
        category: "ai_gtm",
        skillIds: ["roi_business_cases", "executive_selling"],
      },
    ],
  },
  {
    week: 8,
    title: "Reusable AI Solution Playbooks",
    theme: "Turn one-off deals into repeatable assets.",
    days: [
      {
        day: 1,
        title: "Extract Your First Playbook",
        lesson:
          "Take the best discovery-to-POC motion you've run and write it as a repeatable playbook: when to use, steps, artifacts, pitfalls.",
        deliverable: "Playbook #001",
        category: "ai_gtm",
        skillIds: ["implementation", "writing"],
      },
      {
        day: 2,
        title: "The Trust Kit",
        lesson:
          "Package your security, governance, and compliance answers into a reusable kit that speeds up every future deal.",
        deliverable: "Trust Kit v1",
        category: "ai_gtm",
        skillIds: ["security", "governance"],
      },
      {
        day: 3,
        title: "The Discovery Template Library",
        lesson:
          "Turn your best discovery questions, workflow maps, and scorecards into templates you can reuse in minutes instead of hours.",
        deliverable: "Discovery Template Pack",
        category: "ai_gtm",
        skillIds: ["discovery"],
      },
      {
        day: 4,
        title: "Teach It to Someone Else",
        lesson:
          "The test of a playbook is whether someone else can run it. Walk a colleague or founder through one and note where it breaks.",
        deliverable: "Playbook Test Notes #001",
        category: "ai_gtm",
        skillIds: ["leadership", "executive_communication"],
      },
      {
        day: 5,
        title: "Publish the Playbook Thesis",
        lesson:
          "Turn the idea of repeatable AI solution playbooks into a TFE post. This is the reputation you want: someone who knows how companies actually buy and implement AI.",
        deliverable: "TFE Post #002",
        category: "tfe",
        skillIds: ["writing", "storytelling"],
      },
    ],
  },
  {
    week: 9,
    title: "TFE Distribution & Personal Brand",
    theme: "Ideas from real experience, spread through a real network.",
    days: [
      {
        day: 1,
        title: "Define Your Public Thesis",
        lesson:
          "One sentence: what do you understand that most people don't? Draft the thesis your reputation compounds around — how companies actually buy, implement, and create value from AI.",
        deliverable: "Public Thesis #001",
        category: "tfe",
        skillIds: ["storytelling", "writing"],
      },
      {
        day: 2,
        title: "The Content Engine",
        lesson:
          "Design a sustainable system: real work → lesson → draft → publish → distribute. No generic AI-influencer volume. Useful ideas only.",
        deliverable: "Content System #001",
        category: "tfe",
        skillIds: ["writing", "audience"],
      },
      {
        day: 3,
        title: "Ten Meaningful Conversations",
        lesson:
          "Reach out to ten founders, operators, or investors with something specific and useful. Relationships, not follower counts.",
        deliverable: "Outreach Log #001",
        category: "tfe",
        skillIds: ["networking"],
      },
      {
        day: 4,
        title: "Design the First TFE Event",
        lesson:
          "Dinner, AMA, or small summit. Format, guest list, venue, date. Events convert a loose network into a community.",
        deliverable: "Event Plan #001",
        category: "tfe",
        skillIds: ["events", "community"],
      },
      {
        day: 5,
        title: "One Partnership Conversation",
        lesson:
          "Identify one organization or creator whose audience overlaps yours and open a concrete partnership conversation.",
        deliverable: "Partnership Outreach #001",
        category: "tfe",
        skillIds: ["partnerships"],
      },
    ],
  },
  {
    week: 10,
    title: "Reefly Customer & Market Discovery",
    theme: "Reefly is the founder laboratory. Outcomes over hours.",
    days: [
      {
        day: 1,
        title: "Five Real User Conversations",
        lesson:
          "Five Reefly users or prospects. Ask about their reef-keeping workflow, not your features. What triggers them to check, what decisions do they make, what does failure cost?",
        deliverable: "User Interview Notes #001",
        category: "reefly",
        skillIds: ["customer_discovery"],
      },
      {
        day: 2,
        title: "Map the Activation Funnel",
        lesson:
          "From signup to first value: where do users drop? Instrument it, name the number, pick the single highest-friction step.",
        deliverable: "Activation Funnel Map #001",
        category: "reefly",
        skillIds: ["growth", "product"],
      },
      {
        day: 3,
        title: "Ship What Users Asked For",
        lesson:
          "Take the most-requested thing from this week's interviews and ship the smallest real version. Interview → ship → close the loop.",
        deliverable: "User-Requested Improvement #001",
        category: "reefly",
        skillIds: ["product", "retention"],
      },
      {
        day: 4,
        title: "Map the Reef-Keeping Market",
        lesson:
          "Stores, hobbyists, influencers, communities, competitors. Where does Reefly's distribution actually come from?",
        deliverable: "Market Map #001",
        category: "reefly",
        skillIds: ["growth", "partnerships"],
      },
      {
        day: 5,
        title: "Close the Loop Publicly",
        lesson:
          "Tell users what you shipped because of their feedback. Then turn the interview-to-ship loop into a TFE post about building Reefly.",
        deliverable: "Loop-Closed Note + TFE Post",
        category: "reefly",
        skillIds: ["retention", "writing"],
      },
    ],
  },
  {
    week: 11,
    title: "Reefly Growth, Pricing & Unit Economics",
    theme: "Train yourself to think like a founder, not a developer.",
    days: [
      {
        day: 1,
        title: "The Growth Loop Sketch",
        lesson:
          "Acquisition, activation, retention, referral. Sketch Reefly's loop and pick the single metric that matters this quarter.",
        deliverable: "Growth Loop Sketch #001",
        category: "reefly",
        skillIds: ["growth"],
      },
      {
        day: 2,
        title: "Design the Referral Mechanic",
        lesson:
          "Reef keeping is inherently social — people show off their tanks. Design the mechanic that makes inviting friends natural.",
        deliverable: "Referral Design #001",
        category: "reefly",
        skillIds: ["growth", "product"],
      },
      {
        day: 3,
        title: "Price It",
        lesson:
          "Draft Reefly's pricing: free tier boundary, paid value metric, price point. Charge for outcomes, not features.",
        deliverable: "Pricing Proposal #001",
        category: "reefly",
        skillIds: ["monetization", "sales"],
      },
      {
        day: 4,
        title: "Sign One Store or Partner",
        lesson:
          "Local fish stores are distribution. Pitch one store on a partnership — their customers are exactly your users.",
        deliverable: "Store Partnership Pitch #001",
        category: "reefly",
        skillIds: ["partnerships", "sales"],
      },
      {
        day: 5,
        title: "The Unit Economics One-Pager",
        lesson:
          "CAC estimate, conversion, churn assumption, LTV, path to $1k MRR and beyond. One page, honest numbers.",
        deliverable: "Unit Economics One-Pager #001",
        category: "reefly",
        skillIds: ["finance", "monetization"],
      },
    ],
  },
  {
    week: 12,
    title: "Integration & Personal Operating System",
    theme: "Fuse the three pillars into one compounding system.",
    days: [
      {
        day: 1,
        title: "The Flywheel Audit",
        lesson:
          "Career → expertise → TFE → distribution → Reefly → founder judgment → better AI advisor. Map where your flywheel is strong and where it's broken.",
        deliverable: "Flywheel Audit #001",
        category: "ai_gtm",
        skillIds: ["leadership", "operations"],
      },
      {
        day: 2,
        title: "Your Weekly Operating Rhythm",
        lesson:
          "Design the fixed weekly cadence: discovery reps, shipping, publishing, conversations, review. A system beats motivation.",
        deliverable: "Operating Rhythm #001",
        category: "reefly",
        skillIds: ["operations", "leadership"],
      },
      {
        day: 3,
        title: "The Evidence Scoreboard",
        lesson:
          "Define the proof points that matter for Season 2: workflows mapped, POCs run, POCs to production, executive conversations, posts, events, Reefly users, MRR.",
        deliverable: "Evidence Scoreboard v1",
        category: "ai_gtm",
        skillIds: ["operations", "roi_business_cases"],
      },
      {
        day: 4,
        title: "Season 1 Retrospective",
        lesson:
          "Score yourself honestly across all skill trees. Which two skills grew most? Which two stalled? What did you ship, publish, and learn that exists in the world now?",
        deliverable: "Season 1 Retro #001",
        category: "ai_gtm",
        skillIds: ["leadership", "writing"],
      },
      {
        day: 5,
        title: "Design Season 2",
        lesson:
          "Build the next 12-week campaign around your two weakest skills and the biggest business opportunity in front of you.",
        deliverable: "Season 2 Campaign Plan",
        category: "ai_gtm",
        skillIds: ["leadership", "roi_business_cases"],
      },
    ],
  },
];

/** All known weeks: static Season 1 curriculum + generated weeks. */
export function allWeeks(customWeeks: CurriculumWeek[] = []): CurriculumWeek[] {
  return [...CURRICULUM, ...customWeeks].sort((a, b) => a.week - b.week);
}

export function getCurriculumDay(
  week: number,
  day: number,
  weeks: CurriculumWeek[] = CURRICULUM,
): { week: CurriculumWeek; day: CurriculumWeek["days"][number] } | null {
  const w = weeks.find((c) => c.week === week);
  if (!w) return null;
  const d = w.days.find((dd) => dd.day === day);
  if (!d) return null;
  return { week: w, day: d };
}

export function nextCampaignCursor(
  week: number,
  day: number,
  weeks: CurriculumWeek[] = CURRICULUM,
): { week: number; day: number } {
  const w = weeks.find((c) => c.week === week);
  if (w && day < w.days.length) return { week, day: day + 1 };
  // Roll into the next week — if it doesn't exist yet, the quest engine
  // generates it on demand (self-learning campaign).
  return { week: week + 1, day: 1 };
}
