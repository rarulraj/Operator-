import { readFileSync, writeFileSync, renameSync, mkdirSync } from "fs";
import path from "path";

// ── Local runtime config ────────────────────────────────────────────────────
// User-managed settings that take effect immediately (no server restart).
// Stored in .data/config.json — gitignored, never leaves the machine.

const CONFIG_DIR =
  process.env.OPERATOR_DATA_DIR || path.join(process.cwd(), ".data");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface LocalConfig {
  openaiApiKey?: string;
}

let cache: LocalConfig | null = null;

function readConfig(): LocalConfig {
  if (cache) return cache;
  try {
    cache = JSON.parse(readFileSync(CONFIG_FILE, "utf-8")) as LocalConfig;
  } catch {
    cache = {};
  }
  return cache;
}

function writeConfig(config: LocalConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  // Atomic: tmp + rename so a kill mid-write can't corrupt the config
  const tmp = `${CONFIG_FILE}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(config, null, 2), "utf-8");
  renameSync(tmp, CONFIG_FILE);
  cache = config;
}

/** Env var wins; otherwise the key saved from the Settings page. */
export function getOpenAiKey(): string | null {
  return process.env.OPENAI_API_KEY || readConfig().openaiApiKey || null;
}

export function getOpenAiKeySource(): "env" | "local" | null {
  if (process.env.OPENAI_API_KEY) return "env";
  if (readConfig().openaiApiKey) return "local";
  return null;
}

export function saveOpenAiKey(key: string): void {
  writeConfig({ ...readConfig(), openaiApiKey: key.trim() });
}

export function clearOpenAiKey(): void {
  const config = readConfig();
  delete config.openaiApiKey;
  writeConfig(config);
}

export function maskedKey(): string | null {
  const key = readConfig().openaiApiKey;
  if (!key) return null;
  return `…${key.slice(-4)}`;
}
