"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { clasificar } from "@/lib/scoring";

type Dato = { nombre: string; indice: number };

export function IndiceChart({ datos }: { datos: Dato[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={datos} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4ecf1" vertical={false} />
        <XAxis
          dataKey="nombre"
          tick={{ fontSize: 11, fill: "#5c6b75" }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={70}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#5c6b75" }} />
        <Tooltip
          formatter={(v) => [`${Number(v).toFixed(1)}%`, "Índice integral"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e4ecf1", fontSize: 13 }}
        />
        <Bar dataKey="indice" radius={[8, 8, 0, 0]} animationDuration={1100}>
          {datos.map((d) => (
            <Cell key={d.nombre} fill={clasificar(d.indice).color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
