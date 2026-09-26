"use client";

import { Check, Copy, Globe, Smartphone } from "lucide-react";
import { useState } from "react";
import { Card, CardHeader } from "./ui";

function CopyRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard can fail in some embeds; the url is still visible */
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-ink-800 pt-2.5 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">
          {label}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-0.5 block truncate font-mono text-[13px] text-zinc-200 hover:text-xp"
        >
          {url}
        </a>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        className="shrink-0 rounded-md border border-ink-700 p-1.5 text-zinc-400 hover:bg-ink-800 hover:text-zinc-200"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check size={14} className="text-reef" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export function AccessCard({
  local,
  lan,
}: {
  local: string;
  lan: string[];
}) {
  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Open from anything"
        icon={<Globe size={14} className="text-zinc-500" />}
      />
      <div className="space-y-2.5 px-5 pb-5 pt-1 text-sm">
        <p className="leading-relaxed text-zinc-400">
          Leave Operator running (the dock icon is enough). Then open these in
          Safari, Chrome, your phone, or Add to Home Screen.
        </p>
        <CopyRow label="This Mac" url={local} />
        {lan.length > 0 ? (
          lan.map((url) => (
            <CopyRow key={url} label="Phone / other devices on this Wi-Fi" url={url} />
          ))
        ) : (
          <p className="border-t border-ink-800 pt-2.5 text-[13px] text-zinc-500">
            No LAN address yet. Connect to Wi-Fi and reopen Settings.
          </p>
        )}
        <div className="flex items-start gap-2 border-t border-ink-800 pt-2.5 text-[12px] leading-relaxed text-zinc-500">
          <Smartphone size={14} className="mt-0.5 shrink-0" />
          <span>
            On iPhone: same Wi-Fi → paste the LAN link → Share → Add to Home
            Screen. Anyone on this network can open it while Operator is running.
          </span>
        </div>
      </div>
    </Card>
  );
}
