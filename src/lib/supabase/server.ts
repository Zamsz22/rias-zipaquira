import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigurado } from "./config";

export { supabaseConfigurado };

// Si existe la clave secreta del servidor la usa (permite dejar el público en solo lectura);
// si no, usa la clave pública, como hasta ahora.
const SERVER_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

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
