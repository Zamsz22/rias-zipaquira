-- ============================================================
-- Seguimiento EDITABLE del Plan de Mejora.
-- El Formato de Plan de Mejora del Excel trae los hallazgos pero las columnas de
-- CUMPLIÓ / NO CUMPLIÓ vienen vacías: el seguimiento se lleva aquí, en la plataforma,
-- y se actualiza periódicamente por EPS/IPS.
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

create table if not exists plan_mejora_seguimiento (
  id uuid primary key default gen_random_uuid(),
  eps_id text references eps(id) on delete cascade,
  clave text not null,                 -- identifica el hallazgo (ruta + descripción)
  resultado text,                      -- Efectivo | No efectivo | En seguimiento
  avance int check (avance between 0 and 100),
  observacion text,
  responsable text,
  fecha_cierre date,
  actualizado_por text,
  updated_at timestamptz default now(),
  unique (eps_id, clave)
);
create index if not exists idx_pm_seg_eps on plan_mejora_seguimiento (eps_id);

-- Prototipo (igual que 0001): acceso total. Al endurecer seguridad (0002) se
-- reemplaza por lectura pública + escritura solo del servidor (service_role).
alter table plan_mejora_seguimiento enable row level security;
create policy "acceso total pm_seg" on plan_mejora_seguimiento for all using (true) with check (true);
