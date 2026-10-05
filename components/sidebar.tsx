"use client";

import {
  BarChart3,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessageSquare,
  MoonStar,
  Network,
  Waypoints,
  PenLine,
  Scale,
  ScrollText,
  Settings,
  ShoppingBag,
  StickyNote,
  Swords,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { markNavStart } from "@/components/nav-progress";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quest", label: "Daily Quest", icon: ScrollText },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/skills", label: "Skill Tree", icon: Network },
  { href: "/missions", label: "Missions", icon: Swords },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/log", label: "Activity Log", icon: PenLine },
  { href: "/weight", label: "Weight", icon: Scale },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/graph", label: "Knowledge", icon: Waypoints },
  { href: "/idle", label: "Idle Mode", icon: MoonStar },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={() => {
              markNavStart();
              onNavigate?.();
            }}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
              active
                ? "bg-ink-800 text-zinc-100"
                : "text-zinc-400 hover:bg-ink-850 hover:text-zinc-200",
            )}
          >
            <item.icon
              size={17}
              strokeWidth={1.8}
              className={cn(
                "transition-colors",
                active ? "text-xp" : "text-zinc-500 group-hover:text-zinc-300",
              )}
            />
            {item.label}
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-xp" />}
          </Link>
        );
      })}
    </nav>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon.png"
        alt="Operator"
        width={34}
        height={34}
        className="pixelated rounded-lg border border-ink-600 shadow-[2px_2px_0_0_rgba(0,0,0,0.35)]"
      />
      <div>
        <div className="font-pixel text-[15px] font-bold tracking-tight text-zinc-100">
          Operator
        </div>
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          Personal RPG
        </div>
      </div>
    </Link>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col overflow-y-auto border-r border-ink-800 bg-ink-900/85 md:flex">
        <Wordmark />
        <NavLinks />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-ink-800 bg-ink-950 px-4 py-3 md:hidden">
        <Wordmark />
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-ink-700 p-2 text-zinc-300"
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-30 bg-ink-950/95 pt-16 backdrop-blur md:hidden">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
