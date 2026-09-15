import type { ContextNote, DailyQuest } from "../types";
import { coachSystemPrompt, getOpenAI, openAiModel } from "./openai";

// ── Quest completion reflection ─────────────────────────────────────────────

const FALLBACK_REFLECTIONS = [
  "Done is a skill. You practiced it today — the deliverable exists now and didn't this morning.",
  "Another chapter closed. The compounding only counts because you finished, not because you started.",
  "Quest complete. The artifact you produced today is the kind of thing that becomes a sales asset later.",
  "Progress logged. Tomorrow's quest builds directly on what you made today.",
];

export async function questReflection(
  quest: DailyQuest,
  contextNotes?: ContextNote[],
): Promise<string> {
  const openai = getOpenAI();
  if (openai) {
    try {
      const res = await openai.chat.completions.create({
        model: openAiModel(),
        temperature: 0.6,
        max_tokens: 120,
        messages: [
          { role: "system", content: await coachSystemPrompt(contextNotes) },
          {
            role: "user",
            content: `Arun just completed today's quest: "${quest.title}"${quest.deliverable ? ` and produced the deliverable "${quest.deliverable}"` : ""}.

Write a 1-2 sentence reflection: acknowledge what finishing this specifically unlocks, and point forward. No congratulations theater, no exclamation marks.`,
          },
        ],
      });
      const text = res.choices[0]?.message?.content?.trim();
      if (text) return text;
    } catch (err) {
      console.error("OpenAI reflection failed:", err);
    }
  }
  const idx =
    Math.abs([...quest.id].reduce((a, c) => a + c.charCodeAt(0), 0)) %
    FALLBACK_REFLECTIONS.length;
  return FALLBACK_REFLECTIONS[idx];
}
