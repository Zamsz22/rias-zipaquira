// Quién entró y con qué rol. Sin sesión = público (solo lectura); para editar o subir
// hace falta iniciar sesión con un correo autorizado.

import { createAuthClient, createAdminClient, supabaseConfigurado } from "@/lib/supabase/server";

export type Rol = "admin" | "editor";
export type Usuario = { email: string; rol: Rol; activo: boolean; nombre: string | null };

// Interruptor: si AUTH_REQUIRED vale "1", subir o editar exige haber iniciado sesión.
// Mientras no esté, todo sigue abierto (se activa cuando el login ya funcione).
export const authRequerido = () => process.env.AUTH_REQUIRED === "1";

// Usuario autorizado actual, o null si no hay sesión / no está autorizado / está inactivo.
export async function usuarioActual(): Promise<Usuario | null> {
  if (!supabaseConfigurado) return null;
  const auth = await createAuthClient();
  if (!auth) return null;
  const { data } = await auth.auth.getUser();
  const email = data.user?.email;
  if (!email) return null;

  const db = createAdminClient();
  if (!db) return null;
  const { data: fila } = await db
    .from("usuarios_autorizados")
    .select("email, rol, activo, nombre")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!fila || !fila.activo) return null;
  return { email: fila.email, rol: fila.rol as Rol, activo: fila.activo, nombre: fila.nombre ?? null };
}

// ¿El correo está autorizado y activo? (se revisa antes de enviar el PIN).
export async function correoAutorizado(email: string): Promise<boolean> {
  if (!supabaseConfigurado) return false;
  const db = createAdminClient();
  if (!db) return false;
  const { data } = await db
    .from("usuarios_autorizados")
    .select("activo")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return Boolean(data?.activo);
}
