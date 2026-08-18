import Link from "next/link";
import { notFound } from "next/navigation";
import { getResultado, getRegistros, getAnalisis } from "@/lib/data";
import { construirInforme, muestraInforme, type Corte } from "@/lib/informe";
import { analizarConIA, ANALYZER_URL } from "@/lib/analisis";
import { InformeControles } from "@/components/informe-controles";
import { ArrowLeft, ShieldCheck, TrendingUp, AlertTriangle, Lightbulb, Target, FileBarChart, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const CORTES: Corte[] = ["mensual", "trimestral", "anual", "personalizado"];

export default async function InformePage({
  params,
  searchParams,
}: {
  params: Promise<{ epsId: string }>;
  searchParams: Promise<{ corte?: string; desde?: string; hasta?: string }>;
}) {
  const { epsId } = await params;
  const sp = await searchParams;
  const corte: Corte = CORTES.includes(sp.corte as Corte) ? (sp.corte as Corte) : "mensual";

  const [resultado, registros, analisis] = await Promise.all([
    getResultado(epsId),
    getRegistros(epsId),
    getAnalisis(epsId),
  ]);
  if (!resultado) notFound();

  // Pide el análisis a la IA (con un tope de tiempo; si no responde, el informe usa el texto propio).
  const iaGlobal = resultado.medidos.length
    ? await Promise.race([
        analizarConIA(ANALYZER_URL, {
          tipo: "Informe integral consolidado RIAS",
          eps: resultado.eps,
          muestra: muestraInforme(resultado, registros),
        }),
        new Promise<null>((r) => setTimeout(() => r(null), 15000)),
      ])
    : null;

  const inf = construirInforme(resultado, registros, analisis, corte, sp.desde, sp.hasta, iaGlobal);
  const g = inf.semaforoGlobal;

  return (
    <div className="mx-auto max-w-[900px] px-5 py-8 sm:px-8">
      {/* Oculta el cromo del sitio y ajusta la página al imprimir/guardar como PDF */}
      <style>{`@media print {
        header, footer, .no-print { display: none !important; }
        body { background: #fff !important; }
        .rias-hoja { box-shadow: none !important; border: none !important; }
        .rias-break { break-inside: avoid; }
        @page { margin: 1.4cm; }
      }`}</style>

      <div className="no-print mb-4">
        <Link href={`/dashboard/eps/${epsId}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-rias-azul2 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver a la EPS
        </Link>
      </div>

      <InformeControles corte={corte} desde={sp.desde} hasta={sp.hasta} />

      <article className="rias-hoja overflow-hidden rounded-[var(--radius-card)] border border-rias-borde bg-white shadow-[var(--shadow-card)]">
        {/* Portada */}
        <header className="bg-gradient-to-br from-rias-azul to-rias-azul2 px-8 py-9 text-white">
          <div className="flex items-center gap-2 text-white/80">
            <FileBarChart className="h-5 w-5" />
            <span className="text-sm font-semibold">{inf.corteLabel}</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight">Informe de Seguimiento a la Implementación de las RIAS</h1>
          <p className="mt-1 text-lg font-bold text-white/90">{inf.eps}</p>
          <p className="text-sm text-white/75">IPS {inf.ips} · {inf.periodo}</p>
        </header>

        <div className="space-y-8 px-8 py-8">
          {/* Información del prestador */}
          <Seccion titulo="Información del prestador">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Dato k="EPS" v={inf.eps} />
              <Dato k="IPS primaria" v={inf.ips} />
              <Dato k="Corte" v={inf.corteLabel.replace("Informe ", "")} />
              <Dato k="Fecha de generación" v={inf.fechaGen} />
            </div>
          </Seccion>

          {/* Índice integral */}
          <div className="rias-break flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-6 py-5" style={{ background: g.bg, borderColor: g.color }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: g.texto }}>Índice integral de implementación</p>
              <p className="mt-1 text-sm text-rias-texto">Ponderado sobre los {inf.medidos.length} componentes con dato disponible.</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-extrabold leading-none" style={{ color: g.texto }}>{inf.indice}%</p>
              <p className="mt-1 text-sm font-bold" style={{ color: g.texto }}>{g.etiqueta}</p>
            </div>
          </div>

          {/* Resultados por componente */}
          <Seccion titulo="Resultados por componente">
            <div className="grid gap-3 sm:grid-cols-2">
              {inf.medidos.map((c) => (
                <div key={c.comp} className="rias-break rounded-2xl border border-rias-borde p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-snug text-rias-azul">{c.nombre}</p>
                      <p className="text-[11px] text-rias-tenue">Peso {c.peso}% · {c.conteo} registros</p>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: c.semaforo!.bg, color: c.semaforo!.texto }}>
                      {c.semaforo!.etiqueta}
                    </span>
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-2xl font-extrabold leading-none" style={{ color: c.semaforo!.texto }}>{c.valor}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rias-app">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, c.valor ?? 0)}%`, background: c.semaforo!.color }} />
                  </div>
                </div>
              ))}
            </div>
            {inf.sinMedir.length > 0 && (
              <p className="mt-3 text-xs text-rias-tenue">
                Con información cargada sin porcentaje calculable: {inf.sinMedir.map((s) => `${s.nombre} (${s.conteo})`).join(" · ")}.
              </p>
            )}
          </Seccion>

          {/* Plan de Mejora */}
          {inf.planMejora && (
            <Seccion titulo="Módulo Plan de Mejora">
              <div className="rias-break flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rias-borde p-5">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-rias-azul2" />
                  <div className="text-sm text-rias-texto">
                    <p><strong>{inf.planMejora.total}</strong> hallazgos · <strong className="text-[#157f3a]">{inf.planMejora.efectivo}</strong> efectivos · <strong className="text-[#b91c1c]">{inf.planMejora.no}</strong> no efectivos · <strong className="text-[#a55b06]">{inf.planMejora.seg}</strong> en seguimiento</p>
                  </div>
                </div>
                {inf.planMejora.efectividad !== null && (
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-rias-azul">{inf.planMejora.efectividad}%</p>
                    <p className="text-[11px] text-rias-tenue">efectividad de hallazgos cerrados</p>
                  </div>
                )}
              </div>
            </Seccion>
          )}

          {/* Análisis (contenido tipo MOSAN) */}
          <div className="rounded-2xl border border-[#f0dcb8] bg-[#fffdf7] px-6 py-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fcefdc] text-[#a55b06]"><Lightbulb className="h-4 w-4" /></span>
              <h2 className="text-lg font-extrabold text-rias-azul">Análisis del informe</h2>
            </div>

            {inf.iaResumen && (
              <div className="mt-4 rounded-xl border border-[#cfe0fd] bg-[#eef5ff] p-4">
                <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-rias-azul2">
                  <Sparkles className="h-4 w-4" /> Análisis con inteligencia artificial
                </p>
                <p className="mt-2 text-sm leading-relaxed text-rias-texto">{inf.iaResumen}</p>
                {inf.iaHallazgos && inf.iaHallazgos.length > 0 && (
                  <>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-rias-tenue">Hallazgos clave</p>
                    <ul className="mt-1 space-y-1">{inf.iaHallazgos.map((h, i) => <Bala key={i} color="#1f5fd0">{h}</Bala>)}</ul>
                  </>
                )}
                {inf.iaAlertas && inf.iaAlertas.length > 0 && (
                  <>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-rias-tenue">Alertas</p>
                    <ul className="mt-1 space-y-1">{inf.iaAlertas.map((a, i) => <Bala key={i} color="#b91c1c">{a}</Bala>)}</ul>
                  </>
                )}
              </div>
            )}

            <Sub icon={FileBarChart} t="Resumen general" />
            <p className="text-sm leading-relaxed text-rias-texto">{inf.resumenGeneral}</p>

            {inf.fortalezas.length > 0 && (
              <>
                <Sub icon={ShieldCheck} t="Fortalezas" />
                <ul className="space-y-1.5">
                  {inf.fortalezas.map((f, i) => <Bala key={i} color="#157f3a">{f}</Bala>)}
                </ul>
              </>
            )}
            {inf.riesgos.length > 0 && (
              <>
                <Sub icon={AlertTriangle} t="Riesgos y oportunidades de mejora" />
                <ul className="space-y-1.5">
                  {inf.riesgos.map((r, i) => <Bala key={i} color="#b91c1c">{r}</Bala>)}
                </ul>
              </>
            )}

            <Sub icon={TrendingUp} t="Análisis por componente" />
            <div className="space-y-3">
              {inf.medidos.map((c) => (
                <div key={c.comp} className="rias-break rounded-xl border border-rias-borde bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-rias-azul">{c.nombre}</p>
                    <span className="shrink-0 text-xs font-bold" style={{ color: c.semaforo!.texto }}>{c.valor}% · {c.semaforo!.etiqueta}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-rias-texto"><strong>Interpretación:</strong> {c.interpretacion}</p>
                  <p className="mt-1 text-sm leading-relaxed text-rias-texto"><strong>Fortaleza:</strong> {c.fortaleza}</p>
                  <p className="mt-1 text-sm leading-relaxed text-rias-texto"><strong>Oportunidad de mejora:</strong> {c.oportunidad}</p>
                  {c.ia?.resumen && (
                    <p className="mt-2 border-l-2 border-rias-azul2 pl-3 text-sm italic leading-relaxed text-rias-tenue">{c.ia.resumen}</p>
                  )}
                  {c.ia?.hallazgos && c.ia.hallazgos.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {c.ia.hallazgos.slice(0, 4).map((h, i) => <Bala key={i} color="#1f5fd0">{h}</Bala>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <Sub icon={Lightbulb} t="Recomendaciones prácticas" />
            <ol className="space-y-2">
              {inf.recomendaciones.map((r, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-rias-texto">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rias-azul text-[11px] font-extrabold text-white">{i + 1}</span>
                  <span>{r}</span>
                </li>
              ))}
            </ol>

            <Sub icon={Target} t="Mensaje final" />
            <p className="text-sm leading-relaxed text-rias-texto">{inf.mensajeFinal}</p>
          </div>

          <p className="border-t border-rias-borde pt-4 text-center text-[11px] text-rias-tenue">
            {inf.eps} · {inf.periodo} · Generado el {inf.fechaGen} por la Plataforma Integral de Seguimiento RIAS — Secretaría de Salud de Zipaquirá.<br />
            Este informe es de carácter orientativo para la gestión y el seguimiento; no reemplaza la auditoría formal ni la evaluación de un profesional competente.
          </p>
        </div>
      </article>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rias-break">
      <h2 className="mb-3 border-b-2 border-rias-azul/20 pb-1.5 text-lg font-extrabold text-rias-azul">{titulo}</h2>
      {children}
    </section>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-rias-app px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-rias-tenue">{k}</p>
      <p className="mt-0.5 text-sm font-bold text-rias-texto">{v}</p>
    </div>
  );
}

function Sub({ icon: Icon, t }: { icon: typeof Target; t: string }) {
  return (
    <h3 className="mb-2 mt-5 flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wide text-rias-azul2">
      <Icon className="h-4 w-4" /> {t}
    </h3>
  );
}

function Bala({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <li className="flex gap-2 text-sm leading-relaxed text-rias-texto">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <span>{children}</span>
    </li>
  );
}
