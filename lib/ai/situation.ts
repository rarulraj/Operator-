import type { AppState } from "../types";
import { dateKey } from "../store/types";
import {
  invalidateKnowledgeCache,
  modeOn,
  objectOn,
  refreshKnowledge,
  renderSituation,
  type DayMode,
} from "../knowledge/graph";

// ── Live situation ──────────────────────────────────────────────────────────
// The knowledge graph is the source of truth. A fact applies only on the
// dates it was observed. An old conference line does not set today.

export type SituationMode = DayMode;

export interface Situation {
  text: string;
  mode: SituationMode;
  /** What today is for, when the graph has a focus fact. */
  focus: string;
  sources: string[];
}

const CACHE_MS = 15_000;

let cache: { at: number; value: Situation } | null = null;

export function invalidateSituationCache(): void {
  cache = null;
  invalidateKnowledgeCache();
}

export async function loadSituation(_state?: AppState): Promise<Situation> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;

  const today = dateKey(new Date());
  const graph = await refreshKnowledge();
  const todayFacts = graph.facts.filter((f) => f.validFrom <= today && f.validUntil >= today);
  const value: Situation = {
    text: renderSituation(graph, today),
    mode: modeOn(graph, today),
    focus: objectOn(graph, today, "focus"),
    sources: [...new Set(todayFacts.map((f) => f.source))],
  };
  cache = { at: Date.now(), value };
  return value;
}

export function situationPromptBlock(situation: Situation): string {
  if (!situation.text.trim()) return "";
  return `

---
KNOWLEDGE GRAPH (dated facts). Only lines under "Today" set the day.
History is context. An old conference date does not make today a booth day.
If today is conference or travel, coach that day: demos, names, one public
extract. Do not assign founder-day homework or inbox-clearing as the main
quest. If today has no covering fact, it is a desk day.
${situation.text}`;
}

export function questMismatchesSituation(
  quest: { title: string; description: string; tasks: { title: string }[] },
  situation: Situation,
): boolean {
  const blob = `${quest.title} ${quest.description} ${quest.tasks.map((t) => t.title).join(" ")}`;
  const looksConference = /conference|booth|icc|ignition|on.?site|on the floor|floor|prospect/i.test(
    blob,
  );
  const looksTravel = /on the road|traveling|hotel|airport/i.test(blob);
  if (situation.mode === "conference") {
    if (!looksConference) return true;
    const floor =
      /booth|demo|conversation|linkedin|extract|on the floor|journal the day/i;
    return quest.tasks.some((t) => !floor.test(t.title));
  }
  if (situation.mode === "travel") return !looksTravel;
  return looksConference || looksTravel;
}
