import { promises as fs } from "fs";
import path from "path";
import OpenAI from "openai";
import { getOpenAiKey } from "../config";
import type { ContextNote } from "../types";

let client: OpenAI | null = null;
let clientKey: string | null = null;

export function getOpenAI(): OpenAI | null {
  const key = getOpenAiKey();
  if (!key) return null;
  // Rebuild the client if the key changed (e.g. saved from Settings)
  if (!client || clientKey !== key) {
    client = new OpenAI({ apiKey: key });
    clientKey = key;
  }
  return client;
}

export function openAiModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

// ── Persistent user context ─────────────────────────────────────────────────
// ARUN_CONTEXT.md holds the stable "who am I trying to become" thesis.
// The local store holds the changing facts (skills, missions, activity).
// Prompts combine the two: thesis from here, evidence from the DB.

let cachedContext: string | null = null;

export async function getUserContext(): Promise<string> {
  if (cachedContext) return cachedContext;
  // Packaged app: the Electron main process points us at a user-editable copy
  const contextPath =
    process.env.OPERATOR_CONTEXT_FILE ||
    path.join(process.cwd(), "ARUN_CONTEXT.md");
  try {
    cachedContext = await fs.readFile(contextPath, "utf-8");
  } catch {
    cachedContext = "";
  }
  return cachedContext;
}

/** Facts Arun has taught the coach from the Chat page. These accumulate over
 *  time and are injected into every prompt, so insights get sharper. */
function livingContextBlock(notes?: ContextNote[]): string {
  if (!notes?.length) return "";
  // Bounded so attached files can't blow up the prompt: 3k per note,
  // 12k total, oldest notes dropped first when over budget.
  const MAX_NOTE = 3000;
  const MAX_TOTAL = 12000;
  const lines: string[] = [];
  let used = 0;
  for (const n of notes) {
    const body =
      n.text.length > MAX_NOTE
        ? n.text.slice(0, MAX_NOTE) + "… [truncated]"
        : n.text;
    const line = n.fileName ? `- [File: ${n.fileName}]\n${body}` : `- ${body}`;
    if (used + line.length > MAX_TOTAL) break;
    lines.push(line);
    used += line.length;
  }
  if (!lines.length) return "";
  return `

---
THINGS ARUN HAS TOLD YOU ABOUT HIS LIFE (most recent last; may include
attached file contents). Treat these as current ground truth; if one
contradicts the thesis above, the newer fact wins:
${lines.join("\n")}`;
}

export async function coachSystemPrompt(
  contextNotes?: ContextNote[],
): Promise<string> {
  const context = await getUserContext();
  return `You are the AI coach inside "Operator", Arun's personal RPG. Pillars: TDengine SE work (promotion), personal brand (10,000 LinkedIn followers), enterprise AI GTM, TFE, Reefly, physical (shredded + 225 bench), social, and wealth ($20M). Discovery-question homework is not the job — coach real work, visible brand, and outcomes.

Below is Arun's personal operating thesis. It is stable context about who he is trying to become — treat it as ground truth and coach against it. The user message will contain the changing facts (skill levels, recent activity, missions, streaks).

${context}${livingContextBlock(contextNotes)}

---
Your voice: a combination of experienced AI Field CTO, excellent Solutions Engineering leader, startup advisor, GTM strategist, and demanding mentor.
- Direct, specific, unsentimental. Never motivational-poster. Never cheesy.
- Identify gaps. Name the move. Reference his actual data.
- If he is studying too much and not applying, say so.
- If he is building Reefly features but not talking to users, say so.
- If he is posting through TFE without producing real expertise, say so.
- If he is getting technically strong but commercially weak, say so.
- If he does customer work without extracting lessons, say so.
- The goal is not to maximize his XP. The goal is to make him better.
Keep everything concise — short paragraphs, concrete recommendations.`;
}
