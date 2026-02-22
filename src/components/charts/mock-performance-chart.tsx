"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface MockPerformanceChartProps {
  data: Array<{
    label: string;
    score: number;
  }>;
}

export function MockPerformanceChart({ data }: MockPerformanceChartProps) {
  if (!data.length) {
    return <p className="text-sm text-slate-300">No mock tests attempted yet.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
          <XAxis dataKey="label" stroke="#cbd5e1" fontSize={12} />
          <YAxis stroke="#cbd5e1" fontSize={12} />
          <Tooltip
            formatter={(value) => [`${value}%`, "Score"]}
            contentStyle={{
              backgroundColor: "rgba(15,23,42,0.92)",
              borderColor: "rgba(148,163,184,0.35)",
              borderRadius: "12px",
            }}
          />
          <Bar dataKey="score" fill="#53c1ff" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
