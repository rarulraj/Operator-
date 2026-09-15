// ── The Shop ────────────────────────────────────────────────────────────────
// Gold is earned alongside real work (tasks, quests, logs, missions) and
// spent on character cosmetics. Purely cosmetic — power comes from XP only.

export type ShopItemType = "frame" | "aura" | "companion" | "title";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: ShopItemType;
  /** For titles: the text shown under the player name. */
  titleText?: string;
  /** For companions: the sprite in /public. */
  sprite?: string;
}

export const GOLD_REWARDS = {
  task: 5,
  activity: 10,
  quest: 50,
  mission: 250,
} as const;

export const SHOP_ITEMS: ShopItem[] = [
  // ── Frames ──
  {
    id: "frame-oak",
    name: "Oak Frame",
    description: "A sturdy oak border. Your portrait finally feels planted.",
    cost: 100,
    type: "frame",
  },
  {
    id: "frame-gold",
    name: "Gilded Frame",
    description: "Gold-trimmed portrait border. For someone going places.",
    cost: 400,
    type: "frame",
  },
  {
    id: "frame-void",
    name: "Void Frame",
    description: "A deep violet border that hums quietly. Endgame energy.",
    cost: 900,
    type: "frame",
  },
  // ── Auras ──
  {
    id: "aura-ember",
    name: "Ember Aura",
    description: "A warm ember glow pulses around your character.",
    cost: 250,
    type: "aura",
  },
  {
    id: "aura-golden",
    name: "Golden Aura",
    description: "The full harvest glow. Visible from across the valley.",
    cost: 600,
    type: "aura",
  },
  // ── Companions ──
  {
    id: "companion-pup",
    name: "Farm Pup",
    description: "A loyal pixel pup who sits beside your portrait. Good boy.",
    cost: 500,
    type: "companion",
    sprite: "/companion-pup.png",
  },
  {
    id: "companion-cat",
    name: "Barn Cat",
    description: "A barn cat who tolerates you. Judges your weekly output.",
    cost: 500,
    type: "companion",
    sprite: "/companion-cat.png",
  },
  // ── Titles ──
  {
    id: "title-closer",
    name: "Title: Closer",
    description: "Shown under your name. For people who finish things.",
    cost: 300,
    type: "title",
    titleText: "Closer",
  },
  {
    id: "title-architect",
    name: "Title: The Architect",
    description: "Shown under your name. Systems thinker, long-game player.",
    cost: 300,
    type: "title",
    titleText: "The Architect",
  },
  {
    id: "title-iron",
    name: "Title: Iron",
    description: "Shown under your name. For the ones who show up to the gym.",
    cost: 300,
    type: "title",
    titleText: "Iron",
  },
];

export const SHOP_ITEM_MAP: Record<string, ShopItem> = Object.fromEntries(
  SHOP_ITEMS.map((i) => [i.id, i]),
);
