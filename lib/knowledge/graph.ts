import { promises as fs, readFileSync } from "fs";
import path from "path";
import { getManualSituation } from "../config";
import { dateKey } from "../store/types";
import {
  emptyGraph,
  factsFromDatedText,
  factsFromMemory,
  mergeFacts,
  type KnowledgeFact,
  type KnowledgeGraph,
} from "./facts";

export type { DayMode, KnowledgeFact, KnowledgeGraph } from "./facts";
export {
  factsOn,
  modeOn,
  objectOn,
  renderSituation,
} from "./facts";

const HERMES_DIR =
  process.env.OPERATOR_HERMES_DIR ||
  "/Users/aruntdengine/hermes-agent/workspace";

const DATA_DIR = process.env.OPERATOR_DATA_DIR || path.join(process.cwd(), ".data");
const GRAPH_FILE = path.join(DATA_DIR, "knowledge.json");

const CACHE_MS = 15_000;
const MAX_FACTS = 400;

let cache: { at: number; value: KnowledgeGraph } | null = null;

export function invalidateKnowledgeCache(): void {
  cache = null;
}

function noon(day: string): string {
  return `${day}T12:00:00.000Z`;
}

async function readText(file: string): Promise<string> {
  try {
    return (await fs.readFile(file, "utf-8")).trim();
  } catch {
    return "";
  }
}

function readGraph(): KnowledgeGraph {
  try {
    const parsed = JSON.parse(readFileSync(GRAPH_FILE, "utf-8")) as KnowledgeGraph;
    if (!Array.isArray(parsed.facts)) return emptyGraph();
    return parsed;
  } catch {
    return emptyGraph();
  }
}

async function writeGraph(graph: KnowledgeGraph): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${GRAPH_FILE}.tmp-${process.pid}`;
  await fs.writeFile(tmp, JSON.stringify(graph, null, 2));
  await fs.rename(tmp, GRAPH_FILE);
}

function trimFacts(facts: KnowledgeFact[]): KnowledgeFact[] {
  if (facts.length <= MAX_FACTS) return facts;
  return [...facts]
    .sort((a, b) => b.validFrom.localeCompare(a.validFrom))
    .slice(0, MAX_FACTS);
}

async function collect(now: Date): Promise<{ facts: KnowledgeFact[]; scanned: Set<string> }> {
  const facts: KnowledgeFact[] = [];
  const scanned = new Set<string>();
  const memoryDir = path.join(HERMES_DIR, "memory");

  const standing = await readText(path.join(memoryDir, "SITUATION.md"));
  const updated = standing.match(/Updated:\s*(\d{4}-\d{2}-\d{2})/)?.[1];
  if (updated) {
    const source = `hermes:situation:${updated}`;
    scanned.add(source);
    facts.push(...factsFromDatedText(standing, updated, updated, source, noon(updated)));
  }

  for (let i = 0; i < 21; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const day = dateKey(d);
    const source = `hermes:log:${day}`;
    scanned.add(source);
    const body = await readText(path.join(memoryDir, `${day}.md`));
    if (!body) continue;
    facts.push(...factsFromDatedText(body, day, day, source, noon(day)));
  }

  const memory = await readText(path.join(HERMES_DIR, "MEMORY.md"));
  const memoryFacts = factsFromMemory(memory, noon);
  for (const fact of memoryFacts) scanned.add(fact.source);
  facts.push(...memoryFacts);

  try {
    const names = await fs.readdir(memoryDir);
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 45);
    const cutoffKey = dateKey(cutoff);
    for (const name of names) {
      const match = name.match(/^notes-(\d{4}-\d{2}-\d{2})-.+\.md$/);
      if (!match || match[1] < cutoffKey) continue;
      const day = match[1];
      const source = `hermes:note:${name}`;
      scanned.add(source);
      const body = await readText(path.join(memoryDir, name));
      if (!body) continue;
      facts.push(...factsFromDatedText(body, day, day, source, noon(day)));
    }
  } catch {
    /* no memory dir */
  }

  const manual = getManualSituation();
  scanned.add("operator:settings");
  if (manual.text && manual.at) {
    const day = dateKey(new Date(manual.at));
    facts.push(
      ...factsFromDatedText(manual.text, day, day, "operator:settings", manual.at),
    );
  }

  return { facts, scanned };
}

/** Re-read dated sources and fold them into the graph. Old dates stay history. */
export async function refreshKnowledge(now = new Date()): Promise<KnowledgeGraph> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;

  const prev = readGraph();
  const { facts: incoming, scanned } = await collect(now);
  const facts = trimFacts(mergeFacts(prev.facts, incoming, scanned));
  const changed = JSON.stringify(facts) !== JSON.stringify(prev.facts);
  const graph: KnowledgeGraph = {
    facts,
    updatedAt: changed || !prev.updatedAt ? now.toISOString() : prev.updatedAt,
  };
  if (changed) await writeGraph(graph);
  cache = { at: Date.now(), value: graph };
  return graph;
}
