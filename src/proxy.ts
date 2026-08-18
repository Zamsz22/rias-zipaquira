import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigurado } from "@/lib/supabase/config";

// Mantiene viva la sesión en cada petición. No redirige: el control de acceso se hace
// en cada página, para no arriesgar bucles de redirección.
export async function proxy(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  if (!supabaseConfigurado) return res;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|pdf|xlsx|ico)$).*)"],
};
