"use client";

import { useState } from "react";
import { clasificar, type Componente } from "@/lib/scoring";
import { SemaforoPill } from "@/components/semaforo";
import { MiniBar, type PuntoBarra } from "@/components/mini-bar";
import type { RegistroFila } from "@/lib/data";
import { etapaDeHoja, detalleHoja } from "@/lib/etapas";
import type { AnalisisIA } from "@/lib/analisis";
import { LayoutGrid, Table2, Sparkles, AlertTriangle } from "lucide-react";

const TABS = [
  "Adherencia HC",
  "Indicadores",
  "Anexos",
  "Capacidad",
  "Biomédica",
  "Alertas",
  "Canalización",
  "Oportunidad",
  "Medicamentos",
  "Laboratorios",
] as const;

type Tab = (typeof TABS)[number];

const TAB_TIPO: Partial<Record<Tab, string>> = {
  "Adherencia HC": "adherencia_hc",
  Indicadores: "indicadores",
  Anexos: "anexos",
  Capacidad: "capacidad",
  Biomédica: "biomedica",
  Alertas: "alertas",
  "Canalización": "canalizacion",
  Oportunidad: "oportunidad",
  Medicamentos: "medicamentos",
  Laboratorios: "laboratorios",
};

// Orden fijo de los cursos de vida (de prenatal a vejez) para mostrar SIEMPRE igual.
const ORDEN_CURSOS = [
  "Preconcepción",
  "Control prenatal",
  "Planificación familiar",
  "Lactancia materna",
  "Primera infancia",
  "Infancia",
  "Adolescencia",
  "Juventud",
  "Adultez",
  "Vejez",
  "Salud oral",
  "Salud mental",
  "Cáncer de cuello uterino",
  "Cáncer de mama",
  "Cáncer de próstata",
  "Cáncer de colon y recto",
  "Violencia sexual",
  "ITS / VIH",
];
const ordenCurso = (k: string) => {
  const i = ORDEN_CURSOS.indexOf(k);
  return i < 0 ? 999 : i;
};

const TAB_COMPONENTE: Partial<Record<Tab, Componente>> = {
  "Adherencia HC": "adherencia_hc",
  Indicadores: "indicadores",
  Anexos: "anexos",
  Capacidad: "capacidad",
  Biomédica: "biomedica",
  Alertas: "alertas",
  "Canalización": "canalizacion",
  Oportunidad: "oportunidad",
  Medicamentos: "medicamentos",
  Laboratorios: "laboratorios",
};

export function EpsTabs({
  componentes,
  registros,
  analisis = {},
}: {
  componentes: Record<Componente, number | null>;
  registros: RegistroFila[];
  analisis?: Record<string, AnalisisIA>;
}) {
  const [tab, setTab] = useState<Tab>("Adherencia HC");

  return (
    <div className="mt-4" data-tour="eps-tabs">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const tipo = TAB_TIPO[t];
          const n = tipo ? registros.filter((r) => r.tipo === tipo).length : 0;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                tab === t
                  ? "bg-rias-azul text-white shadow-[var(--shadow-brand)]"
                  : "border border-rias-borde bg-white text-rias-azul hover:bg-rias-app"
              }`}
            >
              {t}
              {n > 0 && (
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                    tab === t ? "bg-white/25" : "bg-rias-app text-rias-azul2"
                  }`}
                >
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rias-card mt-4 p-6">
        <SeccionDatos
          tab={tab}
          valor={TAB_COMPONENTE[tab] ? (componentes[TAB_COMPONENTE[tab]!] ?? undefined) : undefined}
          filas={TAB_TIPO[tab] ? registros.filter((r) => r.tipo === TAB_TIPO[tab]) : []}
          ia={TAB_TIPO[tab] ? analisis[TAB_TIPO[tab]!] : undefined}
        />
      </div>
    </div>
  );
}

