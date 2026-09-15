import { getOpenAiKey } from "../config";
import { LocalStore } from "./local";
import type { Store } from "./types";

// ── Persistence ─────────────────────────────────────────────────────────────
// Everything is stored locally in .data/store.json (gitignored).
// No external services required.

// Pinned to globalThis, not a module-local: Next can load this module more
// than once (separate route chunks, dev HMR). Two LocalStore instances mean
// two write queues and two caches, which silently loses task toggles.
const STORE_KEY = Symbol.for("operator.store");
type StoreGlobal = typeof globalThis & { [STORE_KEY]?: Store };

export function getStore(): Store {
  const g = globalThis as StoreGlobal;
  if (!g[STORE_KEY]) g[STORE_KEY] = new LocalStore();
  return g[STORE_KEY];
}

export function isOpenAiConfigured(): boolean {
  return Boolean(getOpenAiKey());
}
