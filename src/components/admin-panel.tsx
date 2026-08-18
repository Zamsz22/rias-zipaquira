"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Trash2, ShieldCheck, ShieldOff, Undo2, LogOut, Loader2, Users, History } from "lucide-react";

type Usuario = { email: string; rol: string; activo: boolean; nombre: string | null };
type Carga = { id: string; eps_id: string; tipo_documento: string; archivo_nombre: string | null; total_filas: number; created_at: string };

export function AdminPanel({ email }: { email: string }) {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [nuevo, setNuevo] = useState({ email: "", nombre: "", rol: "editor" });
  const [ocupado, setOcupado] = useState(false);

  async function recargar() {
    const [u, c] = await Promise.all([
      fetch("/api/usuarios").then((r) => r.json()),
      fetch("/api/cargas").then((r) => r.json()),
    ]);
    if (u.ok) setUsuarios(u.usuarios);
    if (c.ok) setCargas(c.cargas);
  }
  useEffect(() => { recargar(); }, []);

  async function guardarUsuario() {
    if (!nuevo.email.includes("@")) return;
    setOcupado(true);
    await fetch("/api/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nuevo) });
    setNuevo({ email: "", nombre: "", rol: "editor" });
    await recargar();
    setOcupado(false);
  }
  async function toggle(u: Usuario) {
    await fetch("/api/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...u, activo: !u.activo }) });
    recargar();
  }
  async function quitar(em: string) {
    if (!confirm(`¿Quitar el acceso a ${em}?`)) return;
    await fetch(`/api/usuarios?email=${encodeURIComponent(em)}`, { method: "DELETE" });
    recargar();
  }
  async function deshacer(c: Carga) {
    if (!confirm(`¿Deshacer la carga de ${c.tipo_documento} en ${c.eps_id}? Se eliminarán sus registros y el valor del componente.`)) return;
    await fetch(`/api/cargas?id=${c.id}`, { method: "DELETE" });
    recargar();
    router.refresh();
  }
  async function salir() {
    const s = createClient();
    await s?.auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rias-azul text-white"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-extrabold text-rias-azul">Administración</h1>
            <p className="text-xs text-rias-tenue">Sesión: {email}</p>
          </div>
        </div>
        <button onClick={salir} className="inline-flex items-center gap-1.5 rounded-xl border border-rias-borde bg-white px-3.5 py-2 text-sm font-bold text-rias-azul transition hover:bg-rias-app">
          <LogOut className="h-4 w-4" /> Salir
        </button>
      </div>

      {/* Usuarios autorizados */}
      <section className="rias-card p-6">
        <div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-rias-azul2" /><h2 className="text-lg font-bold text-rias-azul">Usuarios autorizados</h2></div>

        <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} placeholder="correo@ejemplo.com" className="rounded-lg border border-rias-borde px-3 py-2 text-sm" />
          <input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder="Nombre (opcional)" className="rounded-lg border border-rias-borde px-3 py-2 text-sm" />
          <select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })} className="rounded-lg border border-rias-borde px-3 py-2 text-sm font-semibold">
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
          </select>
          <button onClick={guardarUsuario} disabled={ocupado} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rias-azul px-3.5 py-2 text-sm font-bold text-white transition hover:bg-rias-azul2 disabled:opacity-60">
            {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Autorizar
          </button>
        </div>

        <div className="divide-y divide-rias-borde">
          {usuarios.map((u) => (
            <div key={u.email} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-rias-texto">{u.nombre || u.email}</p>
                <p className="truncate text-xs text-rias-tenue">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${u.rol === "admin" ? "bg-rias-azul text-white" : "bg-rias-app text-rias-azul"}`}>{u.rol === "admin" ? "Admin" : "Editor"}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${u.activo ? "bg-[#e7f6ec] text-[#157f3a]" : "bg-[#fbe3e3] text-[#b91c1c]"}`}>{u.activo ? "Activo" : "Inactivo"}</span>
                <button onClick={() => toggle(u)} title={u.activo ? "Desactivar" : "Activar"} className="rounded-lg border border-rias-borde p-1.5 text-rias-tenue transition hover:bg-rias-app">
                  {u.activo ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                </button>
                <button onClick={() => quitar(u.email)} title="Quitar acceso" className="rounded-lg border border-rias-borde p-1.5 text-rias-rojo transition hover:bg-[#fbe3e3]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {usuarios.length === 0 && <p className="py-3 text-sm text-rias-tenue">Cargando usuarios…</p>}
        </div>
      </section>

      {/* Deshacer cargas */}
      <section className="rias-card mt-6 p-6">
        <div className="mb-1 flex items-center gap-2"><History className="h-5 w-5 text-rias-azul2" /><h2 className="text-lg font-bold text-rias-azul">Deshacer cargas recientes</h2></div>
        <p className="mb-4 text-sm text-rias-tenue">Cada fila es un archivo cargado. “Deshacer” elimina esa carga, sus registros y el valor del componente para esa EPS.</p>
        <div className="max-h-[50vh] divide-y divide-rias-borde overflow-y-auto">
          {cargas.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-rias-texto"><span className="font-bold text-rias-azul">{c.eps_id}</span> · {c.tipo_documento} · {c.total_filas} filas</p>
                <p className="truncate text-xs text-rias-tenue">{c.archivo_nombre ?? "—"} · {new Date(c.created_at).toLocaleString("es-CO")}</p>
              </div>
              <button onClick={() => deshacer(c)} className="inline-flex items-center gap-1.5 rounded-lg border border-rias-borde bg-white px-3 py-1.5 text-xs font-bold text-rias-rojo transition hover:bg-[#fbe3e3]">
                <Undo2 className="h-3.5 w-3.5" /> Deshacer
              </button>
            </div>
          ))}
          {cargas.length === 0 && <p className="py-3 text-sm text-rias-tenue">No hay cargas registradas.</p>}
        </div>
      </section>
    </div>
  );
}
