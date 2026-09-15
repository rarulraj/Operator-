"use client";

import { Check, Coins, Store } from "lucide-react";
import { useState, useTransition } from "react";
import { buyItemAction, equipItemAction } from "@/app/actions";
import { SHOP_ITEMS, type ShopItem, type ShopItemType } from "@/lib/shop";
import type { Inventory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "./ui";

const SECTIONS: { type: ShopItemType; label: string }[] = [
  { type: "frame", label: "Portrait Frames" },
  { type: "aura", label: "Auras" },
  { type: "companion", label: "Companions" },
  { type: "title", label: "Titles" },
];

function ItemPreview({ item }: { item: ShopItem }) {
  if (item.type === "frame") {
    const cls =
      item.id === "frame-gold"
        ? "border-xp shadow-[2px_2px_0_0_rgba(242,184,59,0.45)]"
        : item.id === "frame-void"
          ? "border-violet-500 shadow-[2px_2px_0_0_rgba(139,92,246,0.45)]"
          : "border-amber-800 shadow-[2px_2px_0_0_rgba(120,72,20,0.5)]";
    return <div className={cn("h-10 w-10 rounded-lg border-2 bg-[#17110c]", cls)} />;
  }
  if (item.type === "aura") {
    return (
      <div
        className={cn(
          "h-10 w-10 rounded-lg border border-ink-700 bg-[#17110c]",
          item.id === "aura-golden" ? "aura-golden" : "aura-ember",
        )}
      />
    );
  }
  if (item.type === "companion" && item.sprite) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={item.sprite}
        alt={item.name}
        width={40}
        height={40}
        className="pixelated rounded-lg border border-ink-700 bg-[#17110c]"
      />
    );
  }
  // title
  return (
    <div className="flex h-10 items-center rounded-lg border border-ink-700 bg-ink-800 px-2.5 font-pixel text-[9px] font-bold uppercase tracking-wider text-zinc-300">
      {item.titleText}
    </div>
  );
}

function ShopItemCard({ item, inventory }: { item: ShopItem; inventory: Inventory }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const owned = inventory.owned.includes(item.id);
  const equipped = inventory.equipped.includes(item.id);
  const affordable = inventory.gold >= item.cost;

  function buy() {
    setError(null);
    startTransition(async () => {
      const res = await buyItemAction(item.id);
      if (!res.ok) setError(res.error ?? "Couldn't buy that.");
    });
  }

  function toggleEquip() {
    startTransition(async () => {
      const res = await equipItemAction(item.id, !equipped);
      if (!res.ok) setError(res.error ?? "Couldn't equip that.");
    });
  }

  return (
    <Card
      className={cn(
        "flex items-center gap-4 px-4 py-3.5",
        equipped && "border-xp/30 bg-xp/5",
      )}
    >
      <ItemPreview item={item} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-zinc-100">{item.name}</div>
        <p className="mt-0.5 text-[12px] leading-snug text-zinc-500">
          {item.description}
        </p>
        {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
      </div>
      <div className="shrink-0 text-right">
        {owned ? (
          <button
            onClick={toggleEquip}
            disabled={pending}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
              equipped
                ? "bg-xp/15 text-xp hover:bg-xp/25"
                : "bg-zinc-100 text-ink-950 hover:bg-white",
            )}
          >
            {equipped ? (
              <span className="flex items-center gap-1">
                <Check size={12} strokeWidth={3} /> Equipped
              </span>
            ) : (
              "Equip"
            )}
          </button>
        ) : (
          <button
            onClick={buy}
            disabled={pending || !affordable}
            title={affordable ? "Buy" : "Not enough gold"}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-[12px] font-medium text-ink-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Coins size={12} className="text-amber-600" />
            {item.cost}
          </button>
        )}
      </div>
    </Card>
  );
}

export function ShopClient({
  inventory,
  totalXp,
}: {
  inventory: Inventory;
  totalXp: number;
}) {
  void totalXp;
  return (
    <div className="space-y-6">
      {/* Wallet */}
      <Card className="animate-fade-up flex items-center gap-3 px-5 py-4">
        <Store size={16} className="text-zinc-500" />
        <span className="text-sm text-zinc-400">Your wallet</span>
        <span className="ml-auto flex items-center gap-1.5 font-pixel text-base font-bold text-xp">
          <Coins size={15} />
          <span className="tnum">{inventory.gold}</span>
        </span>
      </Card>

      {SECTIONS.map(({ type, label }) => {
        const items = SHOP_ITEMS.filter((i) => i.type === type);
        if (!items.length) return null;
        return (
          <section key={type}>
            <div className="mb-3 text-[13px] font-medium uppercase tracking-wider text-zinc-400">
              {label}
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {items.map((item) => (
                <ShopItemCard key={item.id} item={item} inventory={inventory} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
