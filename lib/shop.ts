// ── The Shop ────────────────────────────────────────────────────────────────
// Gold is earned alongside real work (tasks, quests, logs, missions) and
// spent on character cosmetics. Purely cosmetic: power comes from XP only.

export type ShopItemType =
  | "frame"
  | "aura"
  | "companion"
  | "title"
  | "backdrop"
  | "upgrade";

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
  /** Companion or upgrade glyph shown on the portrait. */
  glyph?: string;
  /** Tailwind / CSS classes for frames, auras, and backdrops. */
  style?: string;
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
    cost: 80,
    type: "frame",
    style: "border-amber-800 shadow-[3px_3px_0_0_rgba(120,72,20,0.5)]",
  },
  {
    id: "frame-pine",
    name: "Pine Frame",
    description: "Pale farmhouse pine. Quiet, cheap, does the job.",
    cost: 60,
    type: "frame",
    style: "border-[#6b7a4a] shadow-[3px_3px_0_0_rgba(80,96,48,0.45)]",
  },
  {
    id: "frame-copper",
    name: "Copper Frame",
    description: "Warm copper trim. Looks like it was hammered in the shed.",
    cost: 140,
    type: "frame",
    style: "border-[#c47a3a] shadow-[3px_3px_0_0_rgba(196,122,58,0.45)]",
  },
  {
    id: "frame-ironwood",
    name: "Ironwood Frame",
    description: "Dark, dense, almost black. For heavy weeks.",
    cost: 180,
    type: "frame",
    style: "border-[#4a3f36] shadow-[3px_3px_0_0_rgba(20,16,12,0.7)]",
  },
  {
    id: "frame-gold",
    name: "Gilded Frame",
    description: "Gold-trimmed portrait border. For someone going places.",
    cost: 400,
    type: "frame",
    style: "border-xp shadow-[3px_3px_0_0_rgba(242,184,59,0.45)]",
  },
  {
    id: "frame-harvest",
    name: "Harvest Frame",
    description: "Amber wheat-gold. End of season energy.",
    cost: 320,
    type: "frame",
    style: "border-[#e09a2b] shadow-[3px_3px_0_0_rgba(224,154,43,0.5)]",
  },
  {
    id: "frame-river",
    name: "River Frame",
    description: "Sky-blue trim. GTM weather: clear and moving.",
    cost: 280,
    type: "frame",
    style: "border-[#5eb8e0] shadow-[3px_3px_0_0_rgba(94,184,224,0.45)]",
  },
  {
    id: "frame-meadow",
    name: "Meadow Frame",
    description: "Leaf-green border. Reefly and the field, same color.",
    cost: 280,
    type: "frame",
    style: "border-[#7fc860] shadow-[3px_3px_0_0_rgba(127,200,96,0.45)]",
  },
  {
    id: "frame-plum",
    name: "Wild Plum Frame",
    description: "TFE purple. A little theatrical, on purpose.",
    cost: 340,
    type: "frame",
    style: "border-[#b389e8] shadow-[3px_3px_0_0_rgba(179,137,232,0.45)]",
  },
  {
    id: "frame-void",
    name: "Void Frame",
    description: "A deep violet border that hums quietly. Endgame energy.",
    cost: 900,
    type: "frame",
    style: "border-violet-500 shadow-[3px_3px_0_0_rgba(139,92,246,0.45)]",
  },
  {
    id: "frame-obsidian",
    name: "Obsidian Frame",
    description: "Black glass edge. Looks expensive because it is.",
    cost: 750,
    type: "frame",
    style: "border-[#111] shadow-[3px_3px_0_0_rgba(242,184,59,0.25)]",
  },
  {
    id: "frame-pixel",
    name: "Pixel Frame",
    description: "Chunky 2px border. Stardew-honest.",
    cost: 220,
    type: "frame",
    style: "border-[3px] border-[#f2b83b] shadow-[4px_4px_0_0_rgba(0,0,0,0.55)]",
  },
  {
    id: "frame-frost",
    name: "Frost Frame",
    description: "Cold silver. For 5am gym mornings.",
    cost: 360,
    type: "frame",
    style: "border-[#c8d4e0] shadow-[3px_3px_0_0_rgba(200,212,224,0.35)]",
  },
  {
    id: "frame-emberwood",
    name: "Emberwood Frame",
    description: "Charred oak with a live ember edge.",
    cost: 520,
    type: "frame",
    style: "border-orange-500 shadow-[3px_3px_0_0_rgba(249,115,22,0.5)]",
  },

  // ── Auras ──
  {
    id: "aura-ember",
    name: "Ember Aura",
    description: "A warm ember glow pulses around your character.",
    cost: 250,
    type: "aura",
    style: "aura-ember",
  },
  {
    id: "aura-coal",
    name: "Coal Aura",
    description: "Low red heat. The forge is still on.",
    cost: 180,
    type: "aura",
    style: "aura-coal",
  },
  {
    id: "aura-golden",
    name: "Golden Aura",
    description: "The full harvest glow. Visible from across the valley.",
    cost: 600,
    type: "aura",
    style: "aura-golden",
  },
  {
    id: "aura-river",
    name: "River Aura",
    description: "Cool sky-blue halo. Demo energy.",
    cost: 420,
    type: "aura",
    style: "aura-river",
  },
  {
    id: "aura-meadow",
    name: "Meadow Aura",
    description: "Soft leaf glow. Things are growing.",
    cost: 420,
    type: "aura",
    style: "aura-meadow",
  },
  {
    id: "aura-plum",
    name: "Plum Aura",
    description: "Wild-plum shimmer. A little magic, a little menace.",
    cost: 480,
    type: "aura",
    style: "aura-plum",
  },
  {
    id: "aura-moon",
    name: "Moon Aura",
    description: "Pale night glow. For late logs and idle mode.",
    cost: 380,
    type: "aura",
    style: "aura-moon",
  },
  {
    id: "aura-static",
    name: "Static Aura",
    description: "A faint electric crackle. Shipping at 11pm.",
    cost: 540,
    type: "aura",
    style: "aura-static",
  },
  {
    id: "aura-voidglow",
    name: "Voidglow",
    description: "Violet endgame pulse. People notice.",
    cost: 880,
    type: "aura",
    style: "aura-voidglow",
  },
  {
    id: "aura-aurora",
    name: "Aurora Aura",
    description: "Shifts gold to river to meadow. Overkill. Buy it anyway.",
    cost: 1200,
    type: "aura",
    style: "aura-aurora",
  },
  {
    id: "aura-harvest",
    name: "Harvest Aura",
    description: "Warm wheat shimmer. Quest complete energy.",
    cost: 500,
    type: "aura",
    style: "aura-harvest",
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
  {
    id: "companion-crow",
    name: "Valley Crow",
    description: "Perches. Watches the board. Has opinions about LinkedIn.",
    cost: 280,
    type: "companion",
    glyph: "🐦",
  },
  {
    id: "companion-owl",
    name: "Night Owl",
    description: "For the 10pm deep-work block. Quietly judges the snacks.",
    cost: 320,
    type: "companion",
    glyph: "🦉",
  },
  {
    id: "companion-fox",
    name: "Hedge Fox",
    description: "Clever, slightly smug. Shows up when a deal is close.",
    cost: 360,
    type: "companion",
    glyph: "🦊",
  },
  {
    id: "companion-chicken",
    name: "Yard Chicken",
    description: "Pierre would sell you this. Clucks at unfinished tasks.",
    cost: 160,
    type: "companion",
    glyph: "🐔",
  },
  {
    id: "companion-frog",
    name: "Pond Frog",
    description: "Sits. Blinks. Somehow makes the dashboard calmer.",
    cost: 140,
    type: "companion",
    glyph: "🐸",
  },
  {
    id: "companion-bee",
    name: "Apiary Bee",
    description: "Always working. Shame if you weren't.",
    cost: 200,
    type: "companion",
    glyph: "🐝",
  },
  {
    id: "companion-wolf",
    name: "Ridge Wolf",
    description: "Streak energy. Does not skip gym days.",
    cost: 640,
    type: "companion",
    glyph: "🐺",
  },
  {
    id: "companion-goat",
    name: "Hill Goat",
    description: "Eats blockers for breakfast. Stubborn in a useful way.",
    cost: 300,
    type: "companion",
    glyph: "🐐",
  },
  {
    id: "companion-koi",
    name: "Reef Koi",
    description: "Slow, expensive, Reefly-coded. Swims in the portrait.",
    cost: 720,
    type: "companion",
    glyph: "🐟",
  },
  {
    id: "companion-moth",
    name: "Lamp Moth",
    description: "Drawn to the gold XP bar. Harmless. Kind of poetic.",
    cost: 180,
    type: "companion",
    glyph: "🦋",
  },
  {
    id: "companion-turtle",
    name: "Grove Turtle",
    description: "Long game. Missions, not sprints.",
    cost: 260,
    type: "companion",
    glyph: "🐢",
  },
  {
    id: "companion-dragon",
    name: "Barn Dragon",
    description: "Very small. Very dramatic. Endgame pet.",
    cost: 1400,
    type: "companion",
    glyph: "🐉",
  },

  // ── Titles ──
  {
    id: "title-closer",
    name: "Title: Closer",
    description: "Shown under your name. For people who finish things.",
    cost: 220,
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
    cost: 220,
    type: "title",
    titleText: "Iron",
  },
  {
    id: "title-operator",
    name: "Title: Operator",
    description: "The job title as a flex. Quiet and accurate.",
    cost: 400,
    type: "title",
    titleText: "Operator",
  },
  {
    id: "title-rainmaker",
    name: "Title: Rainmaker",
    description: "Pipeline weather: always coming in.",
    cost: 480,
    type: "title",
    titleText: "Rainmaker",
  },
  {
    id: "title-founder",
    name: "Title: Founder",
    description: "For TFE, Reefly, and whatever is next.",
    cost: 600,
    type: "title",
    titleText: "Founder",
  },
  {
    id: "title-shipper",
    name: "Title: Shipper",
    description: "Shipped > perfect. Worn with pride.",
    cost: 200,
    type: "title",
    titleText: "Shipper",
  },
  {
    id: "title-farmer",
    name: "Title: Farmer",
    description: "Tilled the board. Harvested the week.",
    cost: 160,
    type: "title",
    titleText: "Farmer",
  },
  {
    id: "title-night-owl",
    name: "Title: Night Owl",
    description: "The log after dinner. The quest before bed.",
    cost: 180,
    type: "title",
    titleText: "Night Owl",
  },
  {
    id: "title-deep-work",
    name: "Title: Deep Work",
    description: "Do not ping. The field is being tilled.",
    cost: 260,
    type: "title",
    titleText: "Deep Work",
  },
  {
    id: "title-gtm",
    name: "Title: GTM",
    description: "Go-to-market as identity. Fair.",
    cost: 340,
    type: "title",
    titleText: "GTM",
  },
  {
    id: "title-principal",
    name: "Title: Principal",
    description: "The rank you're playing toward. Wear it early.",
    cost: 800,
    type: "title",
    titleText: "Principal",
  },
  {
    id: "title-streak",
    name: "Title: Streakkeeper",
    description: "For people who do not break the chain.",
    cost: 280,
    type: "title",
    titleText: "Streakkeeper",
  },
  {
    id: "title-coach",
    name: "Title: Coach",
    description: "You already talk to the helper. Might as well own it.",
    cost: 240,
    type: "title",
    titleText: "Coach",
  },
  {
    id: "title-unbothered",
    name: "Title: Unbothered",
    description: "Noise off. Board on.",
    cost: 200,
    type: "title",
    titleText: "Unbothered",
  },
  {
    id: "title-advisor",
    name: "Title: Advisor",
    description: "Endgame rank energy, on sale early.",
    cost: 900,
    type: "title",
    titleText: "Advisor",
  },
  {
    id: "title-builder",
    name: "Title: Builder",
    description: "Hands in the dirt. Product in production.",
    cost: 180,
    type: "title",
    titleText: "Builder",
  },
  {
    id: "title-closer-plus",
    name: "Title: Deal Desk",
    description: "POC to paper. That's the whole personality.",
    cost: 360,
    type: "title",
    titleText: "Deal Desk",
  },

  // ── Backdrops (portrait fill) ──
  {
    id: "backdrop-soil",
    name: "Soil Backdrop",
    description: "The default valley dirt, but you paid for it. Respect.",
    cost: 80,
    type: "backdrop",
    style: "bg-[#17110c]",
  },
  {
    id: "backdrop-night",
    name: "Night Backdrop",
    description: "Idle-mode sky behind the portrait.",
    cost: 160,
    type: "backdrop",
    style: "bg-[#0c1024]",
  },
  {
    id: "backdrop-dawn",
    name: "Dawn Backdrop",
    description: "Warm 6am light. Gym bag already packed.",
    cost: 200,
    type: "backdrop",
    style: "bg-[#2a1810]",
  },
  {
    id: "backdrop-riverbed",
    name: "Riverbed Backdrop",
    description: "Deep sky-ink. Demo environment.",
    cost: 260,
    type: "backdrop",
    style: "bg-[#10202c]",
  },
  {
    id: "backdrop-meadow",
    name: "Meadow Dusk",
    description: "Green-black. The field after rain.",
    cost: 260,
    type: "backdrop",
    style: "bg-[#121a10]",
  },
  {
    id: "backdrop-forge",
    name: "Forge Backdrop",
    description: "Ember-lit. For heavy lift days.",
    cost: 300,
    type: "backdrop",
    style: "bg-[#2a120c]",
  },
  {
    id: "backdrop-study",
    name: "Study Backdrop",
    description: "Lamp-warm brown. Notes, not noise.",
    cost: 180,
    type: "backdrop",
    style: "bg-[#24180f]",
  },
  {
    id: "backdrop-void",
    name: "Void Backdrop",
    description: "Almost no color. Endgame portrait.",
    cost: 640,
    type: "backdrop",
    style: "bg-[#140c1c]",
  },

  // ── Restock: the shelf that shows up after the first catalog ──
  {
    id: "frame-barnlight",
    name: "Barnlight Frame",
    description: "A lamp-warm edge. For the hour after the gym.",
    cost: 460,
    type: "frame",
    style: "border-[#e8c07a] shadow-[3px_3px_0_0_rgba(232,192,122,0.4)]",
  },
  {
    id: "frame-ledger",
    name: "Ledger Frame",
    description: "Ink-green trim. The promotion packet, framed.",
    cost: 540,
    type: "frame",
    style: "border-[#6f8f62] shadow-[3px_3px_0_0_rgba(111,143,98,0.45)]",
  },
  {
    id: "frame-signal",
    name: "Signal Frame",
    description: "A thin red wire of a border. Something shipped.",
    cost: 680,
    type: "frame",
    style: "border-[#e85d4c] shadow-[3px_3px_0_0_rgba(232,93,76,0.4)]",
  },
  {
    id: "aura-lantern",
    name: "Lantern Aura",
    description: "Porch light. Visible, not loud.",
    cost: 560,
    type: "aura",
    style: "aura-harvest",
  },
  {
    id: "aura-wire",
    name: "Wire Aura",
    description: "A live circuit. For the night you actually publish.",
    cost: 640,
    type: "aura",
    style: "aura-static",
  },
  {
    id: "companion-raccoon",
    name: "Bin Raccoon",
    description: "Sorts the board at night. Steals nothing important.",
    cost: 380,
    type: "companion",
    glyph: "🦝",
  },
  {
    id: "companion-hedgehog",
    name: "Hedge Hog",
    description: "Small, bristly, does not skip the streak.",
    cost: 340,
    type: "companion",
    glyph: "🦔",
  },
  {
    id: "companion-duck",
    name: "Pond Duck",
    description: "Looks calm. Is counting your unfinished tasks.",
    cost: 240,
    type: "companion",
    glyph: "🦆",
  },
  {
    id: "title-compounder",
    name: "Title: Compounder",
    description: "Shown under your name. The long game, worn out loud.",
    cost: 520,
    type: "title",
    titleText: "Compounder",
  },
  {
    id: "title-historian",
    name: "Title: Historian",
    description: "Shown under your name. The person who writes the day down.",
    cost: 300,
    type: "title",
    titleText: "Historian",
  },
  {
    id: "backdrop-booth",
    name: "Booth Night",
    description: "Warm dark. The hall after the demos.",
    cost: 420,
    type: "backdrop",
    style: "bg-[#1a1408]",
  },
  {
    id: "backdrop-ledger",
    name: "Ledger Green",
    description: "Dark field green. Evidence, not noise.",
    cost: 380,
    type: "backdrop",
    style: "bg-[#101610]",
  },

  // ── Upgrades: gear you wear. Cosmetic, one equipped at a time. ──
  {
    id: "upgrade-lucky-coin",
    name: "Lucky Coin",
    description: "A worn coin. Flip it before a hard call.",
    cost: 90,
    type: "upgrade",
    glyph: "🪙",
  },
  {
    id: "upgrade-field-dice",
    name: "Field Dice",
    description: "Two dice for when the board is a coin flip.",
    cost: 140,
    type: "upgrade",
    glyph: "🎲",
  },
  {
    id: "upgrade-ink-quill",
    name: "Ink Quill",
    description: "Writes the day down. The journal approves.",
    cost: 160,
    type: "upgrade",
    glyph: "🪶",
  },
  {
    id: "upgrade-rusted-key",
    name: "Rusted Key",
    description: "Opens the back room of the shop.",
    cost: 180,
    type: "upgrade",
    glyph: "🗝️",
  },
  {
    id: "upgrade-brass-compass",
    name: "Brass Compass",
    description: "Points at the next real move, not the inbox.",
    cost: 240,
    type: "upgrade",
    glyph: "🧭",
  },
  {
    id: "upgrade-lantern",
    name: "Field Lantern",
    description: "6am light you can carry. Shows on the portrait.",
    cost: 280,
    type: "upgrade",
    glyph: "🏮",
  },
  {
    id: "upgrade-bench-shield",
    name: "Bench Shield",
    description: "Heavy. For days you have to hold the line.",
    cost: 340,
    type: "upgrade",
    glyph: "🛡️",
  },
  {
    id: "upgrade-iron-anvil",
    name: "Iron Anvil",
    description: "The work gets shaped here. No XP bonus. Just the look.",
    cost: 420,
    type: "upgrade",
    glyph: "⚒️",
  },
  {
    id: "upgrade-health-potion",
    name: "Recovery Flask",
    description: "Red glass. Looks like a heal. It is a sticker.",
    cost: 260,
    type: "upgrade",
    glyph: "🧪",
  },
  {
    id: "upgrade-war-banner",
    name: "War Banner",
    description: "A small flag. Equip it when the week is a campaign.",
    cost: 480,
    type: "upgrade",
    glyph: "🚩",
  },
  {
    id: "upgrade-star-chart",
    name: "Star Chart",
    description: "Night navigation. Endgame trinket.",
    cost: 560,
    type: "upgrade",
    glyph: "✨",
  },
  {
    id: "upgrade-wyrm-tooth",
    name: "Wyrm Tooth",
    description: "A trophy. You did not slay anything. It still looks good.",
    cost: 640,
    type: "upgrade",
    glyph: "🐉",
  },
  {
    id: "upgrade-crown",
    name: "Crown of Hours",
    description: "Bought with gold from days you actually banked.",
    cost: 900,
    type: "upgrade",
    glyph: "👑",
  },
];

