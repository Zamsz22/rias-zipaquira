// Lee los datos desde Supabase. Muestra los valores tal cual y el índice pondera
// solo los componentes que tienen dato.

import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { PRESTADORES } from "@/lib/prestadores";
import { PESOS_COMPONENTES, type Componente } from "@/lib/scoring";
import type { AnalisisIA } from "@/lib/analisis";

export type EpsItem = { id: string; eps: string; ips: string };

export type Resultado = {
  id: string;
  eps: string;
  ips: string;
  componentes: Record<Componente, number | null>; // null = sin dato en los Excel
  conteos: Record<Componente, number>; // registros cargados por componente
  medidos: Componente[];
  indice: number;
  fuente: "supabase" | "demo";
};

export type RegistroFila = {
  tipo: string;
  hoja: string;
  datos: Record<string, string | number>;
};

const COMPONENTES = Object.keys(PESOS_COMPONENTES) as Componente[];
const round = (x: number) => Math.round(x * 10) / 10;

async function epsConDatos(): Promise<Set<string>> {
  const set = new Set<string>();
  if (!supabaseConfigurado) return set;
  const supabase = await createClient();
  if (!supabase) return set;
  const { data } = await supabase.from("cargas").select("eps_id");
  (data ?? []).forEach((c: { eps_id: string }) => set.add(c.eps_id));
  return set;
}

// TODAS las EPS registradas (con o sin datos). La usa Cargar / Nueva EPS para que
// una EPS recién creada se pueda seleccionar aunque todavía no tenga archivos.
export async function getEpsTodas(): Promise<EpsItem[]> {
  const todas: EpsItem[] = [];
  if (supabaseConfigurado) {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from("eps")
        .select("id, nombre, ips(nombre)")
        .order("created_at", { ascending: true });
      (data as { id: string; nombre: string; ips: { nombre: string }[] }[] | null)?.forEach((e) =>
        todas.push({ id: e.id, eps: e.nombre, ips: e.ips?.[0]?.nombre ?? "—" }),
      );
    }
  }
  return todas.length ? todas : PRESTADORES.map((p) => ({ id: p.id, eps: p.eps, ips: p.ips }));
}

// Lista de EPS CON datos cargados (dashboard / prestadores ocultan las vacías).
export async function getEpsList(): Promise<EpsItem[]> {
  const base = await getEpsTodas();
  const conDatos = await epsConDatos();
  const filtradas = base.filter((e) => conDatos.has(e.id));
  return filtradas.length ? filtradas : base;
}

async function leerValoresReales(): Promise<Map<string, Partial<Record<Componente, number>>>> {
  const mapa = new Map<string, Partial<Record<Componente, number>>>();
  if (!supabaseConfigurado) return mapa;
  const supabase = await createClient();
  if (!supabase) return mapa;
  const { data } = await supabase
    .from("resultados_componente")
    .select("eps_id, componente, valor_pct, created_at")
    .order("created_at", { ascending: true });
  for (const row of (data ?? []) as { eps_id: string; componente: Componente; valor_pct: number }[]) {
    const actual = mapa.get(row.eps_id) ?? {};
    actual[row.componente] = Number(row.valor_pct);
    mapa.set(row.eps_id, actual);
  }
  return mapa;
}

async function leerConteos(): Promise<Map<string, Record<string, number>>> {
  const mapa = new Map<string, Record<string, number>>();
  if (!supabaseConfigurado) return mapa;
  const supabase = await createClient();
  if (!supabase) return mapa;
  const { data } = await supabase.from("cargas").select("eps_id, tipo_documento, total_filas");
  for (const c of (data ?? []) as { eps_id: string; tipo_documento: string; total_filas: number }[]) {
    const actual = mapa.get(c.eps_id) ?? {};
    actual[c.tipo_documento] = (actual[c.tipo_documento] ?? 0) + (Number(c.total_filas) || 0);
    mapa.set(c.eps_id, actual);
  }
  return mapa;
}

export async function getResultados(): Promise<Resultado[]> {
  const [lista, reales, conteosMap] = await Promise.all([getEpsList(), leerValoresReales(), leerConteos()]);
  return lista.map((p) => {
    const real = reales.get(p.id) ?? {};
    const ct = conteosMap.get(p.id) ?? {};
    const componentes = {} as Record<Componente, number | null>;
    const conteos = {} as Record<Componente, number>;
    const medidos: Componente[] = [];
    let wsum = 0;
    let psum = 0;
    for (const c of COMPONENTES) {
      conteos[c] = ct[c] ?? 0;
      const v = real[c];
      if (v === undefined || v === null || isNaN(v)) {
        componentes[c] = null;
      } else {
        componentes[c] = v;
        medidos.push(c);
        wsum += PESOS_COMPONENTES[c] * v;
        psum += PESOS_COMPONENTES[c];
      }
    }
    return {
      id: p.id,
      eps: p.eps,
      ips: p.ips,
      componentes,
      conteos,
      medidos,
      indice: psum > 0 ? round(wsum / psum) : 0,
      fuente: medidos.length || Object.values(conteos).some((n) => n > 0) ? "supabase" : "demo",
    };
  });
}

export async function getResultado(id: string): Promise<Resultado | undefined> {
  const conDatos = (await getResultados()).find((r) => r.id === id);
  if (conDatos) return conDatos;
  // EPS registrada pero todavía sin Excel cargados: tarjeta vacía (no 404).
  const eps = (await getEpsTodas()).find((e) => e.id === id);
  if (!eps) return undefined;
  const componentes = {} as Record<Componente, number | null>;
  const conteos = {} as Record<Componente, number>;
  for (const c of COMPONENTES) {
    componentes[c] = null;
    conteos[c] = 0;
  }
  return { id: eps.id, eps: eps.eps, ips: eps.ips, componentes, conteos, medidos: [], indice: 0, fuente: "supabase" };
}

// Análisis de IA por componente (tipo_documento) de una EPS.
export async function getAnalisis(epsId: string): Promise<Record<string, AnalisisIA>> {
  const map: Record<string, AnalisisIA> = {};
  if (!supabaseConfigurado) return map;
  const supabase = await createClient();
  if (!supabase) return map;
  const { data } = await supabase
    .from("cargas")
    .select("tipo_documento, analisis")
    .eq("eps_id", epsId)
    .not("analisis", "is", null);
  for (const c of (data ?? []) as { tipo_documento: string; analisis: AnalisisIA }[]) {
    if (c.analisis) map[c.tipo_documento] = c.analisis;
  }
  return map;
}

export async function getRegistros(epsId: string): Promise<RegistroFila[]> {
  if (!supabaseConfigurado) return [];
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("registros")
    .select("tipo_documento, hoja, datos, created_at")
    .eq("eps_id", epsId)
    .order("created_at", { ascending: true })
    .limit(5000);
  const filas = ((data ?? []) as { tipo_documento: string; hoja: string; datos: Record<string, string | number> }[]).map(
    (r) => ({ tipo: r.tipo_documento, hoja: r.hoja, datos: r.datos }),
  );
  const TOPE: Record<string, number> = { adherencia_hc: 200 };
  const conteo: Record<string, number> = {};
  return filas.filter((f) => {
    conteo[f.tipo] = (conteo[f.tipo] ?? 0) + 1;
    return conteo[f.tipo] <= (TOPE[f.tipo] ?? 600);
  });
}
