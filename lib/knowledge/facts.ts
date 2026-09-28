// Dated facts. A conference observed on 2026-09-23 is true that day only.
// Today changes when a new observation is dated today.

export type DayMode = "conference" | "travel" | "normal";

export type FactPredicate = "mode" | "at" | "focus";

export interface KnowledgeFact {
  id: string;
  subject: string;
  predicate: FactPredicate;
  object: string;
  validFrom: string;
  validUntil: string;
  observedAt: string;
  source: string;
}

export interface KnowledgeGraph {
  facts: KnowledgeFact[];
  updatedAt: string;
}

const CONFERENCE =
  /conference|booth|\bicc\b|ignition community|on.?site|expo hall|trade show|on the floor|at the show/i;
const TRAVEL = /airport|\bhotel\b|traveling|on the road|in transit|away from home/i;

export function emptyGraph(): KnowledgeGraph {
  return { facts: [], updatedAt: "" };
}

export function factId(
  source: string,
  predicate: string,
  validFrom: string,
  validUntil: string,
): string {
  return `${source}|${predicate}|${validFrom}|${validUntil}`;
}

function makeFact(
  predicate: FactPredicate,
  object: string,
  validFrom: string,
  validUntil: string,
  source: string,
  observedAt: string,
): KnowledgeFact {
  return {
    id: factId(source, predicate, validFrom, validUntil),
    subject: "arun",
    predicate,
    object,
    validFrom,
    validUntil,
    observedAt,
    source,
  };
}

/** Pull mode / place / focus from text that is already known to belong to a date. */
export function factsFromDatedText(
  text: string,
  validFrom: string,
  validUntil: string,
  source: string,
  observedAt: string,
): KnowledgeFact[] {
  const conference = CONFERENCE.test(text);
  const travel = !conference && TRAVEL.test(text);
  if (!conference && !travel) return [];

  if (conference) {
    const facts = [
      makeFact("mode", "conference", validFrom, validUntil, source, observedAt),
      makeFact(
        "focus",
        "Demos, names, and one public extract. Inbox and founder homework wait until home.",
        validFrom,
        validUntil,
        source,
        observedAt,
      ),
    ];
    const at = /ignition community|\bicc\b/i.test(text)
      ? "Ignition Community Conference"
      : /booth/i.test(text)
        ? "booth"
        : "";
    if (at) facts.push(makeFact("at", at, validFrom, validUntil, source, observedAt));
    return facts;
  }

  return [
    makeFact("mode", "travel", validFrom, validUntil, source, observedAt),
    makeFact(
      "focus",
      "One real conversation and one written extract. Not a full desk day.",
      validFrom,
      validUntil,
      source,
      observedAt,
    ),
  ];
}

/** Dated memory lines only. Undated prose never becomes a current fact. */
export function factsFromMemory(memory: string, observedAtFor: (day: string) => string): KnowledgeFact[] {
  const facts: KnowledgeFact[] = [];
  for (const line of memory.split("\n")) {
    const match = line.match(/(\d{4}-\d{2}-\d{2})\s*:\s*(.+)/);
    if (!match) continue;
    const day = match[1];
    facts.push(...factsFromDatedText(match[2], day, day, `hermes:memory:${day}`, observedAtFor(day)));
  }
  return facts;
}

export function mergeFacts(
  prev: KnowledgeFact[],
  incoming: KnowledgeFact[],
  scanned: Set<string>,
): KnowledgeFact[] {
  const byId = new Map<string, KnowledgeFact>();
  for (const fact of prev) {
    if (scanned.has(fact.source)) continue;
    byId.set(fact.id, fact);
  }
  for (const fact of incoming) byId.set(fact.id, fact);
  return [...byId.values()].sort(
    (a, b) => b.validFrom.localeCompare(a.validFrom) || a.predicate.localeCompare(b.predicate),
  );
}

export function factsOn(graph: KnowledgeGraph, day: string): KnowledgeFact[] {
  return graph.facts.filter((f) => f.validFrom <= day && f.validUntil >= day);
}

function newest(facts: KnowledgeFact[]): KnowledgeFact | null {
  if (!facts.length) return null;
  return [...facts].sort(
    (a, b) => b.observedAt.localeCompare(a.observedAt) || b.source.localeCompare(a.source),
  )[0];
}

export function modeOn(graph: KnowledgeGraph, day: string): DayMode {
  const fact = newest(factsOn(graph, day).filter((f) => f.predicate === "mode"));
  if (fact?.object === "conference" || fact?.object === "travel") return fact.object;
  return "normal";
}

export function objectOn(graph: KnowledgeGraph, day: string, predicate: FactPredicate): string {
  return newest(factsOn(graph, day).filter((f) => f.predicate === predicate))?.object ?? "";
}

export function renderSituation(graph: KnowledgeGraph, today: string): string {
  const lines = [`Today ${today}`];
  const todayFacts = factsOn(graph, today);
  if (!todayFacts.length) {
    lines.push("No dated fact covers today. Desk day.");
  } else {
    const seen = new Set<string>();
    for (const fact of todayFacts) {
      const key = `${fact.predicate}:${fact.object}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const sources = todayFacts
        .filter((f) => f.predicate === fact.predicate && f.object === fact.object)
        .map((f) => f.source);
      lines.push(`- ${fact.predicate}: ${fact.object} (${sources.join(", ")})`);
    }
  }

  const history = graph.facts
    .filter((f) => f.predicate === "mode" && f.validUntil < today)
    .sort((a, b) => b.validFrom.localeCompare(a.validFrom))
    .slice(0, 8);
  if (history.length) {
    lines.push("", "History (does not set today)");
    for (const fact of history) {
      lines.push(`- ${fact.validFrom}: ${fact.object} (${fact.source})`);
    }
  }
  return lines.join("\n");
}
