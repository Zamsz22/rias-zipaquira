"use client";

import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { clasificar } from "@/lib/scoring";

export type PuntoBarra = { label: string; value: number };

export function MiniBar({ datos }: { datos: PuntoBarra[] }) {
  if (!datos.length) return null;
  return (
    <ResponsiveContainer width="100%" height={Math.min(60 + datos.length * 30, 360)}>
      <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4ecf1" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#5c6b75" }} />
        <YAxis
          type="category"
          dataKey="label"
          width={112}
          tick={{ fontSize: 11, fill: "#5c6b75" }}
          tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 17) + "…" : v)}
        />
        <Tooltip
          formatter={(v) => [`${Number(v).toFixed(1)}%`, "Cumplimiento"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e4ecf1", fontSize: 13 }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={900}>
          {datos.map((d, i) => (
            <Cell key={i} fill={clasificar(d.value).color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
