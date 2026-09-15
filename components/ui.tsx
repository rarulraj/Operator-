import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// ── Design system primitives ────────────────────────────────────────────────

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-700/60 bg-ink-900/70 shadow-[3px_3px_0_0_rgba(0,0,0,0.30)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  icon,
  action,
  className,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between px-5 pt-4 pb-1", className)}>
      <div className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-wider text-zinc-400">
        {icon}
        {title}
      </div>
      {action}
    </div>
  );
}

export function Progress({
  value,
  className,
  barClassName,
  shimmer = false,
}: {
  value: number; // 0-1
  className?: string;
  barClassName?: string;
  shimmer?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink-700/70", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-xp transition-[width] duration-700 ease-out",
          shimmer && "xp-shimmer",
          barClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-ink-600/60 bg-ink-800/80 px-2 py-0.5 text-[11px] font-medium text-zinc-300",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" &&
          "bg-zinc-100 text-ink-950 hover:bg-white active:bg-zinc-300",
        variant === "ghost" &&
          "border border-ink-600/70 bg-ink-800/60 text-zinc-300 hover:border-ink-600 hover:text-zinc-100",
        variant === "danger" &&
          "border border-red-900/60 bg-red-950/40 text-red-300 hover:bg-red-950/70",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
