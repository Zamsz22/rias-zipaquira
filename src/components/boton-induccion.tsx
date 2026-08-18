"use client";

import { Sparkles } from "lucide-react";

export function BotonInduccion() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("rias:induccion"))}
      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-rias-azul transition hover:bg-white/90"
    >
      <Sparkles className="h-4 w-4 text-rias-azul2" /> Iniciar inducción guiada
    </button>
  );
}
