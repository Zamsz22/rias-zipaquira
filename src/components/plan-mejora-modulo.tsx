"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RegistroFila } from "@/lib/data";
import { Target, CheckCircle2, XCircle, Clock3, ChevronDown, X, Pencil, Save, Loader2 } from "lucide-react";

type Resultado = "Efectivo" | "No efectivo" | "En seguimiento";
type Seg = { resultado?: string; avance?: number | null; observacion?: string; responsable?: string; fecha_cierre?: string | null };

// Clave estable del hallazgo (ruta + descripción). Debe coincidir al mostrar y al guardar.
export function claveHallazgo(d: Record<string, string | number>): string {
  const ruta = String(d.Ruta ?? "").trim();
  const desc = String(d["Descripción del hallazgo"] ?? "").trim();
  return `${ruta}∙${desc}`.slice(0, 300);
}

const val = (d: Record<string, string | number>, k: string) => String(d[k] ?? "").trim();

// Qué resultado mostrar: primero lo editado aquí; si no, lo del Excel; si no, "En seguimiento".
const resultadoDe = (r: RegistroFila, seg: Record<string, Seg>): Resultado =>
  ((seg[claveHallazgo(r.datos)]?.resultado || val(r.datos, "Resultado") || "En seguimiento") as Resultado);

