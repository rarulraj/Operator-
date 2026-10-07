"use client";

// ── Idle Mode ───────────────────────────────────────────────────────────────
// A full-bleed pixel-art farm scene that doubles as a screensaver. The
// backdrop swaps with the real time of day. Exits on any click or keypress.

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { findShopItem, type ShopItem } from "@/lib/shop";
import type { Inventory } from "@/lib/types";
import { levelFromXp, rankFromXp, type Rank } from "@/lib/xp";
import { AURA_STYLES, FRAME_STYLES, STAGE_BY_RANK, CompanionMark } from "./character";

/** Deterministic PRNG so the firefly layout is stable across renders. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function IdleScene({
  name,
  totalXp,
  streak,
  inventory,
  rankTiers = [],
  shopStock = [],
}: {
  name: string;
  totalXp: number;
  streak: number;
  inventory: Inventory;
  rankTiers?: Rank[];
  shopStock?: ShopItem[];
}) {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    const exit = () => router.push("/");
    window.addEventListener("keydown", exit);
    return () => {
      window.removeEventListener("keydown", exit);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [router]);

  const rank = rankFromXp(totalXp, rankTiers);
  const stage =
    STAGE_BY_RANK[rank.title] ??
    (rank.minXp >= 10450 ? STAGE_BY_RANK["Master Operator"] : STAGE_BY_RANK.Apprentice);
  const lvl = levelFromXp(totalXp);

  const equipped = inventory.equipped;
  const frame = equipped.find((id) => id.startsWith("frame-"));
  const aura = equipped.find((id) => id.startsWith("aura-"));
  const companionId = equipped.find((id) => id.startsWith("companion-"));
  const companion = companionId ? findShopItem(companionId, shopStock) : null;
  const upgrade = equipped
    .map((id) => findShopItem(id, shopStock))
    .find((item) => item?.type === "upgrade");
  const frameClass =
    (frame && (FRAME_STYLES[frame] ?? findShopItem(frame, shopStock)?.style)) ?? "border-black/40";
  const glowClass =
    (aura && (AURA_STYLES[aura] ?? findShopItem(aura, shopStock)?.style)) ?? "sprite-glow";

  // Daylight 6am to 7pm; night art otherwise. Defaults to night pre-hydration.
  const hour = now?.getHours() ?? 21;
  const isDay = hour >= 6 && hour < 19;

  const fireflies = useMemo(() => {
    const rand = mulberry32(42);
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: 6 + rand() * 88,
      top: 52 + rand() * 34,
      delay: rand() * 7,
      duration: 6 + rand() * 6,
    }));
  }, []);

  return (
    <div
      onClick={() => router.push("/")}
      role="button"
      aria-label="Exit idle mode"
      className="fixed inset-0 z-50 cursor-pointer overflow-hidden bg-[#0d1020]"
    >
      {/* Scene backdrop */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={isDay ? "/idle-day.png" : "/idle-night.png"}
        alt=""
        className="pixelated absolute inset-0 h-full w-full object-cover"
      />

      {/* Fireflies (night only) */}
      {!isDay &&
        fireflies.map((f) => (
          <div
            key={f.id}
            className="absolute h-[3px] w-[3px] rounded-full"
            style={{
              left: `${f.left}%`,
              top: `${f.top}%`,
              background: "#ffe9a3",
              boxShadow: "0 0 7px rgba(255,214,102,0.9)",
              animation: `firefly-float ${f.duration}s ease-in-out ${f.delay}s infinite`,
            }}
          />
        ))}

      {/* Character standing on the path */}
      <div className="absolute bottom-[11%] left-1/2 -translate-x-1/2">
        <div className="relative flex items-end gap-2">
          {companion && (
            <CompanionMark
              item={companion}
              size={74}
              className="animate-sprite-idle drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]"
            />
          )}
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={stage.src}
              alt={`${name}: ${stage.stage}`}
              width={210}
              height={210}
              className={`animate-sprite-idle ${glowClass} pixelated rounded-2xl border-2 ${frameClass} drop-shadow-[0_8px_14px_rgba(0,0,0,0.65)]`}
            />
            {upgrade && (
              <span
                className="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-xl border border-black/40 bg-[#17110c] text-2xl leading-none"
                aria-label={upgrade.name}
              >
                {upgrade.glyph ?? "⚔️"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Clock: the screensaver's main readout */}
      <div className="absolute left-1/2 top-[9%] -translate-x-1/2 text-center">
        <div
          className="tnum font-pixel text-6xl font-bold tracking-tight text-amber-50"
          style={{ textShadow: "0 3px 0 rgba(0,0,0,0.65), 0 0 26px rgba(0,0,0,0.5)" }}
        >
          {now
            ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "--:--"}
        </div>
        <div
          className="mt-2.5 font-pixel text-[11px] uppercase tracking-[0.2em] text-amber-100/85"
          style={{ textShadow: "0 2px 0 rgba(0,0,0,0.6)" }}
        >
          {now
            ? now.toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
            : ""}
        </div>
      </div>

      {/* Stats plaque */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <div className="inline-flex items-center gap-3 rounded-lg border border-black/50 bg-black/45 px-4 py-2 font-pixel text-[10px] uppercase tracking-wider text-amber-50 backdrop-blur-sm">
          <span>{name}</span>
          <span className="text-amber-100/40">·</span>
          <span>Lv {lvl.level}</span>
          <span className="text-amber-100/40">·</span>
          <span>{rank.title}</span>
          <span className="text-amber-100/40">·</span>
          <span>{streak}d streak</span>
          <span className="text-amber-100/40">·</span>
          <span className="tnum text-xp">{inventory.gold}g</span>
        </div>
        <div className="mt-2.5 text-[10px] text-amber-50/45">
          Click anywhere or press any key to return
        </div>
      </div>
    </div>
  );
}
