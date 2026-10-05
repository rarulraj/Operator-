import type { ShopItem, ShopItemType } from "./shop";
import { shopCatalog } from "./shop";
import { getStore } from "./store";
import type { AppState } from "./types";
import { getOpenAI, openAiModel } from "./ai/openai";
import { levelFromXp, ranksFor, xpForLevel, type Rank } from "./xp";

function totalXp(state: AppState): number {
  return state.xpEvents.reduce((sum, event) => sum + event.amount, 0);
}

// ── Infinite ladder + restocking shop ───────────────────────────────────────
// Levels never cap. Rank titles and shop shelves are written ahead of the
// player: four future ranks, and a new shelf whenever the counter gets thin
// or the generated shelf is still empty.

const FUTURE_RANKS = 4;
const MIN_UNOWNED = 12;
const BATCH = 5;

const RANK_STEMS = [
  "Field Principal",
  "Venture Operator",
  "Harbor Master",
  "North Star",
  "Dealwright",
  "Foundry Lead",
  "Valley Warden",
  "Signal Chief",
  "Range Captain",
  "Studio Partner",
  "Night Principal",
  "Harvest Warden",
  "River Pilot",
  "Forge Master",
  "Atlas Hand",
];

const AURA_STYLES = [
  "aura-ember",
  "aura-golden",
  "aura-coal",
  "aura-river",
  "aura-meadow",
  "aura-plum",
  "aura-moon",
  "aura-static",
  "aura-voidglow",
  "aura-aurora",
  "aura-harvest",
];

const FRAME_STYLES = [
  "border-rose-400 shadow-[3px_3px_0_0_rgba(251,113,133,0.4)]",
  "border-sky-400 shadow-[3px_3px_0_0_rgba(56,189,248,0.4)]",
  "border-lime-400 shadow-[3px_3px_0_0_rgba(163,230,53,0.4)]",
  "border-fuchsia-400 shadow-[3px_3px_0_0_rgba(232,121,249,0.4)]",
  "border-teal-300 shadow-[3px_3px_0_0_rgba(94,234,212,0.4)]",
  "border-yellow-200 shadow-[3px_3px_0_0_rgba(254,240,138,0.35)]",
];

const BACKDROPS = [
  "bg-[#1c1018]",
  "bg-[#0e1a18]",
  "bg-[#1a120c]",
  "bg-[#10141c]",
  "bg-[#1a1810]",
  "bg-[#140e18]",
];
const GLYPHS = ["🐿️", "🦡", "🦢", "🦉", "🐝", "🐢", "🦊", "🐺", "🐐", "🐸"];
const TITLE_WORDS = [
  "Warden",
  "Pilot",
  "Keeper",
  "Smith",
  "Marshal",
  "Scribe",
  "Ranger",
  "Partner",
];
const TYPES: ShopItemType[] = ["frame", "aura", "companion", "title", "backdrop"];

function roman(n: number): string {
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let left = n;
  for (const [value, glyph] of map) {
    while (left >= value) {
      out += glyph;
      left -= value;
    }
  }
  return out || "I";
}

export function proceduralRankTitle(index: number): string {
  const stem = RANK_STEMS[index % RANK_STEMS.length];
  const cycle = Math.floor(index / RANK_STEMS.length);
  return cycle === 0 ? stem : `${stem} ${roman(cycle + 1)}`;
}

/** XP thresholds for the next ranks, always past the current ladder. */
export function nextRankSlots(existing: Rank[], xp: number, want = FUTURE_RANKS): number[] {
  const ranks = ranksFor(existing);
  const ahead = ranks.filter((rank) => rank.minXp > xp).length;
  // The base ladder already sits ahead of a new player. Still write the next
  // shelf once, so the rank list does not end at Master Operator.
  let missing = Math.max(0, want - ahead);
  if (existing.length === 0) missing = Math.max(missing, want);
  const slots: number[] = [];
  let level = levelFromXp(ranks[ranks.length - 1]?.minXp ?? 0).level;
  for (let i = 0; i < missing; i++) {
    level += 5;
    slots.push(xpForLevel(level));
  }
  return slots;
}