export const SHOP_ITEM_MAP: Record<string, ShopItem> = Object.fromEntries(
  SHOP_ITEMS.map((i) => [i.id, i]),
);

/** Static catalog plus shelves generated later. Generated ids never replace a stock item. */
export function shopCatalog(extra: ShopItem[] = []): ShopItem[] {
  const byId = new Map<string, ShopItem>();
  for (const item of SHOP_ITEMS) byId.set(item.id, item);
  for (const item of extra) {
    if (!item?.id || byId.has(item.id)) continue;
    if (!item.name || !item.type || !Number.isFinite(item.cost)) continue;
    byId.set(item.id, item);
  }
  return [...byId.values()];
}

export function findShopItem(id: string, extra: ShopItem[] = []): ShopItem | undefined {
  return SHOP_ITEM_MAP[id] ?? extra.find((item) => item.id === id);
}

export const FRAME_STYLES: Record<string, string> = Object.fromEntries(
  SHOP_ITEMS.filter((i) => i.type === "frame" && i.style).map((i) => [
    i.id,
    i.style!,
  ]),
);

export const AURA_STYLES: Record<string, string> = Object.fromEntries(
  SHOP_ITEMS.filter((i) => i.type === "aura" && i.style).map((i) => [
    i.id,
    i.style!,
  ]),
);

export const BACKDROP_STYLES: Record<string, string> = Object.fromEntries(
  SHOP_ITEMS.filter((i) => i.type === "backdrop" && i.style).map((i) => [
    i.id,
    i.style!,
  ]),
);
