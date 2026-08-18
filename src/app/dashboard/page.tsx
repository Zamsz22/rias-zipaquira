import Link from "next/link";
import { getResultados } from "@/lib/data";
import { clasificar, COMPONENTES_META, type Componente } from "@/lib/scoring";
import { SemaforoPill, SemaforoDot } from "@/components/semaforo";
import { AnimatedNumber, ProgressRing, FadeIn } from "@/components/dashboard-bits";
import { TrendArea, BarsByEps, DistribucionDonut } from "@/components/charts";
import { AutoRefresh } from "@/components/auto-refresh";
import { BotonActualizar } from "@/components/boton-actualizar";
import { ArrowUpRight, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

const LABEL_CORTO: Record<Componente, string> = {
  adherencia_hc: "Adherencia HC",
  indicadores: "Indicadores",
  anexos: "Anexos",
  capacidad: "Capacidad",
  biomedica: "Biomédica",
  alertas: "Alertas",
  canalizacion: "Canalización",
  oportunidad: "Oportunidad",
  medicamentos: "Medicamentos",
  laboratorios: "Laboratorios",
};

const COMPONENTES = Object.keys(COMPONENTES_META) as Componente[];

// Tonos pastel del semáforo, legibles sobre la tarjeta azul oscura (sin ser agresivos).
const SEMAFORO_SUAVE: Record<string, string> = {
  satisfactorio: "#8ff0b0",
  aceptable: "#ffd98a",
  critico: "#ffbe94",
  "muy-critico": "#ff9f9f",
};

export default async function Dashboard() {
  const resultados = await getResultados();
  const hayDatosReales = resultados.some((r) => r.fuente === "supabase");
  const n = resultados.length;
  const promedio = Math.round((resultados.reduce((a, r) => a + r.indice, 0) / n) * 10) / 10;
  const tonoPromedio = SEMAFORO_SUAVE[clasificar(promedio).nivel];

  const conteo = {
    satisfactorio: resultados.filter((r) => clasificar(r.indice).nivel === "satisfactorio").length,
    aceptable: resultados.filter((r) => clasificar(r.indice).nivel === "aceptable").length,
    critico: resultados.filter((r) => clasificar(r.indice).nivel === "critico").length,
    "muy-critico": resultados.filter((r) => clasificar(r.indice).nivel === "muy-critico").length,
  };

  const porComponente = (Object.keys(COMPONENTES_META) as Componente[]).map((c) => {
    const vals = resultados.map((r) => r.componentes[c]).filter((v): v is number => v !== null);
    return {
      label: LABEL_CORTO[c],
      value: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0,
    };
  });

  const barras = resultados.map((r) => ({
    nombre: r.eps.replace("EPS ", "").replace("Régimen especial ", ""),
    indice: r.indice,
  }));

  const distribucion = [
    { nombre: "Satisfactorio", valor: conteo.satisfactorio, color: "#16a34a" },
    { nombre: "Aceptable", valor: conteo.aceptable, color: "#d97706" },
    { nombre: "Crítico", valor: conteo.critico, color: "#ea580c" },
    { nombre: "Muy crítico", valor: conteo["muy-critico"], color: "#dc2626" },
  ].filter((d) => d.valor > 0);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
      <AutoRefresh segundos={60} />
      <div data-tour="dash-welcome" className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-rias-azul2">Bienvenido al seguimiento RIAS</p>
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-rias-azul sm:text-[34px]">
            Panel del municipio de Zipaquirá
          </h1>
          <p className="mt-1 text-sm text-rias-tenue">
            Así va la implementación de las RIAS en cada prestador, semaforizada por componente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BotonActualizar />
          <Link
            href="/cargar"
            className="inline-flex items-center gap-2 rounded-xl bg-rias-azul px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rias-azul2"
          >
            <TrendingUp className="h-4 w-4 text-rias-lima" /> Cargar datos
          </Link>
        </div>
      </div>

      {!hayDatosReales && (
        <div className="mt-5 rounded-2xl border border-[#f1df91] bg-[#fffdf1] px-4 py-3 text-sm text-[#7a6500]">
          <strong>Modo demostración.</strong> Datos de ejemplo. Sube los Excel de cada EPS para ver datos reales.
        </div>
      )}

      {/* KPIs */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
        <FadeIn>
          <div data-tour="dash-kpi" className="relative h-full overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-rias-azul2 to-rias-noche p-5 text-white shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white/80">Índice promedio</p>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rias-lima/20 text-rias-lima">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-1 text-[42px] font-extrabold leading-none text-white">
              <AnimatedNumber value={promedio} suffix="%" />
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-xs font-bold">
              <SemaforoDot color={tonoPromedio} size={9} /> {clasificar(promedio).etiqueta}
            </div>
            {/* Mini barras: una por EPS, teñidas suavemente por su propio semáforo */}
            <div className="mt-4 flex items-end gap-1.5">
              {barras.slice(0, 12).map((b, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  title={`${b.nombre}: ${b.indice}%`}
                  style={{
                    height: `${20 + (b.indice / 100) * 34}px`,
                    background: SEMAFORO_SUAVE[clasificar(b.indice).nivel],
                    opacity: 0.85,
                  }}
                />
              ))}
            </div>
          </div>
        </FadeIn>
        {(
          [
            ["Satisfactorios", conteo.satisfactorio, "#157f3a", "#e7f6ec"],
            ["Aceptables", conteo.aceptable, "#a55b06", "#fcefdc"],
            ["Críticos", conteo.critico + conteo["muy-critico"], "#b91c1c", "#fbe3e3"],
          ] as const
        ).map(([t, v, color, bg], i) => (
          <FadeIn key={t} delay={(i + 1) * 0.06}>
            <div className="rias-card flex h-full flex-col justify-between p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-rias-tenue">{t}</p>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold" style={{ background: bg, color }}>
                  {Math.round((v / n) * 100)}%
                </span>
              </div>
              <p className="mt-2 text-4xl font-extrabold" style={{ color }}>
                <AnimatedNumber value={v} decimals={0} />
              </p>
              <p className="text-xs text-rias-tenue">de {n} prestadores</p>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Tendencia + distribución */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <FadeIn>
          <div className="rias-card h-full p-6">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-bold text-rias-azul">Índice por componente</h2>
              <span className="text-xs font-medium text-rias-tenue">promedio de {n} prestadores</span>
            </div>
            <TrendArea datos={porComponente} />
          </div>
        </FadeIn>
        <FadeIn delay={0.06}>
          <div className="rias-card flex h-full flex-col p-6">
            <h2 className="text-lg font-bold text-rias-azul">Distribución</h2>
            <DistribucionDonut datos={distribucion} />
            <div className="mt-3 space-y-1.5">
              {distribucion.map((d) => (
                <div key={d.nombre} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-rias-texto">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} /> {d.nombre}
                  </span>
                  <span className="font-bold text-rias-azul">{d.valor}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Barras por EPS */}
      <FadeIn>
        <div className="rias-card mt-5 p-6">
          <h2 className="mb-3 text-lg font-bold text-rias-azul">Índice integral por EPS</h2>
          <BarsByEps datos={barras} />
        </div>
      </FadeIn>

      {/* Prestadores */}
      <div className="mb-2 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-rias-azul">Prestadores</h2>
        <Link href="/eps/nueva" className="text-sm font-bold text-rias-azul2 hover:underline">
          + Nueva EPS
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resultados.map((r, i) => (
          <FadeIn key={r.id} delay={i * 0.04}>
            <Link href={`/dashboard/eps/${r.id}`} className="rias-card rias-hover flex h-full flex-col gap-3 p-5">
              <div className="flex items-center gap-4">
                <ProgressRing value={r.indice} size={66} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-extrabold text-rias-azul">{r.eps}</p>
                  <p className="truncate text-sm font-medium text-rias-tenue">{r.ips}</p>
                  <div className="mt-1.5">
                    <SemaforoPill valor={r.indice} />
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-rias-cielo" />
              </div>
              {/* Tira semaforizada de los 10 componentes (gris = sin dato) */}
              <div className="flex items-center gap-1 border-t border-rias-borde pt-3" title="Cada barra es un componente, coloreado por su semáforo">
                {COMPONENTES.map((c) => {
                  const v = r.componentes[c];
                  const color = v == null ? "#e2e8ee" : clasificar(v).color;
                  return (
                    <span
                      key={c}
                      title={`${LABEL_CORTO[c]}: ${v == null ? "sin dato" : v + "%"}`}
                      className="h-2 flex-1 rounded-full"
                      style={{ background: color }}
                    />
                  );
                })}
              </div>
            </Link>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
