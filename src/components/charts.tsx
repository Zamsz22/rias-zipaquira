"use client";

import { useEffect, useState } from "react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { clasificar } from "@/lib/scoring";
import { SemaforoDot } from "@/components/semaforo";

const TOOLTIP = { borderRadius: 12, border: "1px solid #eae8f6", fontSize: 13, boxShadow: "0 8px 24px rgba(38,22,90,.12)" };

// En celular las etiquetas del eje X se ponen VERTICALES (caben las 10 sin scroll);
// en tablet/laptop quedan inclinadas como siempre.
function useMovil() {
  const [movil, setMovil] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(max-width: 640px)");
    queueMicrotask(() => setMovil(q.matches)); // evita actualizar el estado durante el render
    const fn = (e: MediaQueryListEvent) => setMovil(e.matches);
    q.addEventListener("change", fn);
    return () => q.removeEventListener("change", fn);
  }, []);
  return movil;
}

// Medidor radial (gauge) con número grande al centro.
export function Gauge({ value, label }: { value: number; label?: string }) {
  const s = clasificar(value);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart
          innerRadius="74%"
          outerRadius="100%"
          data={[{ value }]}
          startAngle={220}
          endAngle={-40}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={20} fill={s.color} background={{ fill: "#eaf0f4" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-rias-azul">{value.toFixed(0)}%</span>
        <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: s.texto }}>
          <SemaforoDot color={s.color} size={9} /> {label ?? s.etiqueta}
        </span>
      </div>
    </div>
  );
}

// Área de tendencia (línea suave con relleno degradado).
export function TrendArea({ datos }: { datos: { label: string; value: number }[] }) {
  const movil = useMovil();
  return (
    <ResponsiveContainer width="100%" height={movil ? 280 : 240}>
      <AreaChart data={datos} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f5fd0" stopOpacity={0.38} />
            <stop offset="100%" stopColor="#16429b" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: movil ? 9 : 10, fill: "#5c6b75" }}
          interval={0}
          angle={movil ? -90 : -18}
          textAnchor="end"
          height={movil ? 96 : 56}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#5c6b75" }} />
        <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "Promedio"]} contentStyle={TOOLTIP} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#1f5fd0"
          strokeWidth={2.5}
          fill="url(#gradArea)"
          dot={{ r: 3, fill: "#1f5fd0" }}
          activeDot={{ r: 5 }}
          animationDuration={1100}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Barras por EPS (vertical), coloreadas por semáforo.
export function BarsByEps({ datos }: { datos: { nombre: string; indice: number }[] }) {
  const movil = useMovil();
  return (
    <ResponsiveContainer width="100%" height={movil ? 330 : 300}>
      <BarChart data={datos} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
        <XAxis
          dataKey="nombre"
          tick={{ fontSize: movil ? 9 : 10, fill: "#5c6b75" }}
          interval={0}
          angle={movil ? -90 : -22}
          textAnchor="end"
          height={movil ? 100 : 70}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#5c6b75" }} />
        <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "Índice"]} contentStyle={TOOLTIP} cursor={{ fill: "#f4f8fb" }} />
        <Bar dataKey="indice" radius={[8, 8, 0, 0]} animationDuration={1000}>
          {datos.map((d) => (
            <Cell key={d.nombre} fill={clasificar(d.indice).color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Radar: perfil de los componentes de una EPS.
export function RadarComponentes({ datos }: { datos: { eje: string; valor: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={datos} outerRadius="72%">
        <PolarGrid stroke="#dde7f8" />
        <PolarAngleAxis dataKey="eje" tick={{ fontSize: 10.5, fill: "#6c6a85" }} />
        <Radar
          dataKey="valor"
          stroke="#1f5fd0"
          strokeWidth={2}
          fill="#1f5fd0"
          fillOpacity={0.18}
          animationDuration={1000}
        />
        <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "Cumplimiento"]} contentStyle={TOOLTIP} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Dona de distribución por nivel de semáforo.
export function DistribucionDonut({
  datos,
}: {
  datos: { nombre: string; valor: number; color: string }[] }) {
  const total = datos.reduce((a, d) => a + d.valor, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={datos}
            dataKey="valor"
            nameKey="nombre"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={2}
            stroke="none"
            animationDuration={900}
          >
            {datos.map((d) => (
              <Cell key={d.nombre} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v, n) => [`${Number(v)} prestador(es)`, String(n)]} contentStyle={TOOLTIP} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-rias-azul">{total}</span>
        <span className="text-xs font-medium text-rias-tenue">prestadores</span>
      </div>
    </div>
  );
}
