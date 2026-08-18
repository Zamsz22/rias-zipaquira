-- ============================================================
-- Endurecimiento de seguridad (RLS).
-- EJECUTAR SOLO DESPUÉS de definir SUPABASE_SERVICE_ROLE_KEY en el servidor
-- (Vercel → Settings → Environment Variables y en .env.local), porque a partir
-- de aquí la clave pública (anon) ya NO podrá escribir: solo leer.
-- El servidor (API routes) escribe con la service_role, que ignora RLS.
-- ============================================================

-- Quitar las políticas de acceso total del prototipo.
drop policy if exists "acceso total eps" on eps;
drop policy if exists "acceso total ips" on ips;
drop policy if exists "acceso total periodos" on periodos;
drop policy if exists "acceso total cargas" on cargas;
drop policy if exists "acceso total registros" on registros;
drop policy if exists "acceso total resultados" on resultados_componente;
drop policy if exists "acceso total evidencias" on evidencias;

-- Lectura pública (la app lee con la clave pública). Escritura: nadie con anon
-- (solo el servidor con service_role, que omite RLS).
create policy "lectura publica eps" on eps for select using (true);
create policy "lectura publica ips" on ips for select using (true);
create policy "lectura publica periodos" on periodos for select using (true);
create policy "lectura publica cargas" on cargas for select using (true);
create policy "lectura publica registros" on registros for select using (true);
create policy "lectura publica resultados" on resultados_componente for select using (true);
create policy "lectura publica evidencias" on evidencias for select using (true);
