"use client";

import { Check, Coins, Search, Store } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { buyItemAction, equipItemAction } from "@/app/actions";
import { CompanionMark } from "@/components/character";
import { SHOP_ITEMS, type ShopItem, type ShopItemType } from "@/lib/shop";
import type { Inventory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "./ui";

const SECTIONS: { type: ShopItemType; label: string }[] = [
  { type: "frame", label: "Portrait Frames" },
  { type: "aura", label: "Auras" },
  { type: "companion", label: "Companions" },
  { type: "title", label: "Titles" },
  { type: "backdrop", label: "Backdrops" },
];

function ItemPreview({ item }: { item: ShopItem }) {
  if (item.type === "frame") {
    return (
      <div
        className={cn(
          "h-10 w-10 rounded-lg border-2 bg-[#17110c]",
          item.style ?? "border-ink-600",
        )}
      />
    );
  }
  if (item.type === "aura") {
    return (
      <div
        className={cn(
          "h-10 w-10 rounded-lg border border-ink-700 bg-[#17110c]",
          item.style,
        )}
      />
    );
  }
  if (item.type === "backdrop") {
    return (
      <div
        className={cn(
          "h-10 w-10 rounded-lg border border-ink-600",
          item.style ?? "bg-[#17110c]",
        )}
      />
    );
  }
  if (item.type === "companion") {
    return (
      <CompanionMark
        item={item}
        size={40}
        className="rounded-lg border border-ink-700 bg-[#17110c]"
      />
    );
  }
  return (
    <div className="flex h-10 max-w-[7.5rem] items-center rounded-lg border border-ink-700 bg-ink-800 px-2.5 font-pixel text-[9px] font-bold uppercase tracking-wider text-zinc-300">
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
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const catalog = useMemo(
    () =>
      q
        ? SHOP_ITEMS.filter(
            (i) =>
              i.name.toLowerCase().includes(q) ||
              i.description.toLowerCase().includes(q) ||
              i.type.includes(q) ||
              (i.titleText ?? "").toLowerCase().includes(q),
          )
        : SHOP_ITEMS,
    [q],
  );

  return (
    <div className="space-y-6">
      <Card className="animate-fade-up flex flex-wrap items-center gap-3 px-5 py-4">
        <Store size={16} className="text-zinc-500" />
        <span className="text-sm text-zinc-400">Your wallet</span>
        <span className="ml-auto flex items-center gap-1.5 font-pixel text-base font-bold text-xp">
          <Coins size={15} />
          <span className="tnum">{inventory.gold}</span>
        </span>
        <span className="text-[11px] uppercase tracking-wider text-zinc-600">
          {SHOP_ITEMS.length} in stock · {inventory.owned.length} owned
        </span>
      </Card>

      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search frames, auras, pets, titles…"
          className="w-full rounded-lg border border-ink-700 bg-ink-850 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-ink-600"
        />
      </div>

      {SECTIONS.map(({ type, label }) => {
        const items = catalog.filter((i) => i.type === type);
        if (!items.length) return null;
        return (
          <section key={type}>
            <div className="mb-3 flex items-baseline justify-between">
              <div className="text-[13px] font-medium uppercase tracking-wider text-zinc-400">
                {label}
              </div>
              <div className="text-[11px] tabular-nums text-zinc-600">
                {items.length}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {items.map((item) => (
                <ShopItemCard key={item.id} item={item} inventory={inventory} />
              ))}
            </div>
          </section>
        );
      })}

      {catalog.length === 0 && (
        <p className="py-10 text-center text-sm text-zinc-500">
          Nothing in stock matches that.
        </p>
      )}
    </div>
  );
}