export function fallbackRanks(existing: Rank[], slots: number[]): Rank[] {
  const taken = new Set(ranksFor(existing).map((rank) => rank.title.toLowerCase()));
  const start = existing.length;
  return slots.map((minXp, i) => {
    let title = proceduralRankTitle(start + i);
    let n = start + i;
    while (taken.has(title.toLowerCase())) {
      n += 1;
      title = proceduralRankTitle(n);
    }
    taken.add(title.toLowerCase());
    return { title, minXp };
  });
}

function proceduralShelf(existingIds: Set<string>, wave: number): ShopItem[] {
  const items: ShopItem[] = [];
  let n = 0;
  while (items.length < BATCH) {
    const type = TYPES[(wave + n) % TYPES.length];
    const id = `gen-${type}-${wave}-${n}`;
    n += 1;
    if (existingIds.has(id)) continue;
    const cost = 480 + wave * 220 + items.length * 60;
    const mark = wave * BATCH + items.length + 1;
    if (type === "frame") {
      items.push({
        id,
        name: `Shelf Frame ${mark}`,
        description: "A new border from the back room. The shop restocked.",
        cost,
        type,
        style: FRAME_STYLES[mark % FRAME_STYLES.length],
      });
    } else if (type === "aura") {
      items.push({
        id,
        name: `Shelf Aura ${mark}`,
        description: "Another glow. Cosmetic only.",
        cost,
        type,
        style: AURA_STYLES[mark % AURA_STYLES.length],
      });
    } else if (type === "companion") {
      items.push({
        id,
        name: `Shelf Companion ${mark}`,
        description: "New livestock. Judges your streak.",
        cost,
        type,
        glyph: GLYPHS[mark % GLYPHS.length],
      });
    } else if (type === "title") {
      const titleText = `${TITLE_WORDS[mark % TITLE_WORDS.length]} ${roman((wave % 9) + 1)}`;
      items.push({
        id,
        name: `Title: ${titleText}`,
        description: "Shown under your name. Written for this shelf.",
        cost,
        type,
        titleText,
      });
    } else {
      items.push({
        id,
        name: `Shelf Night ${mark}`,
        description: "A darker fill behind the portrait.",
        cost,
        type,
        style: BACKDROPS[mark % BACKDROPS.length],
      });
    }
    existingIds.add(id);
  }
  return items;
}

async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    work.then((value) => value).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

async function aiRankTitles(previous: string[], count: number): Promise<string[] | null> {
  const openai = getOpenAI();
  if (!openai) return null;
  const res = await openai.chat.completions.create({
    model: openAiModel(),
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `Write the next ${count} rank titles for Arun's personal RPG, Operator. He already holds: ${previous.join(", ")}.
Each title is 1-3 words, escalating, specific to a founder / solutions-engineer life (work, brand, body, ventures). No numbers. No "Level". No repeats.
Return JSON: { "titles": string[] } with exactly ${count} titles.`,
      },
    ],
  });
  const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as { titles?: unknown };
  if (!Array.isArray(parsed.titles)) return null;
  const titles = parsed.titles
    .map((title) => (typeof title === "string" ? title.trim() : ""))
    .filter((title) => title.length > 1 && title.length < 32);
  return titles.length >= count ? titles.slice(0, count) : null;
}

