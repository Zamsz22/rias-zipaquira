"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";

// Recarga los datos del servidor (gráficas, índices) al instante.
export function BotonActualizar() {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      onClick={() => iniciar(() => router.refresh())}
      disabled={pendiente}
      className="inline-flex items-center gap-2 rounded-xl border border-rias-borde bg-white px-4 py-2.5 text-sm font-bold text-rias-azul transition hover:bg-rias-app disabled:opacity-60"
    >
      <RefreshCw className={`h-4 w-4 text-rias-azul2 ${pendiente ? "animate-spin" : ""}`} />
      {pendiente ? "Actualizando…" : "Actualizar"}
    </button>
  );
}
