"use client";

import { Scale, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  deleteWeightAction,
  saveWeightAction,
  setWeightPrefsAction,
} from "@/app/actions";
import type { WeightEntry, WeightUnit } from "@/lib/types";
import {
  entryInUnit,
  formatDay,
  formatDelta,
  formatWeight,
  roundWeight,
  series,
  snapshot,
  toUnit,
  type WeightPoint,
} from "@/lib/weight";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader } from "./ui";

const fieldClass =
  "rounded-lg border border-ink-700 bg-ink-850/70 px-3.5 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-ink-600 focus:outline-none";

const tooltipStyle = {
  backgroundColor: "#1e160d",
  border: "1px solid #41321f",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#e4e4e7",
};

function goalPhrase(toGoal: number, unit: WeightUnit): string {
  if (toGoal === 0) return "At goal";
  const amount = formatWeight(Math.abs(toGoal), unit);
  return toGoal > 0 ? `${amount} below goal` : `${amount} above goal`;
}

function WeightChart({
  points,
  unit,
  goal,
}: {
  points: WeightPoint[];
  unit: WeightUnit;
  goal: number | null;
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-zinc-500">
        Log a weight and the trend shows up here.
      </div>
    );
  }
  const values = points.map((p) => p.weight);
  if (goal != null) values.push(goal);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = unit === "kg" ? 1 : 2;
  const lo = Math.floor(min - pad);
  const hi = Math.ceil(max + pad);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#322517" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={{ stroke: "#41321f" }}
          tickLine={false}
          minTickGap={28}
        />
        <YAxis
          domain={[lo, hi]}
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={(v: number) => `${v}`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, _name, item) => {
            const row = item?.payload as WeightPoint | undefined;
            const label = formatWeight(Number(value), unit);
            return [row?.note ? `${label} · ${row.note}` : label, "Weight"];
          }}
          labelFormatter={(_label, payload) => {
            const row = payload?.[0]?.payload as WeightPoint | undefined;
            return row ? formatDay(row.date) : "";
          }}
        />
        {goal != null && (
          <ReferenceLine
            y={goal}
            stroke="#f2b83b"
            strokeDasharray="4 4"
            label={{
              value: `Goal ${formatWeight(goal, unit)}`,
              fill: "#f2b83b",
              fontSize: 11,
              position: "insideTopRight",
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="weight"
          stroke="#fb7185"
          strokeWidth={2}
          fill="url(#weightFill)"
          dot={{ r: 3, fill: "#fb7185", stroke: "#1e160d", strokeWidth: 1 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WeightCard({
  today,
  unit,
  goal,
  entries,
}: {
  today: string;
  unit: WeightUnit;
  goal: number | null;
  entries: WeightEntry[];
}) {
  const snap = snapshot(entries, unit, goal, today);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function logToday() {
    const weight = Number(value);
    if (!value.trim() || !Number.isFinite(weight)) {
      setError("Enter a number.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await saveWeightAction({ date: today, weight, note: "" });
      if (!res.ok) setError(res.error);
      else setValue("");
    });
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Weight"
        icon={<Scale size={14} className="text-zinc-500" />}
        action={
          <Link href="/weight" className="text-[11px] text-zinc-500 hover:text-zinc-300">
            History
          </Link>
        }
      />
      <div className="px-5 pb-4 pt-1">
        {snap.loggedToday && snap.todayWeight != null ? (
          <div>
            <div className="tnum text-2xl font-semibold text-zinc-100">
              {formatWeight(snap.todayWeight, unit)}
            </div>
            <p className="mt-1 text-[12px] text-zinc-500">
              Logged today
              {snap.delta != null && snap.previous
                ? ` · ${formatDelta(snap.delta, unit)} vs ${formatDay(snap.previous.date)}`
                : ""}
              {snap.weekAvg != null ? ` · 7-day ${formatWeight(snap.weekAvg, unit)}` : ""}
            </p>
          </div>
        ) : (
          <div>
            {snap.latest && (
              <p className="mb-2 text-[12px] text-zinc-500">
                Last {formatWeight(snap.latest.weight, unit)} on {formatDay(snap.latest.date)}
                {snap.delta != null ? ` (${formatDelta(snap.delta, unit)})` : ""}
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && logToday()}
                placeholder={`Today, ${unit}`}
                className={cn(fieldClass, "tnum w-full")}
                aria-label="Today's weight"
              />
              <Button onClick={logToday} disabled={pending}>
                {pending ? "Saving…" : "Log"}
              </Button>
            </div>
            {error && <p className="mt-2 text-[12px] text-red-400">{error}</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

export function WeightClient({
  today,
  unit,
  goal,
  entries,
}: {
  today: string;
  unit: WeightUnit;
  goal: number | null;
  entries: WeightEntry[];
}) {
  const todayEntry = entries.find((e) => e.date === today);
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState(
    todayEntry ? entryInUnit(todayEntry, unit).toFixed(1) : "",
  );
  const [note, setNote] = useState(todayEntry?.note ?? "");
  const [goalText, setGoalText] = useState(goal != null ? String(goal) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [seenUnit, setSeenUnit] = useState(unit);
  if (seenUnit !== unit) {
    const from = seenUnit;
    setSeenUnit(unit);
    setWeight((w) => {
      const n = Number(w);
      const entry = entries.find((e) => e.date === date);
      if (entry && Number.isFinite(n) && Math.abs(n - entryInUnit(entry, from)) < 0.05) {
        return entryInUnit(entry, unit).toFixed(1);
      }
      if (!w.trim() || !Number.isFinite(n)) return w;
      return roundWeight(toUnit(n, from, unit)).toFixed(1);
    });
  }

  const goalKey = `${unit}:${goal ?? ""}`;
  useEffect(() => {
    setGoalText(goal != null ? String(goal) : "");
  }, [goalKey, goal]);

  const snap = snapshot(entries, unit, goal, today);
  const points = series(entries, unit);
  const history = [...points].reverse();

  function selectDate(next: string) {
    setDate(next);
    const entry = entries.find((e) => e.date === next);
    setWeight(entry ? entryInUnit(entry, unit).toFixed(1) : "");
    setNote(entry?.note ?? "");
    setError(null);
  }

  function save() {
    const n = Number(weight);
    if (!weight.trim() || !Number.isFinite(n)) {
      setError("Enter a weight.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await saveWeightAction({ date, weight: n, note });
      if (!res.ok) setError(res.error);
    });
  }

  function remove(day: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteWeightAction(day);
      if (!res.ok) setError(res.error);
      else if (day === date) {
        setWeight("");
        setNote("");
      }
    });
  }

  function changeUnit(next: WeightUnit) {
    if (next === unit) return;
    setError(null);
    startTransition(async () => {
      const res = await setWeightPrefsAction({ unit: next });
      if (!res.ok) setError(res.error);
    });
  }

  function saveGoal() {
    setError(null);
    const trimmed = goalText.trim();
    startTransition(async () => {
      const res = await setWeightPrefsAction({
        goal: trimmed === "" ? null : Number(trimmed),
      });
      if (!res.ok) setError(res.error);
    });
  }

  const stats = [
    {
      label: "Latest",
      value: snap.latest ? formatWeight(snap.latest.weight, unit) : "—",
      hint: snap.latest
        ? snap.delta != null
          ? `${formatDelta(snap.delta, unit)} vs prior`
          : formatDay(snap.latest.date)
        : "Nothing logged",
    },
    {
      label: "7-day avg",
      value: snap.weekAvg != null ? formatWeight(snap.weekAvg, unit) : "—",
      hint: "Entries in the last 7 days",
    },
    {
      label: "30-day",
      value: snap.monthDelta != null ? formatDelta(snap.monthDelta, unit) : "—",
      hint: snap.monthDelta != null ? "Vs ~30 days ago" : "Needs a month of history",
    },
    {
      label: "Logged streak",
      value: snap.streak ? `${snap.streak}d` : "—",
      hint: snap.loggedToday ? "Today is in" : "Today is still open",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="px-4 py-3">
            <div className="tnum text-xl font-semibold text-zinc-100">{s.value}</div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">{s.label}</div>
            <div className="mt-1 text-[11px] text-zinc-600">{s.hint}</div>
          </Card>
        ))}
      </div>

      <Card className="animate-fade-up">
        <CardHeader
          title={date === today ? "Today" : formatDay(date)}
          icon={<Scale size={14} className="text-zinc-500" />}
          action={
            <div className="flex rounded-lg border border-ink-700 p-0.5 text-[12px]">
              {(["lb", "kg"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => changeUnit(u)}
                  className={cn(
                    "rounded-md px-2.5 py-1 uppercase tracking-wide",
                    unit === u ? "bg-ink-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          }
        />
        <div className="space-y-3 px-5 pb-5 pt-2">
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              max={today}
              value={date}
              onChange={(e) => selectDate(e.target.value)}
              className={cn(fieldClass, "tnum")}
              aria-label="Weigh-in date"
            />
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder={unit}
              className={cn(fieldClass, "tnum w-28")}
              aria-label="Weight"
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="Optional note"
              maxLength={200}
              className={cn(fieldClass, "min-w-[12rem] flex-1")}
              aria-label="Note"
            />
            <Button onClick={save} disabled={pending}>
              {pending ? "Saving…" : entries.some((e) => e.date === date) ? "Update" : "Log"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveGoal()}
              placeholder={`Goal (${unit})`}
              className={cn(fieldClass, "tnum w-32")}
              aria-label="Goal weight"
            />
            <Button variant="ghost" onClick={saveGoal} disabled={pending}>
              {goalText.trim() ? "Set goal" : "Clear goal"}
            </Button>
            {snap.toGoal != null && (
              <span className="text-[12px] text-xp">{goalPhrase(snap.toGoal, unit)}</span>
            )}
            {snap.sinceStart != null && (
              <span className="inline-flex items-center gap-1 text-[12px] text-zinc-500">
                {snap.sinceStart > 0 ? (
                  <TrendingUp size={12} />
                ) : snap.sinceStart < 0 ? (
                  <TrendingDown size={12} />
                ) : null}
                {formatDelta(snap.sinceStart, unit)} since first log
              </span>
            )}
          </div>
          {error && <p className="text-[12px] text-red-400">{error}</p>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Trend" icon={<TrendingUp size={14} className="text-zinc-500" />} />
        <div className="px-3 pb-4 pt-2">
          <WeightChart points={points} unit={unit} goal={goal} />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Log"
          action={
            <span className="tnum text-[11px] text-zinc-600">{snap.count} entries</span>
          }
        />
        <div className="px-3 pb-3 pt-1">
          {history.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-zinc-500">
              No weigh-ins yet. One number a day is the whole habit.
            </p>
          )}
          <ul>
            {history.map((row) => (
              <li key={row.date}>
                <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-ink-850/80">
                  <button
                    type="button"
                    onClick={() => selectDate(row.date)}
                    className="flex min-w-0 flex-1 items-baseline gap-3 text-left"
                  >
                    <span className="w-28 shrink-0 text-[12px] text-zinc-500">
                      {formatDay(row.date)}
                    </span>
                    <span className="tnum text-sm font-medium text-zinc-100">
                      {formatWeight(row.weight, unit)}
                    </span>
                    {row.note && (
                      <span className="truncate text-[12px] text-zinc-500">{row.note}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(row.date)}
                    className="rounded p-1 text-zinc-600 hover:text-zinc-300"
                    aria-label={`Delete ${formatDay(row.date)}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