// Botón animado que abre el módulo de Plan de Mejora en un pop-up (por EPS/IPS).
export function PlanMejoraBoton({ registros, eps, epsId }: { registros: RegistroFila[]; eps: string; epsId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [seg, setSeg] = useState<Record<string, Seg>>({});
  const [cargado, setCargado] = useState(false);
  const total = registros.length;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    if (abierto) { document.addEventListener("keydown", esc); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [abierto]);

  // Carga el seguimiento guardado la primera vez que se abre.
  useEffect(() => {
    if (!abierto || cargado) return;
    fetch(`/api/plan-mejora?epsId=${encodeURIComponent(epsId)}`)
      .then((r) => r.json())
      .then((j) => { if (j?.seguimiento) setSeg(j.seguimiento); })
      .catch(() => {})
      .finally(() => setCargado(true));
  }, [abierto, cargado, epsId]);

  async function guardar(clave: string, patch: Seg) {
    setSeg((s) => ({ ...s, [clave]: { ...s[clave], ...patch } }));
    await fetch("/api/plan-mejora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ epsId, clave, ...patch }),
    }).catch(() => {});
  }

  const conteo = { efectivo: 0, no: 0, seg: 0 };
  for (const r of registros) {
    const res = resultadoDe(r, seg);
    if (res === "Efectivo") conteo.efectivo++;
    else if (res === "No efectivo") conteo.no++;
    else conteo.seg++;
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="group flex w-full items-center gap-4 rounded-[var(--radius-card)] border border-rias-borde bg-gradient-to-r from-rias-azul to-rias-azul2 p-5 text-left text-white shadow-[var(--shadow-card)] transition hover:brightness-105"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Target className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold leading-tight">Plan de Mejora RIAS</p>
          <p className="text-xs text-white/80">
            {total} hallazgos · {conteo.efectivo} efectivos · {conteo.no} no efectivos · {conteo.seg} en seguimiento
          </p>
        </div>
        <span className="shrink-0 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold transition group-hover:bg-white/25">
          Abrir seguimiento
        </span>
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-rias-noche/50 backdrop-blur-sm" onClick={() => setAbierto(false)} />
            <motion.div
              className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-rias-app shadow-2xl sm:rounded-3xl"
              initial={{ y: 40, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 40, scale: 0.98, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-rias-borde bg-white px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-rias-azul">Plan de Mejora · {eps}</p>
                  <p className="text-xs text-rias-tenue">Seguimiento editable de hallazgos de la institución</p>
                </div>
                <button onClick={() => setAbierto(false)} aria-label="Cerrar" className="rounded-xl border border-rias-borde p-2 text-rias-tenue transition hover:bg-rias-app">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-5">
                <PlanMejoraModulo registros={registros} seg={seg} onGuardar={guardar} cargado={cargado} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const ESTILO: Record<Resultado, { color: string; bg: string; Icon: typeof CheckCircle2 }> = {
  Efectivo: { color: "#157f3a", bg: "#e7f6ec", Icon: CheckCircle2 },
  "No efectivo": { color: "#b91c1c", bg: "#fbe3e3", Icon: XCircle },
  "En seguimiento": { color: "#a55b06", bg: "#fcefdc", Icon: Clock3 },
};

export function PlanMejoraModulo({
  registros,
  seg,
  onGuardar,
  cargado,
}: {
  registros: RegistroFila[];
  seg: Record<string, Seg>;
  onGuardar: (clave: string, patch: Seg) => Promise<void>;
  cargado: boolean;
}) {
  const [filtro, setFiltro] = useState<Resultado | "Todos">("Todos");
  const [mostrar, setMostrar] = useState(8);

  if (!registros.length) {
    return (
      <div className="rias-card p-6 text-center">
        <Target className="mx-auto h-8 w-8 text-rias-tenue" />
        <h2 className="mt-2 text-lg font-bold text-rias-azul">Plan de Mejora</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-rias-tenue">
          Aún no hay un plan de mejora cargado para esta EPS. Sube el <strong>Formato de Plan de Mejora</strong> en la
          sección de cargar y aquí verás el seguimiento de cada hallazgo.
        </p>
      </div>
    );
  }

  const conteo: Record<Resultado, number> = { Efectivo: 0, "No efectivo": 0, "En seguimiento": 0 };
  for (const r of registros) conteo[resultadoDe(r, seg)]++;
  const total = registros.length;
  const cerrados = conteo.Efectivo + conteo["No efectivo"];
  const efectividad = cerrados ? Math.round((conteo.Efectivo / cerrados) * 1000) / 10 : null;

  const visibles = filtro === "Todos" ? registros : registros.filter((r) => resultadoDe(r, seg) === filtro);

  return (
    <div className="space-y-4">
      <div className="rias-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rias-borde bg-gradient-to-r from-rias-azul to-rias-azul2 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold leading-tight">Plan de Mejora RIAS</h2>
              <p className="text-xs text-white/75">Módulo independiente · indicador de efectividad</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold leading-none">{efectividad !== null ? `${efectividad}%` : "—"}</p>
            <p className="text-xs text-white/75">efectividad de los hallazgos cerrados</p>
          </div>
        </div>

        <div className="px-6 pt-5">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-rias-app">
            {(["Efectivo", "No efectivo", "En seguimiento"] as Resultado[]).map((k) =>
              conteo[k] ? <div key={k} title={`${k}: ${conteo[k]}`} style={{ width: `${(conteo[k] / total) * 100}%`, background: ESTILO[k].color }} /> : null,
            )}
          </div>
        </div>

        <div className="grid gap-3 p-6 sm:grid-cols-4">
          <BotonFiltro activo={filtro === "Todos"} onClick={() => setFiltro("Todos")} n={total} t="Hallazgos" color="#1f5fd0" bg="#e6efff" />
          {(["Efectivo", "No efectivo", "En seguimiento"] as Resultado[]).map((k) => (
            <BotonFiltro key={k} activo={filtro === k} onClick={() => setFiltro(k)} n={conteo[k]} t={k} color={ESTILO[k].color} bg={ESTILO[k].bg} />
          ))}
        </div>
      </div>

      {!cargado && (
        <p className="flex items-center justify-center gap-2 text-xs text-rias-tenue">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando el seguimiento guardado…
        </p>
      )}

      <div className="space-y-3">
        {visibles.slice(0, mostrar).map((r) => (
          <TarjetaHallazgo key={claveHallazgo(r.datos)} r={r} seg={seg[claveHallazgo(r.datos)]} resultado={resultadoDe(r, seg)} onGuardar={onGuardar} />
        ))}
      </div>

      {visibles.length > mostrar && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setMostrar((m) => m + 8)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rias-borde bg-white px-4 py-2 text-sm font-bold text-rias-azul transition hover:bg-rias-app"
          >
            Ver más <ChevronDown className="h-4 w-4" />
          </button>
          <span className="text-xs text-rias-tenue">{Math.min(mostrar, visibles.length)} de {visibles.length}</span>
        </div>
      )}
    </div>
  );
}

function TarjetaHallazgo({
  r,
  seg,
  resultado,
  onGuardar,
}: {
  r: RegistroFila;
  seg?: Seg;
  resultado: Resultado;
  onGuardar: (clave: string, patch: Seg) => Promise<void>;
}) {
  const clave = claveHallazgo(r.datos);
  const [editar, setEditar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState<Seg>({
    resultado,
    avance: seg?.avance ?? 0,
    observacion: seg?.observacion ?? val(r.datos, "Observación del seguimiento"),
    responsable: seg?.responsable ?? val(r.datos, "Responsable"),
    fecha_cierre: seg?.fecha_cierre ?? "",
  });
  const e = ESTILO[resultado] ?? ESTILO["En seguimiento"];
  const Icon = e.Icon;
  const avance = seg?.avance;

  async function submit() {
    setGuardando(true);
    await onGuardar(clave, form);
    setGuardando(false);
    setEditar(false);
  }

  // Marcado rápido de un clic (guarda al instante, sin abrir el formulario completo).
  async function marcar(res: Resultado) {
    setGuardando(true);
    setForm((f) => ({ ...f, resultado: res }));
    await onGuardar(clave, { resultado: res });
    setGuardando(false);
  }

  return (
    <div className="rias-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {val(r.datos, "Ruta") && <p className="text-[11px] font-bold uppercase tracking-wide text-rias-azul2">{val(r.datos, "Ruta")}</p>}
          <p className="mt-0.5 text-sm font-semibold leading-snug text-rias-texto">{val(r.datos, "Descripción del hallazgo")}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: e.bg, color: e.color }}>
          <Icon className="h-3.5 w-3.5" /> {resultado}
        </span>
      </div>

      {typeof avance === "number" && (
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-medium text-rias-tenue"><span>Avance</span><span>{avance}%</span></div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-rias-app">
            <div className="h-full rounded-full" style={{ width: `${avance}%`, background: e.color }} />
          </div>
        </div>
      )}

      <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {[
          ["Acción de mejoramiento", val(r.datos, "Acción de mejoramiento")],
          ["Observación del seguimiento", seg?.observacion ?? val(r.datos, "Observación del seguimiento")],
          ["Responsable", seg?.responsable ?? val(r.datos, "Responsable")],
          ["Fecha del hallazgo", val(r.datos, "Fecha del hallazgo")],
          ["Fecha de cierre", seg?.fecha_cierre ?? val(r.datos, "Fecha de cierre")],
        ]
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-rias-tenue">{k}</dt>
              <dd className="text-sm leading-snug text-rias-texto">{v}</dd>
            </div>
          ))}
      </dl>

      {!editar ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-rias-tenue">Marcar:</span>
          {(["Efectivo", "No efectivo", "En seguimiento"] as Resultado[]).map((k) => (
            <button
              key={k}
              onClick={() => marcar(k)}
              disabled={guardando}
              className="rounded-full px-2.5 py-1 text-xs font-bold transition disabled:opacity-50"
              style={resultado === k ? { background: ESTILO[k].color, color: "#fff" } : { background: ESTILO[k].bg, color: ESTILO[k].color }}
            >
              {k}
            </button>
          ))}
          <button onClick={() => setEditar(true)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-rias-borde bg-white px-3 py-1.5 text-xs font-bold text-rias-azul transition hover:bg-rias-app">
            <Pencil className="h-3.5 w-3.5 text-rias-azul2" /> Editar detalle
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3 rounded-2xl border border-rias-borde bg-rias-app/60 p-4">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-rias-tenue">Resultado</p>
            <div className="flex flex-wrap gap-1.5">
              {(["Efectivo", "No efectivo", "En seguimiento"] as Resultado[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setForm((f) => ({ ...f, resultado: k }))}
                  className="rounded-lg px-2.5 py-1 text-xs font-bold transition"
                  style={form.resultado === k ? { background: ESTILO[k].color, color: "#fff" } : { background: "#fff", color: ESTILO[k].color, boxShadow: "inset 0 0 0 1px var(--rias-borde)" }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-rias-tenue">Avance: {form.avance ?? 0}%</span>
            <input type="range" min={0} max={100} step={5} value={form.avance ?? 0} onChange={(ev) => setForm((f) => ({ ...f, avance: Number(ev.target.value) }))} className="mt-1 w-full accent-rias-azul2" />
          </label>

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-rias-tenue">Observación del seguimiento</span>
            <textarea value={form.observacion ?? ""} onChange={(ev) => setForm((f) => ({ ...f, observacion: ev.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-rias-borde px-2.5 py-1.5 text-sm" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-rias-tenue">Responsable</span>
              <input value={form.responsable ?? ""} onChange={(ev) => setForm((f) => ({ ...f, responsable: ev.target.value }))} className="mt-1 w-full rounded-lg border border-rias-borde px-2.5 py-1.5 text-sm" />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-rias-tenue">Fecha de cierre</span>
              <input type="date" value={form.fecha_cierre ?? ""} onChange={(ev) => setForm((f) => ({ ...f, fecha_cierre: ev.target.value }))} className="mt-1 w-full rounded-lg border border-rias-borde px-2.5 py-1.5 text-sm" />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={submit} disabled={guardando} className="inline-flex items-center gap-1.5 rounded-lg bg-rias-azul px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-rias-azul2 disabled:opacity-60">
              {guardando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar
            </button>
            <button onClick={() => setEditar(false)} className="rounded-lg border border-rias-borde bg-white px-3 py-1.5 text-xs font-bold text-rias-tenue transition hover:bg-rias-app">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BotonFiltro({ activo, onClick, n, t, color, bg }: { activo: boolean; onClick: () => void; n: number; t: string; color: string; bg: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition ${activo ? "border-transparent ring-2" : "border-rias-borde hover:bg-rias-app"}`}
      style={activo ? { background: bg, boxShadow: `0 0 0 2px ${color}` } : undefined}
    >
      <p className="text-2xl font-extrabold leading-none" style={{ color }}>{n}</p>
      <p className="mt-1 text-xs font-semibold text-rias-tenue">{t}</p>
    </button>
  );
}
