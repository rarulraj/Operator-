import type { WeightEntry, WeightUnit } from "./types";

export const LB_PER_KG = 2.2046226218;

export const WEIGHT_LIMITS: Record<WeightUnit, { min: number; max: number }> = {
  lb: { min: 50, max: 600 },
  kg: { min: 22, max: 272 },
};

export function toUnit(weight: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return weight;
  return from === "kg" ? weight * LB_PER_KG : weight / LB_PER_KG;
}

export function roundWeight(n: number): number {
  return Math.round(n * 10) / 10;
}

export function formatWeight(n: number, unit: WeightUnit): string {
  return `${n.toFixed(1)} ${unit}`;
}

export function formatDelta(n: number, unit: WeightUnit): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)} ${unit}`;
}

export function entryInUnit(entry: WeightEntry, unit: WeightUnit): number {
  return roundWeight(toUnit(entry.weight, entry.unit, unit));
}

export function sortedEntries(entries: WeightEntry[]): WeightEntry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function shortDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function isValidDateKey(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === (m ?? 1) - 1 && dt.getDate() === d;
}

export function weightInRange(weight: number, unit: WeightUnit): boolean {
  if (!Number.isFinite(weight)) return false;
  const { min, max } = WEIGHT_LIMITS[unit];
  return weight >= min && weight <= max;
}

export interface WeightPoint {
  date: string;
  label: string;
  weight: number;
  note: string;
}

export function series(entries: WeightEntry[], unit: WeightUnit): WeightPoint[] {
  return sortedEntries(entries).map((e) => ({
    date: e.date,
    label: shortDay(e.date),
    weight: entryInUnit(e, unit),
    note: e.note,
  }));
}

export interface WeightSnapshot {
  unit: WeightUnit;
  goal: number | null;
  latest: { date: string; weight: number; note: string } | null;
  previous: { date: string; weight: number } | null;
  delta: number | null;
  weekAvg: number | null;
  monthDelta: number | null;
  sinceStart: number | null;
  toGoal: number | null;
  loggedToday: boolean;
  todayWeight: number | null;
  streak: number;
  count: number;
}

export function snapshot(
  entries: WeightEntry[],
  unit: WeightUnit,
  goal: number | null,
  today: string,
): WeightSnapshot {
  const points = sortedEntries(entries).map((e) => ({
    date: e.date,
    weight: entryInUnit(e, unit),
    note: e.note,
  }));
  const latest = points[points.length - 1] ?? null;
  const previous = points.length > 1 ? points[points.length - 2] : null;
  const delta =
    latest && previous ? roundWeight(latest.weight - previous.weight) : null;

  const weekStart = addDays(today, -6);
  const week = points.filter((p) => p.date >= weekStart && p.date <= today);
  const weekAvg = week.length
    ? roundWeight(week.reduce((s, p) => s + p.weight, 0) / week.length)
    : null;

  let monthDelta: number | null = null;
  if (latest) {
    const cutoff = addDays(latest.date, -30);
    const baseline = [...points].reverse().find((p) => p.date <= cutoff);
    if (baseline) monthDelta = roundWeight(latest.weight - baseline.weight);
  }

  const sinceStart =
    latest && points.length > 1
      ? roundWeight(latest.weight - points[0].weight)
      : null;

  const toGoal =
    latest && goal != null ? roundWeight(goal - latest.weight) : null;

  const dates = new Set(points.map((p) => p.date));
  let cursor = dates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  const todayPoint = points.find((p) => p.date === today);

  return {
    unit,
    goal,
    latest,
    previous: previous ? { date: previous.date, weight: previous.weight } : null,
    delta,
    weekAvg,
    monthDelta,
    sinceStart,
    toGoal,
    loggedToday: !!todayPoint,
    todayWeight: todayPoint?.weight ?? null,
    streak,
    count: points.length,
  };
}
