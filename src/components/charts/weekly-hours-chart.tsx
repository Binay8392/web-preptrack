"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";

interface WeeklyHoursChartProps {
  data: Array<{
    weekLabel: string;
    hours: number;
  }>;
  variant?: "area" | "line";
}

export function WeeklyHoursChart({ data, variant = "area" }: WeeklyHoursChartProps) {
  if (!data.length) {
    return <p className="text-sm text-slate-300">No study hours logged yet.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {variant === "area" ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ee7a8" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#4ee7a8" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
            <XAxis dataKey="weekLabel" stroke="#cbd5e1" fontSize={12} />
            <YAxis stroke="#cbd5e1" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15,23,42,0.92)",
                borderColor: "rgba(148,163,184,0.35)",
                borderRadius: "12px",
              }}
            />
            <Area type="monotone" dataKey="hours" stroke="#4ee7a8" strokeWidth={2} fill="url(#hoursGradient)" />
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
            <XAxis dataKey="weekLabel" stroke="#cbd5e1" fontSize={12} />
            <YAxis stroke="#cbd5e1" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15,23,42,0.92)",
                borderColor: "rgba(148,163,184,0.35)",
                borderRadius: "12px",
              }}
            />
            <Line type="monotone" dataKey="hours" stroke="#53c1ff" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