function AnalisisCard({ ia }: { ia: AnalisisIA }) {
  return (
    <div className="mb-5 rounded-2xl border border-[#cfe0fd] bg-[#eef4ff] p-4">
      <p className="flex items-center gap-1.5 text-sm font-bold text-rias-azul">
        <Sparkles className="h-4 w-4 text-rias-azul2" /> Análisis (IA)
      </p>
      {ia.resumen && <p className="mt-1.5 text-sm leading-relaxed text-rias-texto">{ia.resumen}</p>}
      {Array.isArray(ia.hallazgos) && ia.hallazgos.length > 0 && (
        <ul className="mt-2 space-y-1">
          {ia.hallazgos.slice(0, 6).map((h, i) => (
            <li key={i} className="flex gap-2 text-sm text-rias-texto">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rias-azul2" />
              {h}
            </li>
          ))}
        </ul>
      )}
      {Array.isArray(ia.alertas) && ia.alertas.length > 0 && (
        <div className="mt-2 space-y-1">
          {ia.alertas.slice(0, 4).map((a, i) => (
            <p key={i} className="flex items-start gap-1.5 text-sm font-medium text-[#bd470f]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {a}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function SeccionDatos({ tab, valor, filas, ia }: { tab: Tab; valor?: number; filas: RegistroFila[]; ia?: AnalisisIA }) {
  if (!filas.length) {
    return (
      <div className="text-center">
        {valor !== undefined && (
          <div className="mb-4 flex justify-center">
            <SemaforoPill valor={valor} />
          </div>
        )}
        <h3 className="text-lg font-bold text-rias-azul">{tab}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-rias-tenue">
          Aún no hay datos de <strong>{tab.toLowerCase()}</strong> para esta EPS. Sube el Excel correspondiente
          y la sección se llenará automáticamente con sus tablas y gráficas.
        </p>
        <a href="/cargar" className="mt-4 inline-block rounded-xl bg-rias-azul px-4 py-2 text-sm font-bold text-white">
          Cargar archivo de {tab}
        </a>
      </div>
    );
  }

  // Agrupa por CURSO DE VIDA / etapa (varias hojas del Excel se unen en una sección grande).
  // descarta filas casi vacías (meses sin datos traen solo el nombre).
  const grupos = new Map<string, RegistroFila[]>();
  for (const f of filas) {
    const utiles = Object.values(f.datos).filter((v) => String(v).trim() !== "").length;
    if (utiles < 3) continue;
    // Curso de vida detectado del contenido (parser) primero; nombre de hoja como respaldo.
    const etapaContenido = typeof f.datos.__etapa === "string" ? f.datos.__etapa : "";
    const k = etapaContenido || etapaDeHoja(f.hoja) || detalleHoja(f.hoja) || "General";
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(f);
  }
  const entradas = Array.from(grupos.entries()).sort((a, b) => ordenCurso(a[0]) - ordenCurso(b[0]));
  const total = entradas.reduce((a, [, fs]) => a + fs.length, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-rias-azul">
          {tab}{" "}
          <span className="text-sm font-normal text-rias-tenue">
            · {total} registros · {entradas.length} {entradas.length === 1 ? "sección" : "secciones"}
          </span>
        </h3>
        {valor !== undefined && <SemaforoPill valor={valor} />}
      </div>
      {ia && <AnalisisCard ia={ia} />}
      <div className="space-y-4">
        {entradas.map(([etapa, fs], i) => (
          <SeccionEtapa key={etapa} etapa={etapa} filas={fs} abierto={i < 2} />
        ))}
      </div>
    </div>
  );
}

const RE_TITULO = /indicador|aspecto|criterio|servicio|hallazgo|descripci|programa|ruta|equipo|item|paciente|nombre|alerta/i;
const RE_PCT = /cumplimiento|calificaci|%/i;
const RE_LARGO = /an[aá]lisis|observ|acci[oó]n|causa|hallazgo|descripci|interven|mejora|control|nota|resultado/i;

function valorNum(v: string | number): number | null {
  const n = parseFloat(String(v).replace("%", "").replace(",", "."));
  return isNaN(n) ? null : n;
}

type Aspecto = { cat?: string; a: string; r: string; p?: string; o?: string };

function agruparPorCat(aspectos: Aspecto[]): [string, Aspecto[]][] {
  const orden: string[] = [];
  const map: Record<string, Aspecto[]> = {};
  for (const as of aspectos) {
    const c = as.cat || "General";
    if (!map[c]) {
      map[c] = [];
      orden.push(c);
    }
    map[c].push(as);
  }
  return orden.map((c) => [c, map[c]]);
}

// "MEDICINA GENERAL 1 VEZ" -> "Medicina general"
function limpiarEsp(k: string): string {
  const s = k.replace(/\s*1\s*vez/i, "").trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Tarjeta de oportunidad: muestra TODAS las especialidades del mes y marca en ROJO las que
// superan el máximo de días de la Resolución 1552 (o no tienen agenda).
function OportunidadCard({ datos }: { datos: Record<string, string | number> }) {
  const crudo = datos as Record<string, unknown>;
  const incumple = Array.isArray(crudo["__incumple"]) ? (crudo["__incumple"] as string[]) : [];
  const umbral = (crudo["__umbral"] && typeof crudo["__umbral"] === "object" ? crudo["__umbral"] : {}) as Record<string, number>;
  const cumpleStr = String(datos["Cumple Res.1552"] ?? "");
  const esp = Object.entries(datos).filter(([k]) => !k.startsWith("__") && k !== "Mes" && k !== "Cumple Res.1552");
  return (
    <div className="flex flex-col rounded-2xl border border-rias-borde bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-rias-azul">{String(datos["Mes"])}</p>
        <span className="shrink-0 rounded-full bg-rias-app px-2 py-0.5 text-xs font-bold text-rias-azul2">
          Cumple {cumpleStr}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {esp.map(([k, v]) => {
          const malo = incumple.includes(k);
          return (
            <div key={k} className="min-w-0">
              <dt className="truncate text-[11px] font-medium uppercase tracking-wide text-rias-tenue" title={k}>
                {limpiarEsp(k)}
              </dt>
              <dd className={`truncate text-sm font-bold ${malo ? "text-rias-rojo" : "text-rias-texto"}`}>
                {String(v)}
                {malo && umbral[k] != null && <span className="ml-1 text-[11px] font-medium">· máx {umbral[k]}d</span>}
              </dd>
            </div>
          );
        })}
      </dl>
      {incumple.length > 0 && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-[#fbe3e3] px-2.5 py-1.5 text-[11px] font-bold text-rias-rojo">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Supera la Res. 1552 en: {incumple.map(limpiarEsp).join(", ")}
        </p>
      )}
    </div>
  );
}

function RegistroCard({ datos }: { datos: Record<string, string | number> }) {
  const crudo = datos as Record<string, unknown>;
  if (crudo["__umbral"]) return <OportunidadCard datos={datos} />;
  const aspectos = Array.isArray(crudo["__aspectos"]) ? (crudo["__aspectos"] as Aspecto[]) : null;
  const entradas = Object.entries(datos).filter(([k, v]) => !k.startsWith("__") && String(v).trim() !== "");
  const titKey = entradas.find(([k, v]) => RE_TITULO.test(k) && String(v).length > 1)?.[0];
  const titulo = titKey ? String(datos[titKey]) : String(entradas[0]?.[1] ?? "Registro");
  const pctEntry = entradas.find(([k, v]) => {
    const n = valorNum(v);
    return RE_PCT.test(k) && n !== null && n >= 0 && n <= 100;
  });
  const pct = pctEntry ? valorNum(pctEntry[1]) : null;

  const usados = new Set<string>([titKey, pctEntry?.[0]].filter(Boolean) as string[]);
  const largos = entradas.filter(([k, v]) => !usados.has(k) && RE_LARGO.test(k) && String(v).length > 35);
  largos.forEach(([k]) => usados.add(k));
  const cortos = entradas.filter(([k, v]) => !usados.has(k) && String(v).length <= 60).slice(0, 6);

  return (
    <div className="flex flex-col rounded-2xl border border-rias-borde bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold leading-snug text-rias-azul">{titulo}</p>
        {pct !== null && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-extrabold"
            style={{ background: clasificar(pct).bg, color: clasificar(pct).texto }}
          >
            {pct.toFixed(1)}%
          </span>
        )}
      </div>
      {cortos.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {cortos.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="truncate text-[11px] font-medium uppercase tracking-wide text-rias-tenue">{k}</dt>
              <dd className="truncate text-sm font-semibold text-rias-texto" title={String(v)}>
                {String(v)}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {largos.map(([k, v]) => (
        <div key={k} className="mt-3 border-t border-rias-borde pt-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-rias-tenue">{k}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-rias-texto">{String(v)}</p>
        </div>
      ))}
      {aspectos && aspectos.length > 0 && (
        <details className="mt-3 border-t border-rias-borde pt-2">
          <summary className="cursor-pointer text-xs font-bold text-rias-azul2">
            Ver detalle de {aspectos.length} aspectos evaluados
          </summary>
          <div className="mt-2 space-y-3">
            {agruparPorCat(aspectos).map(([cat, items]) => (
              <div key={cat}>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-rias-azul">{cat}</p>
                <ul className="space-y-1">
                  {items.map((as, i) => {
                    const cumple = /^CUMPLE/i.test(as.r);
                    const noAplica = /APLICA/i.test(as.r);
                    const color = cumple ? "#16a34a" : noAplica ? "#90a09a" : "#dc2626";
                    const bg = cumple ? "#e7f6ec" : noAplica ? "#eef2f1" : "#fbe3e3";
                    return (
                      <li key={i} className="text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <span className="min-w-0 flex-1 text-rias-texto">
                            {as.a}
                            {as.p && <span className="ml-1 text-rias-tenue">({as.p})</span>}
                          </span>
                          <span className="shrink-0 rounded-full px-2 py-0.5 font-bold" style={{ background: bg, color }}>
                            {cumple ? "Cumple" : noAplica ? "No aplica" : "No cumple"}
                          </span>
                        </div>
                        {as.o && <p className="mt-0.5 pl-1 text-[11px] italic leading-snug text-rias-tenue">{as.o}</p>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function SeccionEtapa({ etapa, filas, abierto }: { etapa: string; filas: RegistroFila[]; abierto: boolean }) {
  const [vista, setVista] = useState<"tarjetas" | "tabla">("tarjetas");
  const [mostrar, setMostrar] = useState(12);

  const columnas: string[] = [];
  for (const f of filas) for (const k of Object.keys(f.datos)) if (!k.startsWith("__") && !columnas.includes(k)) columnas.push(k);

  const colPct = columnas.find((c) => RE_PCT.test(c));
  const colLabel = columnas.find((c) => RE_TITULO.test(c));
  const datosGrafica: PuntoBarra[] = [];
  if (colPct && colLabel) {
    for (const f of filas) {
      const num = valorNum(f.datos[colPct]);
      if (num !== null && num >= 0 && num <= 100)
        datosGrafica.push({ label: String(f.datos[colLabel] || "—"), value: num });
    }
  }

  return (
    <details open={abierto} className="overflow-hidden rounded-2xl border border-rias-borde">
      <summary className="flex cursor-pointer items-center justify-between gap-3 bg-gradient-to-r from-rias-azul to-rias-azul2 px-5 py-3 text-white">
        <span className="min-w-0 truncate text-[15px] font-bold">{etapa}</span>
        <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">
          {filas.length} {filas.length === 1 ? "registro" : "registros"}
        </span>
      </summary>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-end gap-1">
          <BotonVista activo={vista === "tarjetas"} onClick={() => setVista("tarjetas")} icon={<LayoutGrid className="h-3.5 w-3.5" />} t="Tarjetas" />
          <BotonVista activo={vista === "tabla"} onClick={() => setVista("tabla")} icon={<Table2 className="h-3.5 w-3.5" />} t="Tabla" />
        </div>

        {datosGrafica.length > 0 && (
          <div className="mb-3 rounded-xl bg-rias-app p-3">
            <MiniBar datos={datosGrafica.slice(0, 12)} />
          </div>
        )}

        {vista === "tarjetas" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filas.slice(0, mostrar).map((f, i) => (
                <RegistroCard key={i} datos={f.datos} />
              ))}
            </div>
            {filas.length > mostrar && (
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  onClick={() => setMostrar((m) => m + 12)}
                  className="rounded-xl border border-rias-borde bg-white px-4 py-2 text-sm font-bold text-rias-azul transition hover:bg-rias-app"
                >
                  Ver más
                </button>
                <span className="text-xs text-rias-tenue">
                  {Math.min(mostrar, filas.length)} de {filas.length}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="max-h-[24rem] overflow-auto rounded-lg border border-rias-borde">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {columnas.map((c) => (
                    <th
                      key={c}
                      className="sticky top-0 whitespace-nowrap border-b border-rias-borde bg-rias-app px-3 py-2 text-left font-bold text-rias-azul"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.slice(0, 150).map((f, i) => (
                  <tr key={i} className="hover:bg-rias-app/60">
                    {columnas.map((c) => (
                      <td
                        key={c}
                        className="max-w-xs truncate border-b border-rias-borde px-3 py-2 text-rias-texto"
                        title={String(f.datos[c] ?? "")}
                      >
                        {String(f.datos[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </details>
  );
}

function BotonVista({ activo, onClick, icon, t }: { activo: boolean; onClick: () => void; icon: React.ReactNode; t: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
        activo ? "bg-rias-azul text-white" : "bg-rias-app text-rias-tenue hover:text-rias-azul"
      }`}
    >
      {icon} {t}
    </button>
  );
}
