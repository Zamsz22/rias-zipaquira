// Conexión a Supabase. Toma las claves de las variables de entorno; si no están,
// usa las claves públicas del proyecto (son públicas por diseño; la seguridad va por RLS).
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gpjtcdirqcrlxqrduzqq.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_l801eqUpT3NKK6rBcrdQtA_8bV5JN8z";
export const supabaseConfigurado = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
