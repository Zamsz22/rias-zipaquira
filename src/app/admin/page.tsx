import Link from "next/link";
import { usuarioActual } from "@/lib/auth";
import { AdminPanel } from "@/components/admin-panel";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const u = await usuarioActual();

  if (!u || u.rol !== "admin") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
        <ShieldAlert className="h-10 w-10 text-rias-azul2" />
        <h1 className="mt-3 text-xl font-extrabold text-rias-azul">Acceso restringido</h1>
        <p className="mt-1 text-sm text-rias-tenue">
          {u ? "Tu cuenta no tiene permisos de administrador." : "Inicia sesión con un correo autorizado para administrar la plataforma."}
        </p>
        <Link href="/acceso" className="mt-4 rounded-xl bg-rias-azul px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rias-azul2">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return <AdminPanel email={u.email} />;
}
