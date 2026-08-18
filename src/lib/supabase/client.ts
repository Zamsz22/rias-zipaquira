"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigurado } from "./config";

export { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigurado };

// Devuelve un cliente del navegador, o null si Supabase aún no está configurado.
export function createClient() {
  if (!supabaseConfigurado) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
