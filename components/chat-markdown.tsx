import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+?\*\*|`[^`]+`|\*[^*\n]+?\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={i++} className="font-semibold text-zinc-50">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={i++}
          className="rounded bg-ink-800 px-1 py-0.5 font-mono text-[12px] text-zinc-200"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(
        <em key={i++} className="italic text-zinc-200">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function isBullet(line: string): boolean {
  return /^\s*(?:[-•]|\d+\.)\s+/.test(line);
}

export function ChatMarkdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);

  return (
    <div className={cn("space-y-2.5 text-sm leading-relaxed text-zinc-200", className)}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        if (lines.every((l) => isBullet(l) || !l.trim())) {
          return (
            <ul key={bi} className="space-y-1 pl-0.5">
              {lines
                .filter((l) => l.trim())
                .map((l, li) => (
                  <li key={li} className="flex gap-2">
                    <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-xp/80" />
                    <span>{inline(l.replace(/^\s*(?:[-•]|\d+\.)\s+/, ""))}</span>
                  </li>
                ))}
            </ul>
          );
        }

        const first = lines[0] ?? "";
        const heading =
          first.match(/^\s*#{1,3}\s+(.+)$/) ??
          first.match(/^\s*\*\*(.+?)\*\*\s*$/);
        if (heading) {
          const label = heading[1].replace(/\*+/g, "").trim();
          const rest = lines.slice(1).join("\n").trim();
          return (
            <div key={bi} className="space-y-1.5">
              <div className="pt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-xp/90">
                {label}
              </div>
              {rest ? <p className="whitespace-pre-wrap">{inline(rest)}</p> : null}
            </div>
          );
        }

        return (
          <p key={bi} className="whitespace-pre-wrap">
            {lines.map((line, li) => (
              <span key={li}>
                {li > 0 && <br />}
                {inline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
