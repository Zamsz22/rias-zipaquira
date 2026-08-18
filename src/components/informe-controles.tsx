"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import type { Corte } from "@/lib/informe";
import { Printer, CalendarRange } from "lucide-react";

const OPCIONES: { c: Corte; t: string }[] = [
  { c: "mensual", t: "Mensual" },
  { c: "trimestral", t: "Trimestral" },
  { c: "anual", t: "Anual" },
  { c: "personalizado", t: "Por corte" },
];

// Barra de controles del informe (no se imprime). Cambia el corte por la URL y dispara la impresión/PDF.
export function InformeControles({ corte, desde, hasta }: { corte: Corte; desde?: string; hasta?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [d, setD] = useState(desde ?? "");
  const [h, setH] = useState(hasta ?? "");

  const ir = (c: Corte, extra?: string) => router.push(`${pathname}?corte=${c}${extra ?? ""}`);

  return (
    <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rias-borde bg-white px-5 py-3.5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-rias-tenue">Corte</span>
        {OPCIONES.map((o) => (
          <button
            key={o.c}
            onClick={() => ir(o.c)}
            className={`rounded-xl px-3 py-1.5 text-sm font-bold transition ${corte === o.c ? "bg-rias-azul text-white" : "bg-rias-app text-rias-azul hover:bg-rias-borde"}`}
          >
            {o.t}
          </button>
        ))}
        {corte === "personalizado" && (
          <span className="flex flex-wrap items-center gap-1.5">
            <CalendarRange className="h-4 w-4 text-rias-azul2" />
            <input type="date" value={d} onChange={(e) => setD(e.target.value)} className="rounded-lg border border-rias-borde px-2 py-1 text-sm" />
            <span className="text-rias-tenue">—</span>
            <input type="date" value={h} onChange={(e) => setH(e.target.value)} className="rounded-lg border border-rias-borde px-2 py-1 text-sm" />
            <button
              onClick={() => ir("personalizado", `${d ? `&desde=${d}` : ""}${h ? `&hasta=${h}` : ""}`)}
              className="rounded-lg bg-rias-azul2 px-3 py-1 text-sm font-bold text-white transition hover:bg-rias-azul"
            >
              Aplicar
            </button>
          </span>
        )}
      </div>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl bg-rias-azul px-4 py-2 text-sm font-bold text-white transition hover:bg-rias-azul2"
      >
        <Printer className="h-4 w-4" /> Descargar PDF
      </button>
    </div>
  );
}
