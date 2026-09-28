import { Waypoints } from "lucide-react";
import { Badge, Card, CardHeader } from "@/components/ui";
import { factsOn, modeOn, refreshKnowledge, type KnowledgeFact } from "@/lib/knowledge/graph";
import { dateKey } from "@/lib/store/types";

function groupFacts(facts: KnowledgeFact[]) {
  const rows: { fact: KnowledgeFact; sources: string[] }[] = [];
  for (const fact of facts) {
    const row = rows.find(
      (r) =>
        r.fact.predicate === fact.predicate &&
        r.fact.object === fact.object &&
        r.fact.validFrom === fact.validFrom &&
        r.fact.validUntil === fact.validUntil,
    );
    if (row) row.sources.push(fact.source);
    else rows.push({ fact, sources: [fact.source] });
  }
  return rows;
}

export const dynamic = "force-dynamic";

export default async function GraphPage() {
  const today = dateKey(new Date());
  const graph = await refreshKnowledge();
  const todayFacts = groupFacts(factsOn(graph, today));
  const history = groupFacts(
    [...graph.facts].sort(
      (a, b) => b.validFrom.localeCompare(a.validFrom) || a.predicate.localeCompare(b.predicate),
    ),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Knowledge</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Facts are dated. Today is {today}, mode {modeOn(graph, today)}. A conference
          observed on an earlier date stays on that date. Today changes when a new
          observation lands: Hermes log, a dated memory line, or Settings.
        </p>
      </div>

      <Card>
        <CardHeader title="Valid today" icon={<Waypoints size={14} className="text-xp" />} />
        <div className="space-y-2 px-5 pb-5 pt-2">
          {todayFacts.length === 0 && (
            <p className="text-sm text-zinc-400">No fact covers today. Desk day.</p>
          )}
          {todayFacts.map(({ fact, sources }) => (
            <div
              key={fact.id}
              className="rounded-lg border border-ink-800 bg-ink-850/40 px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <Badge className="text-xp">{fact.predicate}</Badge>
                <span className="text-[11px] text-zinc-500">{fact.validFrom}</span>
              </div>
              <p className="mt-1.5 text-sm text-zinc-100">{fact.object}</p>
              <p className="mt-1 text-[11px] text-zinc-500">{sources.join(" · ")}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Graph" />
        <div className="space-y-2 px-5 pb-5 pt-2">
          {history.length === 0 && (
            <p className="text-sm text-zinc-400">Nothing learned yet.</p>
          )}
          {history.map(({ fact, sources }) => {
            const current = fact.validFrom <= today && fact.validUntil >= today;
            return (
              <div
                key={fact.id}
                className="flex flex-col gap-1 border-b border-ink-800/80 py-2 last:border-0 sm:flex-row sm:items-baseline sm:gap-3"
              >
                <div className="w-28 shrink-0 text-[12px] text-zinc-500">
                  {fact.validFrom}
                  {fact.validUntil !== fact.validFrom ? ` – ${fact.validUntil}` : ""}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] font-medium text-zinc-300">{fact.predicate}</span>
                  <span className="text-sm text-zinc-100"> {fact.object}</span>
                  <div className="text-[11px] text-zinc-600">{sources.join(" · ")}</div>
                </div>
                <Badge className={current ? "text-xp" : "text-zinc-500"}>
                  {current ? "today" : "past"}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
