"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Mail, KeyRound, Loader2, ArrowRight, AlertTriangle } from "lucide-react";

export default function Acceso() {
  const router = useRouter();
  const [paso, setPaso] = useState<"correo" | "pin">("correo");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function enviarPin() {
    setError("");
    const correo = email.trim().toLowerCase();
    if (!correo.includes("@")) return setError("Escribe un correo válido.");
    setCargando(true);
    try {
      // 1) ¿El administrador autorizó este correo?
      const r = await (await fetch("/api/acceso", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: correo }) })).json();
      if (!r.autorizado) {
        setError("Este correo no está autorizado. Pide al administrador que te habilite.");
        return;
      }
      // 2) Enviar el PIN al correo.
      const supabase = createClient();
      if (!supabase) return setError("El acceso no está configurado todavía.");
      const { error } = await supabase.auth.signInWithOtp({ email: correo, options: { shouldCreateUser: true } });
      if (error) return setError(error.message);
      setPaso("pin");
    } catch {
      setError("No se pudo enviar el código. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  async function verificar() {
    setError("");
    const token = pin.trim();
    if (token.length < 6) return setError("El código tiene 6 dígitos.");
    setCargando(true);
    try {
      const supabase = createClient();
      if (!supabase) return setError("El acceso no está configurado todavía.");
      const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: "email" });
      if (error) return setError("Código incorrecto o vencido.");
      router.refresh();
      router.push("/admin");
    } catch {
      setError("No se pudo verificar el código.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-10">
      <div className="rias-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-rias-borde bg-gradient-to-r from-rias-azul to-rias-azul2 px-6 py-5 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><ShieldCheck className="h-6 w-6" /></span>
          <div>
            <h1 className="text-lg font-extrabold leading-tight">Acceso autorizado</h1>
            <p className="text-xs text-white/80">Solo para personas habilitadas por el administrador</p>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {paso === "correo" ? (
            <>
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rias-tenue"><Mail className="h-3.5 w-3.5" /> Correo</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enviarPin()}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full rounded-xl border border-rias-borde px-3.5 py-2.5 text-sm outline-none focus:border-rias-azul2"
                />
              </label>
              <button onClick={enviarPin} disabled={cargando} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rias-azul px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rias-azul2 disabled:opacity-60">
                {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Enviarme el código
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-rias-texto">Enviamos un código de 6 dígitos a <strong>{email}</strong>. Escríbelo aquí:</p>
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rias-tenue"><KeyRound className="h-3.5 w-3.5" /> Código (PIN)</span>
                <input
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && verificar()}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-rias-borde px-3.5 py-2.5 text-center text-lg font-bold tracking-[0.4em] outline-none focus:border-rias-azul2"
                />
              </label>
              <button onClick={verificar} disabled={cargando} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rias-azul px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rias-azul2 disabled:opacity-60">
                {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Entrar
              </button>
              <button onClick={() => { setPaso("correo"); setPin(""); setError(""); }} className="w-full text-center text-xs font-bold text-rias-azul2 hover:underline">
                Usar otro correo
              </button>
            </>
          )}

          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-[#fbe3e3] px-3 py-2 text-sm font-semibold text-rias-rojo">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-rias-tenue">
        El público puede consultar la plataforma sin iniciar sesión. El acceso es solo para subir o editar información.
      </p>
    </div>
  );
}
