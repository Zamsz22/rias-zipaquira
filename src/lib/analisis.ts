// Resumen corto y exacto de cada componente para enviárselo a la IA.
// En vez de mandar el Excel entero, mandamos solo las cifras clave ya extraídas,
// así la IA trabaja con datos exactos.

import { etapaDeHoja } from "@/lib/etapas";

export type AnalisisIA = {
  resumen: string;
  nivel?: string;
  promedio?: number | null;
  hallazgos?: string[];
  alertas?: string[];
};

type Fila = { hoja: string; datos: Record<string, unknown> };

const n = (v: unknown): number | null => {
  const x = parseFloat(String(v ?? "").replace("%", "").replace(",", "."));
  return isNaN(x) ? null : x;
};
const get = (d: Record<string, unknown>, re: RegExp): string => {
  const k = Object.keys(d).find((x) => re.test(x));
  return k ? String(d[k] ?? "") : "";
};

const etapa = (r: Fila): string => (typeof r.datos.__etapa === "string" && r.datos.__etapa) || etapaDeHoja(r.hoja) || r.hoja;
const limpEsp = (k: string) => { const s = k.replace(/\s*1\s*vez/i, "").trim().toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); };

// Mantener en sincronía con scripts/generar-analisis.mjs (mismo resumen para la IA).
export function resumenCompacto(tipo: string, registros: Fila[]): string {
  const L: string[] = [];

  if (tipo === "indicadores") {
    const vals = registros.map((r) => n(get(r.datos, /cumplimiento del mes|cumplimiento/i))).filter((x): x is number => x != null && x >= 0 && x <= 100);
    const bajos = vals.filter((x) => x < 40).length;
    const optimos = vals.filter((x) => x >= 80).length;
    L.push(`${registros.length} mediciones de indicadores trazadores: ${bajos} por debajo del 40% (incumplimiento) y ${optimos} óptimas (≥80%).`);
    for (const r of registros) {
      const ind = get(r.datos, /nombre del indicador|indicador/i);
      if (!ind) continue;
      L.push(`${etapa(r)} | ${ind} | ${get(r.datos, /numerador/i)}/${get(r.datos, /denominador/i)} | ${get(r.datos, /cumplimiento|%/i)}`);
      if (L.length >= 55) break;
    }
  } else if (tipo === "adherencia_hc") {
    const g: Record<string, { n: number; sum: number }> = {};
    for (const r of registros) {
      const e = etapa(r);
      g[e] ??= { n: 0, sum: 0 };
      g[e].n++;
      g[e].sum += n(get(r.datos, /calificaci/i)) ?? 0;
    }
    for (const [e, v] of Object.entries(g)) L.push(`${e} | ${v.n} pacientes | calificación promedio ${v.n ? (v.sum / v.n).toFixed(1) : 0}%`);
  } else if (tipo === "anexos") {
    const g: Record<string, { n: number; sum: number; cnt: number }> = {};
    for (const r of registros) {
      const a = r.hoja;
      g[a] ??= { n: 0, sum: 0, cnt: 0 };
      g[a].n++;
      const p = n(get(r.datos, /cumplimiento|calificaci/i));
      if (p != null) { g[a].sum += p; g[a].cnt++; }
    }
    for (const [a, v] of Object.entries(g)) L.push(`${a} | ${v.n} aspectos | cumplimiento promedio ${v.cnt ? (v.sum / v.cnt).toFixed(1) : "0"}%`);
  } else if (tipo === "biomedica") {
    for (const r of registros) {
      L.push(`${get(r.datos, /servicio/i)} | calificación ${get(r.datos, /calificaci/i)} | ${get(r.datos, /hallazgo/i).slice(0, 60)}`);
      if (L.length >= 40) break;
    }
  } else if (tipo === "capacidad") {
    const def = registros.filter((r) => /d[ée]ficit/i.test(String(r.datos.Estado ?? "")));
    L.push(`${registros.length} servicios · ${registros.length - def.length} con dotación suficiente, ${def.length} en déficit.`);
    for (const r of def.slice(0, 20)) L.push(`- ${r.datos.Servicio}: reporta ${r.datos.Reporta} / requiere ${r.datos.Requiere}`);
  } else if (tipo === "oportunidad") {
    const fallas: Record<string, number> = {};
    for (const r of registros) for (const e of (Array.isArray(r.datos.__incumple) ? (r.datos.__incumple as string[]) : [])) fallas[limpEsp(e)] = (fallas[limpEsp(e)] || 0) + 1;
    L.push(`${registros.length} meses evaluados contra la Resolución 1552 (días máximos por especialidad). "No agenda disponible" también incumple.`);
    const ord = Object.entries(fallas).sort((a, b) => b[1] - a[1]);
    if (ord.length) { L.push("Especialidades que INCUMPLEN:"); for (const [e, c] of ord) L.push(`- ${e}: incumple en ${c} de ${registros.length} meses`); }
    for (const r of registros) L.push(`${r.datos.Mes}: cumple ${r.datos["Cumple Res.1552"]}`);
  } else if (tipo === "alertas") {
    const gest = registros.filter((r) => /gestionada/i.test(String(r.datos.Estado ?? ""))).length;
    L.push(`${registros.length} alertas tempranas · ${gest} gestionadas con resultado (${registros.length ? ((gest / registros.length) * 100).toFixed(1) : 0}%).`);
    for (const r of registros.slice(0, 8)) L.push(`- ${String(r.datos.Alerta ?? "").slice(0, 80)} → ${String(r.datos["Acción realizada"] ?? "").slice(0, 60)}`);
  } else if (tipo === "medicamentos" || tipo === "laboratorios") {
    const esLab = tipo === "laboratorios";
    const verbo = esLab ? "realización" : "entrega";
    const dist: Record<string, number> = {};
    for (const r of registros) { const e = String(r.datos.Estado ?? "Sin dato"); dist[e] = (dist[e] || 0) + 1; }
    const C = dist["Cumplida"] || 0, NC = dist["No cumplida"] || 0, SC = dist["Sin contactar"] || 0, P = dist["Pendiente"] || 0;
    const den = C + NC + SC + P;
    L.push(`Cumplimiento REAL de ${verbo} de ${esLab ? "laboratorios" : "medicamentos"} = ${den ? ((C / den) * 100).toFixed(1) : 0}% = ${C} cumplidas / ${den} con seguimiento. No cumplidas: ${NC}. Sin contactar (cuenta en contra): ${SC}. Pendientes: ${P}.`);
    for (const [e, c] of Object.entries(dist)) L.push(`${e}: ${c}`);
  } else if (tipo === "plan_mejora") {
    const c: Record<string, number> = { Efectivo: 0, "No efectivo": 0, "En seguimiento": 0 };
    for (const r of registros) { const k = String(r.datos.Resultado ?? ""); if (k in c) c[k]++; }
    const cerrados = c.Efectivo + c["No efectivo"];
    L.push(`MÓDULO Plan de Mejora (indicador, sin porcentaje): ${registros.length} hallazgos · ${c.Efectivo} EFECTIVOS, ${c["No efectivo"]} NO EFECTIVOS, ${c["En seguimiento"]} en seguimiento. Efectividad de los cerrados: ${cerrados ? ((c.Efectivo / cerrados) * 100).toFixed(1) : 0}%.`);
    for (const r of registros.slice(0, 15)) L.push(`- [${r.datos.Resultado}] ${get(r.datos, /ruta|programa/i)}: ${get(r.datos, /descripci|hallazgo/i).slice(0, 90)}`);
  } else if (tipo === "canalizacion") {
    L.push("Canalización efectiva por riesgo (canalizados vs. efectivos). % = efectivos / canalizados.");
    for (const r of registros) L.push(`${r.datos.Riesgo} | canalizados ${r.datos.Canalizados} | efectivos ${r.datos.Efectivos} | ${r.datos.Cumplimiento} → ${r.datos.Resultado}`);
  } else {
    for (const r of registros.slice(0, 30)) L.push(Object.values(r.datos).map((x) => String(x ?? "")).filter(Boolean).slice(0, 5).join(" | "));
  }
  return L.join("\n").slice(0, 7000);
}

// Llama al Worker de Cloudflare y devuelve el análisis (o null si falla).
export async function analizarConIA(
  url: string,
  payload: { tipo: string; eps: string; muestra: string },
): Promise<AnalisisIA | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    return d?.ok && d.analisis ? (d.analisis as AnalisisIA) : null;
  } catch {
    return null;
  }
}

export const ANALYZER_URL =
  process.env.NEXT_PUBLIC_ANALYZER_URL || "https://rias.davidsambr716.workers.dev/";
