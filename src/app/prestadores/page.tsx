import Link from "next/link";
import { getResultados } from "@/lib/data";
import { COMPONENTES_META, type Componente } from "@/lib/scoring";
import { SemaforoPill } from "@/components/semaforo";
import { ProgressRing } from "@/components/dashboard-bits";
import { Stagger } from "@/components/anime-bits";
import { ArrowRight, Building2, PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const CLAVES = Object.keys(COMPONENTES_META) as Componente[];

export default async function Prestadores() {
  const resultados = await getResultados();

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[26px] font-extrabold tracking-tight text-rias-azul">
            <Building2 className="h-6 w-6 text-rias-azul2" /> Prestadores
          </h1>
          <p className="text-sm text-rias-tenue">
            Cada EPS con su IPS primaria. Entra a una para ver su página dedicada con todo el detalle.
          </p>
        </div>
        <Link
          href="/eps/nueva"
          className="inline-flex items-center gap-2 rounded-xl bg-rias-azul px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rias-azul2"
        >
          <PlusCircle className="h-4 w-4" /> Nueva EPS
        </Link>
      </div>

      <Stagger data-tour="prestadores-grid" className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {resultados.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/eps/${r.id}`}
            className="rias-card rias-hover flex flex-col p-5"
            style={{ opacity: 0 }}
          >
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-alcaldia.webp"
                alt=""
                className="h-14 w-14 shrink-0 rounded-2xl bg-white object-contain p-1.5 ring-1 ring-rias-borde"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-rias-azul">{r.eps}</p>
                <p className="truncate text-sm text-rias-tenue">{r.ips}</p>
              </div>
              <ProgressRing value={r.indice} size={56} />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <SemaforoPill valor={r.indice} />
              <span className="inline-flex items-center gap-1 text-sm font-bold text-rias-azul2">
                Ver detalle <ArrowRight className="h-4 w-4" />
              </span>
            </div>

            {/* Mini perfil de componentes */}
            <div className="mt-4 flex h-12 items-end gap-1.5">
              {CLAVES.map((c) => {
                const v = r.componentes[c];
                return (
                  <div
                    key={c}
                    className="flex flex-1 items-end overflow-hidden rounded-md bg-rias-app"
                    style={{ height: "100%" }}
                    title={v === null ? `${COMPONENTES_META[c].nombre}: sin dato` : `${COMPONENTES_META[c].nombre}: ${v}%`}
                  >
                    {v !== null && (
                      <div
                        className="w-full rounded-md"
                        style={{
                          height: `${Math.max(v, 5)}%`,
                          background: v >= 85 ? "#16a34a" : v >= 70 ? "#d97706" : v >= 50 ? "#ea580c" : "#dc2626",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </Link>
        ))}
      </Stagger>
    </div>
  );
}
