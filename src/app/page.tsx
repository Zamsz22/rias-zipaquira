import Link from "next/link";
import type { ReactNode } from "react";
import { LeyendaSemaforo } from "@/components/semaforo";
import { FadeIn } from "@/components/dashboard-bits";
import { COMPONENTES_META } from "@/lib/scoring";
import { IconEmbarazada, IconCursoVida } from "@/components/icons-rias";
import {
  LayoutDashboard,
  UploadCloud,
  HeartPulse,
  ClipboardList,
  ShieldCheck,
  ArrowRight,
  Download,
  Share2,
  LayoutGrid,
  Database,
  LineChart,
  Lightbulb,
  Users,
  Stethoscope,
  MapPin,
} from "lucide-react";

// Resalta una frase clave en azul institucional dentro de los párrafos largos.
function Hl({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-rias-azul">{children}</strong>;
}

export default function Inicio() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
      {/* Hero */}
      <FadeIn>
        <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-rias-borde bg-gradient-to-r from-[#cfe0fd] via-[#e9f2ff] to-white shadow-[var(--shadow-card)]">
          {/* Franjas diagonales decorativas (como en la referencia) */}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block">
            <div className="absolute right-[2%] top-0 h-full w-44 -skew-x-12 bg-white/45" />
            <div className="absolute right-[20%] top-0 h-full w-24 -skew-x-12 bg-[#bcd6ff]/45" />
          </div>
          <div className="relative grid items-center gap-6 p-8 lg:grid-cols-[1.5fr_1fr] lg:p-12">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-rias-azul shadow-sm">
                <Share2 className="h-3.5 w-3.5" /> Secretaría de Salud de Zipaquirá · RIAS
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#0f1f3d] sm:text-[52px]">
                Plataforma Integral de Seguimiento RIAS
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#3a4a66]">
                Herramienta digital de la Secretaría de Salud del Municipio de Zipaquirá para el monitoreo,
                seguimiento y apoyo estratégico a los prestadores primarios de atención integral en salud, en el
                marco de la Estrategia RIAS.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0f1f3d] shadow-sm ring-1 ring-rias-borde transition hover:bg-rias-app"
                >
                  <LayoutGrid className="h-4 w-4 text-rias-azul" /> Ver dashboard
                </Link>
                <Link
                  href="/cargar"
                  className="inline-flex items-center gap-2 rounded-xl bg-rias-azul px-5 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition hover:bg-rias-azul2"
                >
                  <Download className="h-4 w-4" /> Generar datos
                </Link>
              </div>
            </div>
            <div className="hidden flex-col items-center justify-center gap-2 lg:flex">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-alcaldia.webp" alt="Alcaldía de Zipaquirá" className="h-44 w-auto object-contain" />
              <p className="text-lg font-extrabold text-[#0f1f3d]">Secretaría de Salud.</p>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ¿Qué es la Plataforma? */}
      <FadeIn>
        <section className="mt-6 rias-card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-rias-azul">
            <ClipboardList className="h-5 w-5 text-rias-azul2" />
            <h2 className="text-xl font-bold">La Plataforma Integral de Seguimiento RIAS</h2>
          </div>

          {/* Lead destacado con barra de acento */}
          <div className="mt-4 rounded-2xl border-l-4 border-rias-azul2 bg-rias-app/70 py-3 pl-4 pr-3">
            <p className="max-w-3xl text-[16px] leading-relaxed text-rias-texto">
              Es una <Hl>herramienta digital de innovación</Hl> desarrollada por la{" "}
              <Hl>Secretaría de Salud del Municipio de Zipaquirá</Hl> en el marco de la{" "}
              <Hl>Estrategia RIAS</Hl>, para fortalecer el <Hl>monitoreo, seguimiento y apoyo estratégico</Hl> a
              los prestadores primarios de atención integral en salud del territorio.
            </p>
          </div>

          <div className="mt-4 max-w-3xl space-y-3 text-[15px] leading-relaxed text-rias-texto">
            <p>
              Consolida y analiza la información recolectada por el <Hl>equipo interdisciplinario</Hl> de la
              Secretaría de Salud, permitiendo monitorear la implementación de la <Hl>Ruta Materno Perinatal</Hl> y
              la <Hl>Ruta de Promoción y Mantenimiento de la Salud</Hl> en cada curso de vida, identificar
              oportunidades de mejora y <Hl>apoyar la toma de decisiones basada en evidencia</Hl>.
            </p>
            <p>
              Así fortalece la <Hl>articulación</Hl> entre la Secretaría de Salud y los prestadores, promoviendo el{" "}
              <Hl>mejoramiento continuo</Hl> de la calidad de la atención y los resultados en salud de la población
              zipaquireña.
            </p>
          </div>

          {/* Tres pilares con icono */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { I: Database, t: "Consolida", d: "Reúne los Excel de cada prestador en un solo lugar." },
              { I: LineChart, t: "Monitorea", d: "Sigue las rutas y los componentes por curso de vida." },
              { I: Lightbulb, t: "Decide", d: "Apoya decisiones con evidencia y semáforos claros." },
            ].map(({ I, t, d }) => (
              <div key={t} className="rounded-2xl border border-rias-borde bg-white p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e6efff] text-rias-azul2">
                  <I className="h-5 w-5" />
                </span>
                <p className="mt-2.5 font-bold text-rias-azul">{t}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-rias-tenue">{d}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ¿Qué es el RIAS? */}
      <FadeIn>
        <section className="mt-6 rias-card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-rias-azul">
            <HeartPulse className="h-5 w-5 text-rias-azul2" />
            <h2 className="text-xl font-bold">¿Qué es la Estrategia RIAS?</h2>
          </div>
          <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-rias-texto">
            Es una iniciativa orientada al <Hl>monitoreo, seguimiento y fortalecimiento</Hl> de la implementación de
            las <Hl>Rutas Integrales de Atención en Salud (RIAS)</Hl> por parte de los prestadores del municipio. A
            través de un <Hl>equipo interdisciplinario</Hl>, promueve la <Hl>atención integral, continua y centrada en
            las personas</Hl>, verificando el cumplimiento de las intervenciones definidas para la{" "}
            <Hl>Ruta Materno Perinatal</Hl> y la <Hl>Ruta de Promoción y Mantenimiento de la Salud</Hl> en cada curso
            de vida.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { I: Stethoscope, t: "Atención integral y continua" },
              { I: MapPin, t: "Menos barreras de acceso" },
              { I: Users, t: "Mejores resultados en salud" },
            ].map(({ I, t }) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-rias-borde bg-white px-3 py-1.5 text-[13px] font-semibold text-rias-azul"
              >
                <I className="h-4 w-4 text-rias-azul2" /> {t}
              </span>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-rias-borde bg-rias-app p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6efff] text-rias-azul2">
                <IconEmbarazada className="h-6 w-6" />
              </span>
              <p className="mt-3 font-bold text-rias-azul">Ruta materno perinatal</p>
              <p className="mt-1 text-sm text-rias-tenue">
                Preconcepción, control prenatal, planificación familiar y lactancia materna.
              </p>
            </div>
            <div className="rounded-2xl border border-rias-borde bg-rias-app p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6efff] text-rias-azul2">
                <IconCursoVida className="h-6 w-6" />
              </span>
              <p className="mt-3 font-bold text-rias-azul">Promoción y mantenimiento de la salud</p>
              <p className="mt-1 text-sm text-rias-tenue">
                Por curso de vida: primera infancia, infancia, adolescencia, juventud, adultez y vejez.
              </p>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Cómo funciona */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {[
          { I: UploadCloud, t: "1 · Sube los archivos", d: "El ZIP o la carpeta de cada EPS. La plataforma lee todos los Excel y sus hojas." },
          { I: ClipboardList, t: "2 · Se analiza solo", d: "Detecta la EPS, clasifica cada documento y evita repetir lo ya cargado." },
          { I: LayoutDashboard, t: "3 · Se visualiza", d: "Cada prestador con su página: números, gráficas y semaforización por componente." },
        ].map(({ I, t, d }, i) => (
          <FadeIn key={t} delay={i * 0.06}>
            <div className="rias-card flex h-full gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rias-azul to-rias-azul2 text-white">
                <I className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-rias-azul">{t}</p>
                <p className="mt-1 text-sm text-rias-tenue">{d}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Semáforo + componentes */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <FadeIn>
          <div className="rias-card h-full p-6">
            <div className="flex items-center gap-2 text-rias-azul">
              <ShieldCheck className="h-5 w-5 text-rias-azul2" />
              <h2 className="text-lg font-bold">Semaforización</h2>
            </div>
            <p className="mt-2 text-sm text-rias-tenue">
              Cada porcentaje recibe un color según su nivel de cumplimiento:
            </p>
            <div className="mt-3">
              <LeyendaSemaforo />
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.06}>
          <div className="rias-card h-full p-6">
            <h2 className="text-lg font-bold text-rias-azul">10 componentes evaluados</h2>
            <ul className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {Object.values(COMPONENTES_META).map((c) => (
                <li key={c.nombre} className="flex items-center justify-between gap-3 border-b border-rias-borde pb-1.5">
                  <span className="text-rias-texto">{c.nombre}</span>
                  <span className="font-bold text-rias-azul2">{c.peso}%</span>
                </li>
              ))}
            </ul>
            <Link
              href="/manual"
              className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-rias-azul2 hover:underline"
            >
              Leer el manual <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
