"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklyXpPoint } from "@/lib/insights";

const tooltipStyle = {
  backgroundColor: "#141418",
  border: "1px solid #26262e",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#e4e4e7",
};

export function WeeklyXpChart({ data }: { data: WeeklyXpPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={22}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1b1b21" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={{ stroke: "#26262e" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1b1b21" }} />
        <Bar dataKey="ai_gtm" name="AI GTM" stackId="xp" fill="#38bdf8" radius={[0, 0, 0, 0]} />
        <Bar dataKey="tfe" name="TFE" stackId="xp" fill="#a78bfa" radius={[0, 0, 0, 0]} />
        <Bar dataKey="reefly" name="Reefly" stackId="xp" fill="#34d399" radius={[0, 0, 0, 0]} />
        <Bar dataKey="work" name="Work" stackId="xp" fill="#fb923c" radius={[0, 0, 0, 0]} />
        <Bar dataKey="physical" name="Physical" stackId="xp" fill="#fb7185" radius={[0, 0, 0, 0]} />
        <Bar dataKey="social" name="Social" stackId="xp" fill="#2dd4bf" radius={[0, 0, 0, 0]} />
        <Bar dataKey="wealth" name="Wealth" stackId="xp" fill="#facc15" radius={[0, 0, 0, 0]} />
        <Bar dataKey="brand" name="Brand" stackId="xp" fill="#e879f9" radius={[0, 0, 0, 0]} />
        <Bar dataKey="general" name="General" stackId="xp" fill="#71717a" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({
  data,
}: {
  data: { name: string; value: number; fill: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={85}
            strokeWidth={2}
            stroke="#09090b"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-xl font-semibold text-zinc-100">
          {total.toLocaleString()}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          Total XP
        </span>
      </div>
    </div>
  );
}

export function CumulativeChart({
  data,
}: {
  data: { day: string; xp: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1b1b21" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: "#71717a", fontSize: 10 }}
          axisLine={{ stroke: "#26262e" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="xp"
          name="Total XP"
          stroke="#fbbf24"
          strokeWidth={2}
          fill="url(#xpGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
