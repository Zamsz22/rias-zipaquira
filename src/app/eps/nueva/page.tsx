"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseConfigurado } from "@/lib/supabase/client";
import { Building2, Loader2, AlertTriangle, ArrowRight } from "lucide-react";

export default function NuevaEps() {
  const router = useRouter();
  const [eps, setEps] = useState("");
  const [ips, setIps] = useState("");
  const [regimen, setRegimen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const res = await fetch("/api/eps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eps, ips, regimen }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo crear la EPS.");
      } else {
        router.push(`/dashboard/eps/${data.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <div className="mb-2 flex items-center gap-2 text-rias-azul">
        <Building2 className="h-6 w-6" />
        <h2 className="text-2xl font-extrabold">Crear nueva EPS</h2>
      </div>
      <p className="text-sm text-[#5c6b75]">
        Define la EPS y su IPS primaria. Luego podrás subirle sus Excel y la sección se arma sola.
      </p>

      {!supabaseConfigurado && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#f1df91] bg-[#fffdf1] px-4 py-3 text-sm text-[#7a6500]">
          <AlertTriangle className="h-4 w-4" /> Conecta Supabase (claves en .env.local) para poder crear EPS.
        </div>
      )}

      <form onSubmit={crear} className="rias-card mt-6 space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-rias-azul">Nombre de la EPS / régimen</label>
          <input
            value={eps}
            onChange={(e) => setEps(e.target.value)}
            required
            placeholder="Ej: EPS Mutual Ser"
            className="w-full rounded-xl border border-[#cfdce4] bg-white px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold text-rias-azul">IPS primaria</label>
          <input
            value={ips}
            onChange={(e) => setIps(e.target.value)}
            required
            placeholder="Ej: Clínica La Sabana"
            className="w-full rounded-xl border border-[#cfdce4] bg-white px-3 py-2.5 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-rias-texto">
          <input type="checkbox" checked={regimen} onChange={(e) => setRegimen(e.target.checked)} />
          Es un régimen especial
        </label>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-[#ffd2d2] bg-[#fff1f1] px-3 py-2 text-sm text-rias-rojo">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!supabaseConfigurado || guardando}
          className="inline-flex items-center gap-2 rounded-xl bg-rias-azul px-4 py-2.5 text-sm font-bold text-white transition enabled:hover:bg-rias-azul2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {guardando ? "Creando…" : "Crear EPS y abrir su sección"}
        </button>
      </form>
    </div>
  );
}
