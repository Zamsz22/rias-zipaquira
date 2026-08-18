"use client";

import {
  ClipboardCheck,
  Activity,
  ListChecks,
  CalendarClock,
  Stethoscope,
  BellRing,
  Share2,
  Clock,
  Pill,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import { COMPONENTES_META, clasificar, type Componente } from "@/lib/scoring";
import { CountUp, Stagger, AnimeBar, AnimeRing } from "@/components/anime-bits";
import { SemaforoDot, SemaforoPill } from "@/components/semaforo";
import { RadarComponentes } from "@/components/charts";

const ICONOS: Record<Componente, LucideIcon> = {
  adherencia_hc: ClipboardCheck,
  indicadores: Activity,
  anexos: ListChecks,
  capacidad: CalendarClock,
  biomedica: Stethoscope,
  alertas: BellRing,
  canalizacion: Share2,
  oportunidad: Clock,
  medicamentos: Pill,
  laboratorios: FlaskConical,
};

const LABEL_RADAR: Record<Componente, string> = {
  adherencia_hc: "Adherencia",
  indicadores: "Indicadores",
  anexos: "Anexos",
  capacidad: "Capacidad",
  biomedica: "Biomédica",
  alertas: "Alertas",
  canalizacion: "Canalización",
  oportunidad: "Oportunidad",
  medicamentos: "Medicam.",
  laboratorios: "Laborat.",
};

export function EpsOverview({
  eps,
  ips,
  regimen,
  indice,
  componentes,
  conteos,
}: {
  eps: string;
  ips: string;
  regimen: boolean;
  indice: number;
  componentes: Record<Componente, number | null>;
  conteos: Record<Componente, number>;
}) {
  const s = clasificar(indice);
  const claves = Object.keys(COMPONENTES_META) as Componente[];
  const radar = claves.filter((c) => componentes[c] !== null).map((c) => ({ eje: LABEL_RADAR[c], valor: componentes[c] as number }));

  return (
    <div className="space-y-5" data-tour="eps-overview">
      {/* Encabezado */}
      <div className="rias-card overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-alcaldia.webp"
              alt="Alcaldía de Zipaquirá"
              className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-rias-azul sm:text-2xl">{eps}</h1>
                {regimen && (
                  <span className="rounded-full bg-rias-app px-2.5 py-0.5 text-xs font-bold text-rias-tenue">
                    Régimen especial
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-rias-tenue">
                IPS primaria: <span className="font-semibold text-rias-texto">{ips}</span>
              </p>
              <div className="mt-3">
                <SemaforoPill valor={indice} />
              </div>
            </div>
          </div>

          {/* Medidor (anime.js) */}
          <div className="flex items-center justify-center">
            <div className="relative h-[150px] w-[150px]">
              <svg width={150} height={150} className="-rotate-90">
                <circle cx={75} cy={75} r={69} fill="none" stroke="#edebf8" strokeWidth={12} />
                <g style={{ stroke: s.color }}>
                  <AnimeRing value={indice} size={150} stroke={12} />
                </g>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <CountUp value={indice} decimals={0} suffix="%" className="text-4xl font-extrabold text-rias-azul" />
                <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: s.texto }}>
                  <SemaforoDot color={s.color} size={9} /> Índice integral
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs por componente */}
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {claves.map((c) => {
          const Icon = ICONOS[c];
          const val = componentes[c];
          const n = conteos[c] ?? 0;
          const conDatosSinPct = val === null && n > 0;
          const sinDato = val === null && n === 0;
          const sc = clasificar(val ?? 0);
          const iconStyle = sinDato
            ? { background: "#eef2f1", color: "#90a09a" }
            : conDatosSinPct
              ? { background: "#e6efff", color: "#1f5fd0" }
              : { background: sc.bg, color: sc.color };
          return (
            <div key={c} className="rias-card p-4" style={{ opacity: 0 }}>
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={iconStyle}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="rounded-full bg-rias-app px-2 py-0.5 text-[11px] font-bold text-rias-tenue">
                  {COMPONENTES_META[c].peso}%
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-snug text-rias-texto">{COMPONENTES_META[c].nombre}</p>
              {val !== null ? (
                <>
                  <p className="mt-1 text-2xl font-extrabold text-rias-azul">
                    <CountUp value={val} decimals={1} suffix="%" />
                  </p>
                  <div className="mt-2">
                    <AnimeBar value={val} color={sc.color} />
                  </div>
                </>
              ) : conDatosSinPct ? (
                <>
                  <p className="mt-1 text-2xl font-extrabold text-rias-azul">
                    <CountUp value={n} decimals={0} />
                  </p>
                  <p className="text-xs text-rias-tenue">registros cargados (sin % en el Excel)</p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-lg font-bold text-[#90a09a]">Sin dato</p>
                  <p className="text-xs text-rias-tenue">No viene en los Excel cargados.</p>
                </>
              )}
            </div>
          );
        })}
      </Stagger>

      {/* Radar */}
      <div className="rias-card p-6">
        <h2 className="mb-1 text-lg font-bold text-rias-azul">Perfil por componente</h2>
        <p className="mb-2 text-sm text-rias-tenue">Cumplimiento de los componentes evaluados en las RIAS.</p>
        <RadarComponentes datos={radar} />
      </div>
    </div>
  );
}
