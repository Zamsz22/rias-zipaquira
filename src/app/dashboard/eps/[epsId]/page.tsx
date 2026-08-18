import Link from "next/link";
import { notFound } from "next/navigation";
import { getResultado, getRegistros, getAnalisis } from "@/lib/data";
import { getPrestador } from "@/lib/prestadores";
import { EpsOverview } from "@/components/eps-overview";
import { EpsTabs } from "@/components/eps-tabs";
import { AutoRefresh } from "@/components/auto-refresh";
import { EpsStickyHeader } from "@/components/eps-sticky-header";
import { PlanMejoraBoton } from "@/components/plan-mejora-modulo";
import { ArrowLeft, FolderOpen, RefreshCw, FileBarChart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EpsDetalle({ params }: { params: Promise<{ epsId: string }> }) {
  const { epsId } = await params;
  const [resultado, registros, analisis] = await Promise.all([
    getResultado(epsId),
    getRegistros(epsId),
    getAnalisis(epsId),
  ]);
  if (!resultado) notFound();
  const prestador = getPrestador(epsId);
  const vacia = resultado.medidos.length === 0 && Object.values(resultado.conteos).every((n) => n === 0);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
      <AutoRefresh segundos={60} />
      <EpsStickyHeader eps={resultado.eps} ips={resultado.ips} indice={resultado.indice} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/prestadores"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-rias-azul2 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Todos los prestadores
        </Link>
        <div className="flex items-center gap-3">
          {resultado.fuente === "demo" && (
            <span className="rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-bold text-[#946d00]">
              Datos de ejemplo · sube los Excel para ver datos reales
            </span>
          )}
          <Link
            href={`/dashboard/eps/${epsId}/informe`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rias-azul px-3 py-1.5 text-sm font-bold text-white transition hover:bg-rias-azul2"
          >
            <FileBarChart className="h-4 w-4 text-rias-lima" /> Generar informe PDF
          </Link>
          <Link
            href="/cargar"
            className="inline-flex items-center gap-1.5 rounded-xl border border-rias-borde bg-white px-3 py-1.5 text-sm font-bold text-rias-azul transition hover:bg-rias-app"
          >
            <RefreshCw className="h-4 w-4 text-rias-azul2" /> Actualizar datos
          </Link>
        </div>
      </div>

      {vacia && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#cfe0fd] bg-[#eef5ff] px-5 py-4">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-5 w-5 text-rias-azul2" />
            <p className="text-sm font-semibold text-rias-azul">
              Esta EPS aún no tiene archivos cargados. Sube sus Excel para ver el análisis.
            </p>
          </div>
          <Link
            href="/cargar"
            className="inline-flex items-center gap-1.5 rounded-xl bg-rias-azul px-4 py-2 text-sm font-bold text-white transition hover:bg-rias-azul2"
          >
            Cargar archivos <RefreshCw className="h-4 w-4" />
          </Link>
        </div>
      )}

      <EpsOverview
        eps={resultado.eps}
        ips={resultado.ips}
        regimen={Boolean(prestador?.regimen)}
        indice={resultado.indice}
        componentes={resultado.componentes}
        conteos={resultado.conteos}
      />

      {/* MÓDULO independiente de Plan de Mejora (pop-up animado sobre la EPS) */}
      <div className="mt-8">
        <PlanMejoraBoton registros={registros.filter((r) => r.tipo === "plan_mejora")} eps={resultado.eps} epsId={resultado.id} />
      </div>

      <div className="mb-2 mt-8 flex items-center gap-2">
        <FolderOpen className="h-5 w-5 text-rias-azul2" />
        <h2 className="text-lg font-bold text-rias-azul">Detalle por documento</h2>
      </div>
      <p className="mb-1 text-sm text-rias-tenue">
        Cada pestaña muestra los datos cargados de cada tipo de Excel, con su tabla y su gráfica.
      </p>
      <EpsTabs componentes={resultado.componentes} registros={registros} analisis={analisis} />
    </div>
  );
}