async function aiShelf(wave: number, previousNames: string[]): Promise<ShopItem[] | null> {
  const openai = getOpenAI();
  if (!openai) return null;
  const res = await openai.chat.completions.create({
    model: openAiModel(),
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `Restock Pierre's shop in Operator, a farm-quiet personal RPG. Write ${BATCH} new cosmetics. Already stocked: ${previousNames.slice(-24).join(", ") || "the first catalog"}.
Types, one each if you can: frame, aura, companion, title, backdrop.
Voice: short, dry, specific. Not generic fantasy. Costs between ${600 + wave * 100} and ${1400 + wave * 200}.
For companions include a single emoji glyph. For titles include titleText (the words under the name).
Return JSON: { "items": [{ "name": string, "description": string, "cost": number, "type": "frame"|"aura"|"companion"|"title"|"backdrop", "titleText"?: string, "glyph"?: string }] }`,
      },
    ],
  });
  const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as { items?: unknown };
  if (!Array.isArray(parsed.items)) return null;
  const items: ShopItem[] = [];
  parsed.items.forEach((raw, index) => {
    if (!raw || typeof raw !== "object") return;
    const rec = raw as Record<string, unknown>;
    const type = rec.type;
    if (type !== "frame" && type !== "aura" && type !== "companion" && type !== "title" && type !== "backdrop") {
      return;
    }
    const name = typeof rec.name === "string" ? rec.name.trim().slice(0, 42) : "";
    const description = typeof rec.description === "string" ? rec.description.trim().slice(0, 140) : "";
    const cost = Number(rec.cost);
    if (!name || !description || !Number.isFinite(cost)) return;
    const item: ShopItem = {
      id: `gen-${type}-${wave}-${index}`,
      name,
      description,
      cost: Math.max(80, Math.min(5000, Math.round(cost))),
      type,
    };
    if (type === "frame") item.style = FRAME_STYLES[index % FRAME_STYLES.length];
    if (type === "aura") item.style = AURA_STYLES[index % AURA_STYLES.length];
    if (type === "backdrop") item.style = BACKDROPS[index % BACKDROPS.length];
    if (type === "companion") {
      item.glyph = typeof rec.glyph === "string" && rec.glyph.trim() ? rec.glyph.trim().slice(0, 4) : GLYPHS[index % GLYPHS.length];
    }
    if (type === "title") {
      const titleText = typeof rec.titleText === "string" ? rec.titleText.trim().slice(0, 24) : name.replace(/^title:\s*/i, "");
      item.titleText = titleText || name;
      if (!item.name.toLowerCase().startsWith("title")) item.name = `Title: ${item.titleText}`;
    }
    items.push(item);
  });
  return items.length ? items.slice(0, BATCH) : null;
}

export async function ensureProgression(state?: AppState): Promise<AppState> {
  const store = getStore();
  const live = state ?? (await store.getState());
  const xp = totalXp(live);
  const slots = nextRankSlots(live.rankTiers ?? [], xp);
  const catalog = shopCatalog(live.shopStock ?? []);
  const unowned = catalog.filter((item) => !live.inventory.owned.includes(item.id)).length;
  const needShop = (live.shopStock ?? []).length === 0 || unowned < MIN_UNOWNED;
  if (!slots.length && !needShop) return live;

  const previousTitles = ranksFor(live.rankTiers ?? []).map((rank) => rank.title);
  const wave = Math.floor((live.shopStock ?? []).length / BATCH) + 1;
  const [named, aiItems] = await Promise.all([
    slots.length ? withTimeout(aiRankTitles(previousTitles, slots.length), 8000) : Promise.resolve(null),
    needShop
      ? withTimeout(aiShelf(wave, catalog.map((item) => item.name)), 8000)
      : Promise.resolve(null),
  ]);
  const ranks = slots.length
    ? fallbackRanks(live.rankTiers ?? [], slots).map((rank, i) => ({
        minXp: rank.minXp,
        title: named?.[i] && !previousTitles.includes(named[i]) ? named[i] : rank.title,
      }))
    : [];

  let shelf: ShopItem[] = [];
  if (needShop) {
    const ids = new Set(catalog.map((item) => item.id));
    shelf = (aiItems ?? proceduralShelf(ids, wave)).filter((item) => !ids.has(item.id));
  }

  if (!ranks.length && !shelf.length) return live;
  if (!store.mutate) return live;

  let next = live;
  await store.mutate((draft) => {
    if (!Array.isArray(draft.rankTiers)) draft.rankTiers = [];
    if (!Array.isArray(draft.shopStock)) draft.shopStock = [];
    const haveXp = new Set(ranksFor(draft.rankTiers).map((rank) => rank.minXp));
    for (const rank of ranks) {
      if (!haveXp.has(rank.minXp)) draft.rankTiers.push(rank);
    }
    const haveId = new Set(shopCatalog(draft.shopStock).map((item) => item.id));
    for (const item of shelf) {
      if (!haveId.has(item.id)) draft.shopStock.push(item);
    }
    next = draft;
  });
  return next;
}
