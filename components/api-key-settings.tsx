"use client";

import { Brain, CheckCircle2, KeyRound, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { clearOpenAiKeyAction, saveOpenAiKeyAction } from "@/app/actions";
import { Badge, Button, Card, CardHeader } from "./ui";

export function ApiKeySettings({
  configured,
  source,
  masked,
}: {
  configured: boolean;
  source: "env" | "local" | null;
  masked: string | null;
}) {
  const [key, setKey] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function save() {
    setMessage(null);
    startTransition(async () => {
      const res = await saveOpenAiKeyAction(key);
      if (res.ok) {
        setKey("");
        setMessage({ ok: true, text: "Key verified and saved. The live coach is active." });
      } else {
        setMessage({ ok: false, text: res.error ?? "Failed to save key." });
      }
    });
  }

  function clear() {
    if (!window.confirm("Remove the saved OpenAI key? The coach falls back to the built-in engine.")) return;
    startTransition(() => clearOpenAiKeyAction());
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader title="AI Coach" icon={<Brain size={14} className="text-zinc-500" />} />
      <div className="space-y-3 px-5 pb-5 pt-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Status</span>
          {configured ? (
            <Badge className="text-reef">
              <CheckCircle2 size={11} />
              Live model active{source === "env" ? " (from environment)" : ` (saved key ${masked ?? ""})`}
            </Badge>
          ) : (
            <Badge className="text-amber-300">
              <Brain size={11} /> Built-in heuristic engine
            </Badge>
          )}
        </div>

        <p className="text-[12px] leading-relaxed text-zinc-500">
          Add your OpenAI key to upgrade the coach, journal classification, weekly
          reviews, and campaign generation to the live model. The key is verified on
          save, stored locally in{" "}
          <code className="rounded bg-ink-800 px-1 py-0.5 font-mono text-[11px] text-zinc-300">
            .data/config.json
          </code>
          , and never leaves your machine except to call OpenAI. Without a key,
          everything still works on the built-in rule engine.
        </p>

        <div className="flex gap-2">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-…"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border border-ink-700 bg-ink-850/70 px-3.5 py-2 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-ink-600 focus:outline-none"
          />
          <Button onClick={save} disabled={pending || !key.trim()}>
            <KeyRound size={14} />
            {pending ? "Verifying…" : "Verify & Save"}
          </Button>
          {source === "local" && (
            <Button variant="danger" onClick={clear} disabled={pending}>
              <Trash2 size={13} /> Remove
            </Button>
          )}
        </div>

        {message && (
          <p className={`text-[12px] ${message.ok ? "text-reef" : "text-red-400"}`}>
            {message.text}
          </p>
        )}
      </div>
    </Card>
  );
}
