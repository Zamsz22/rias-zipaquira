import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigurado } from "./config";

export { supabaseConfigurado };

// Si existe la clave secreta del servidor la usa (permite dejar el público en solo lectura);
// si no, usa la clave pública, como hasta ahora.
const SERVER_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

async function cookieBridge() {
  const cookieStore = await cookies();
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      } catch {
        // Server Component sin middleware: se ignora.
      }
    },
  };
}

// Cliente que conoce la sesión (para saber quién entró y para el login por correo).
export async function createAuthClient() {
  if (!supabaseConfigurado) return null;
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, { cookies: await cookieBridge() });
}

// Cliente con permisos de servidor, para tareas de administración (gestionar usuarios, deshacer).
export function createAdminClient() {
  if (!supabaseConfigurado) return null;
  return createServerClient(SUPABASE_URL, SERVER_KEY, { cookies: { getAll: () => [], setAll: () => {} } });
}

// Cliente de Supabase para leer datos desde el servidor.
export async function createClient() {
  if (!supabaseConfigurado) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SERVER_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamado desde un Server Component: se puede ignorar si hay middleware.
        }
      },
    },
  });
}
