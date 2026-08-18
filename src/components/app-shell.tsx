"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Gauge,
  CloudUpload,
  GraduationCap,
  Compass,
  Building2,
  Menu,
  X,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  LogIn,
  LogOut,
} from "lucide-react";
import { iniciarTour } from "@/lib/tour";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/", label: "Inicio", icon: Compass },
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/prestadores", label: "Prestadores", icon: Building2 },
  { href: "/cargar", label: "Cargar", icon: CloudUpload },
  { href: "/manual", label: "Manual", icon: GraduationCap },
];

function esActivo(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Marca() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-alcaldia.webp"
        alt="Alcaldía de Zipaquirá"
        className="h-12 w-12 shrink-0 object-contain"
      />
      <div className="leading-tight">
        <p className="text-[15px] font-extrabold text-rias-azul">RIAS Zipaquirá</p>
        <p className="hidden text-[11px] font-medium text-rias-tenue sm:block">Secretaría de Salud · 2026</p>
      </div>
    </Link>
  );
}

type Yo = { email: string; rol: string } | null;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [yo, setYo] = useState<Yo>(null);

  useEffect(() => {
    fetch("/api/yo").then((r) => r.json()).then((j) => setYo(j.usuario)).catch(() => {});
  }, [pathname]);

  async function salir() {
    await createClient()?.auth.signOut();
    setYo(null);
    router.refresh();
    router.push("/");
  }

  // Lanza el tour la primera vez que entra el usuario, y cuando se pida (botón / Manual).
  useEffect(() => {
    const lanzar = () => iniciarTour(router);
    if (!localStorage.getItem("rias_induccion_v1")) {
      localStorage.setItem("rias_induccion_v1", "1");
      const t = setTimeout(lanzar, 600);
      window.addEventListener("rias:induccion", lanzar);
      return () => {
        clearTimeout(t);
        window.removeEventListener("rias:induccion", lanzar);
      };
    }
    window.addEventListener("rias:induccion", lanzar);
    return () => window.removeEventListener("rias:induccion", lanzar);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-rias-borde bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-3">
          <Marca />

          {/* Nav central (pill) */}
          <nav className="hidden items-center gap-1 rounded-2xl bg-rias-app p-1 lg:flex">
            {NAV.map((l) => {
              const activo = esActivo(l.href, pathname);
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    activo ? "bg-rias-azul text-white shadow-[var(--shadow-brand)]" : "text-rias-tenue hover:text-rias-azul"
                  }`}
                >
                  <Icon className={`h-[17px] w-[17px] ${activo ? "text-rias-lima" : ""}`} />
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => iniciarTour(router)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rias-borde px-3 py-2 text-sm font-bold text-rias-azul transition hover:bg-rias-app"
            >
              <Sparkles className="h-4 w-4 text-rias-azul2" /> <span className="hidden sm:inline">Inducción</span>
            </button>
            <Link
              href="/eps/nueva"
              className="hidden items-center gap-2 rounded-xl bg-rias-azul px-3.5 py-2 text-sm font-bold text-white transition hover:bg-rias-azul2 sm:inline-flex"
            >
              <PlusCircle className="h-4 w-4 text-rias-lima" /> Nueva EPS
            </Link>

            {/* Sesión */}
            {yo?.rol === "admin" && (
              <Link href="/admin" className="hidden items-center gap-1.5 rounded-xl border border-rias-borde px-3 py-2 text-sm font-bold text-rias-azul transition hover:bg-rias-app sm:inline-flex">
                <ShieldCheck className="h-4 w-4 text-rias-azul2" /> Admin
              </Link>
            )}
            {yo ? (
              <button onClick={salir} title="Cerrar sesión" className="hidden items-center gap-1.5 rounded-xl border border-rias-borde px-3 py-2 text-sm font-bold text-rias-azul transition hover:bg-rias-app sm:inline-flex">
                <LogOut className="h-4 w-4 text-rias-azul2" /> Salir
              </button>
            ) : (
              <Link href="/acceso" className="hidden items-center gap-1.5 rounded-xl border border-rias-borde px-3 py-2 text-sm font-bold text-rias-azul transition hover:bg-rias-app sm:inline-flex">
                <LogIn className="h-4 w-4 text-rias-azul2" /> Acceso
              </Link>
            )}

            <button
              onClick={() => setAbierto(true)}
              aria-label="Abrir menú"
              className="rounded-xl border border-rias-borde p-2 text-rias-azul lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer móvil */}
      {abierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-rias-noche/50 backdrop-blur-sm" onClick={() => setAbierto(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[270px] max-w-[85vw] flex-col gap-2 overflow-y-auto bg-white px-4 py-5 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <Marca />
              <button onClick={() => setAbierto(false)} aria-label="Cerrar" className="p-2 text-rias-tenue">
                <X className="h-5 w-5" />
              </button>
            </div>
            {NAV.map((l) => {
              const activo = esActivo(l.href, pathname);
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setAbierto(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold ${
                    activo ? "bg-rias-azul text-white" : "text-rias-tenue hover:bg-rias-app"
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${activo ? "text-rias-lima" : ""}`} /> {l.label}
                </Link>
              );
            })}
            <Link
              href="/eps/nueva"
              onClick={() => setAbierto(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-rias-azul px-4 py-3 text-sm font-bold text-white"
            >
              <PlusCircle className="h-4 w-4 text-rias-lima" /> Nueva EPS
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1">{children}</main>
      <footer className="border-t border-rias-borde px-6 py-5 text-center text-xs text-rias-tenue">
        Sistema Integral de Riesgo RIAS Zipaquirá 2026 · Secretaría de Salud de Zipaquirá
      </footer>
    </div>
  );
}
