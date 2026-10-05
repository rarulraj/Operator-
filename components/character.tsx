import {
  AURA_STYLES,
  BACKDROP_STYLES,
  findShopItem,
  FRAME_STYLES,
  type ShopItem,
} from "@/lib/shop";
import type { Inventory } from "@/lib/types";
import { rankFromXp, type Rank } from "@/lib/xp";

export { AURA_STYLES, FRAME_STYLES };

// ── The Operator: your digital character ───────────────────────────────────
// Sprite evolves with rank. Lines stay grounded: farm-quiet, advisor-adjacent.

export const STAGE_BY_RANK: Record<string, { src: string; stage: string }> = {
  Apprentice: { src: "/char-apprentice.png", stage: "Apprentice" },
  Builder: { src: "/char-builder.png", stage: "Builder" },
  Operator: { src: "/char-builder.png", stage: "Operator" },
  Strategist: { src: "/char-architect.png", stage: "Strategist" },
  Architect: { src: "/char-architect.png", stage: "Architect" },
  Advisor: { src: "/char-architect.png", stage: "Advisor" },
  Principal: { src: "/char-master.png", stage: "Principal" },
  "Master Operator": { src: "/char-master.png", stage: "Master Operator" },
};

function statusLine(streak: number, questDoneToday: boolean): string {
  if (questDoneToday) return "Quest's done. The soil rests tonight.";
  if (streak >= 7) return `${streak} days straight. The field is thriving.`;
  if (streak >= 3) return `Day ${streak}. Steady hands, steady harvest.`;
  if (streak === 0) return "New season. What are we building today?";
  return "Another day on the books. Keep tilling.";
}

// Equipped shop cosmetics → portrait styling (maps live in lib/shop.ts)

export function CompanionMark({
  item,
  size,
  className = "",
}: {
  item: ShopItem;
  size: number;
  className?: string;
}) {
  if (item.sprite) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.sprite}
        alt={item.name}
        width={size}
        height={size}
        className={`pixelated ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.62) }}
      aria-label={item.name}
    >
      {item.glyph ?? "🐾"}
    </div>
  );
}

export function Character({
  totalXp,
  streak,
  questDoneToday,
  size = 88,
  inventory,
  rankTiers = [],
  shopStock = [],
}: {
  totalXp: number;
  streak: number;
  questDoneToday: boolean;
  size?: number;
  inventory?: Inventory;
  rankTiers?: Rank[];
  shopStock?: ShopItem[];
}) {
  const rank = rankFromXp(totalXp, rankTiers);
  const stage =
    STAGE_BY_RANK[rank.title] ??
    (rank.minXp >= 10450 ? STAGE_BY_RANK["Master Operator"] : STAGE_BY_RANK.Apprentice);

  const equipped = inventory?.equipped ?? [];
  const frame = equipped.find((id) => id.startsWith("frame-"));
  const aura = equipped.find((id) => id.startsWith("aura-"));
  const companionId = equipped.find((id) => id.startsWith("companion-"));
  const companion = companionId ? findShopItem(companionId, shopStock) : null;
  const backdrop = equipped.find((id) => id.startsWith("backdrop-"));

  const frameClass =
    (frame && (FRAME_STYLES[frame] ?? findShopItem(frame, shopStock)?.style)) ??
    "border-ink-600/70 shadow-[3px_3px_0_0_rgba(0,0,0,0.35)]";
  const glowClass =
    (aura && (AURA_STYLES[aura] ?? findShopItem(aura, shopStock)?.style)) ?? "sprite-glow";
  const fillClass =
    (backdrop && (BACKDROP_STYLES[backdrop] ?? findShopItem(backdrop, shopStock)?.style)) ??
    "bg-[#17110c]";

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stage.src}
          alt={`Your character: ${stage.stage} stage`}
          width={size}
          height={size}
          className={`animate-sprite-idle ${glowClass} pixelated rounded-xl border ${fillClass} ${frameClass}`}
        />
        {companion && (
          <CompanionMark
            item={companion}
            size={Math.round(size * 0.42)}
            className="animate-sprite-idle absolute -bottom-2 -left-3 rounded-lg border border-ink-600/70 bg-[#17110c]"
          />
        )}
        <span className="absolute -bottom-1.5 -right-1.5 rounded-md border border-xp/40 bg-ink-900 px-1.5 py-0.5 font-pixel text-[8px] font-bold uppercase text-xp">
          {stage.stage}
        </span>
      </div>
      <div className="hidden min-w-0 sm:block">
        <div className="inline-block rounded-lg rounded-bl-sm border border-ink-700 bg-ink-850/80 px-3 py-1.5">
          <p className="text-[12px] italic leading-snug text-zinc-400">
            &ldquo;{statusLine(streak, questDoneToday)}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
