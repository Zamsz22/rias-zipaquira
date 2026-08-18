-- ============================================================
-- Plataforma RIAS Zipaquirá — Modelo de datos inicial
-- Ejecutar en el SQL Editor de Supabase.
-- La plataforma NO recalcula: cada fila guarda el valor literal del Excel.
-- ============================================================

create extension if not exists "pgcrypto";

-- EPS / régimen
create table if not exists eps (
  id text primary key,
  nombre text not null,
  regimen boolean default false,
  logo_url text,
  color text,
  creada_por uuid,
  created_at timestamptz default now()
);

-- IPS primaria (1 o más por EPS)
create table if not exists ips (
  id uuid primary key default gen_random_uuid(),
  eps_id text references eps(id) on delete cascade,
  nombre text not null,
  sede text
);

-- Periodos de carga (trimestral)
create table if not exists periodos (
  id uuid primary key default gen_random_uuid(),
  anio int not null,
  trimestre int not null,
  unique (anio, trimestre)
);

-- Registro de cada archivo subido
create table if not exists cargas (
  id uuid primary key default gen_random_uuid(),
  eps_id text references eps(id) on delete cascade,
  periodo_id uuid references periodos(id),
  tipo_documento text not null,   -- adherencia_hc | indicadores | anexos | biomedica | plan_mejora | alertas | capacidad
  modo_lectura text not null,     -- plantilla | actual | mixto
  archivo_nombre text,
  storage_path text,
  total_filas int,
  porcentaje numeric,             -- % tal como vino o se detectó en el archivo
  created_at timestamptz default now()
);

-- Resultado por componente (alimenta el dashboard y el semáforo)
create table if not exists resultados_componente (
  id uuid primary key default gen_random_uuid(),
  eps_id text references eps(id) on delete cascade,
  periodo_id uuid references periodos(id),
  componente text not null,       -- ver scoring.Componente
  valor_pct numeric not null,     -- valor literal (la plataforma NO lo calcula)
  created_at timestamptz default now()
);

-- Filas normalizadas por tipo de documento. `datos` guarda el registro tal cual (JSON).
create table if not exists registros (
  id uuid primary key default gen_random_uuid(),
  carga_id uuid references cargas(id) on delete cascade,
  eps_id text references eps(id) on delete cascade,
  periodo_id uuid references periodos(id),
  tipo_documento text not null,
  hoja text,
  datos jsonb not null,
  created_at timestamptz default now()
);
create index if not exists idx_registros_eps_tipo on registros (eps_id, tipo_documento);

-- Evidencias fotográficas (pestaña final)
create table if not exists evidencias (
  id uuid primary key default gen_random_uuid(),
  eps_id text references eps(id) on delete cascade,
  periodo_id uuid references periodos(id),
  foto_url text not null,
  descripcion text,
  created_at timestamptz default now()
);

-- ============================================================
-- Semilla: los 9 prestadores priorizados
-- ============================================================
insert into eps (id, nombre, regimen) values
  ('famisanar', 'EPS Famisanar', false),
  ('nueva-eps', 'Nueva EPS', false),
  ('sura', 'EPS Sura', false),
  ('cosalud', 'EPS CoSalud', false),
  ('compensar', 'EPS Compensar', false),
  ('magisterio', 'Régimen especial Magisterio', true),
  ('sanitas', 'EPS Sanitas', false),
  ('salud-total', 'EPS Salud Total', false),
  ('sanidad-policia', 'Régimen especial Sanidad Policía', true)
on conflict (id) do nothing;

insert into ips (eps_id, nombre) values
  ('famisanar', 'CAS Cafam'),
  ('nueva-eps', 'Clínica Chía Sede 1'),
  ('sura', 'AIG Servicios en Salud'),
  ('cosalud', 'Hospital Unidad Funcional Samaritana'),
  ('compensar', 'Viva 1A'),
  ('magisterio', 'Servisalud QSL'),
  ('sanitas', 'Clínica Chía Sede 2'),
  ('salud-total', 'Virrey Solís'),
  ('sanidad-policia', 'Establecimiento de Sanidad Policía')
on conflict do nothing;

-- ============================================================
-- Row Level Security.
-- PROTOTIPO sin login: RLS habilitado en todas las tablas con acceso total
-- (lectura y escritura) para la clave anon. Cuando se defina el modelo de
-- usuarios, reemplazar estas políticas por unas restringidas por rol/auth.uid().
-- ============================================================
alter table eps enable row level security;
alter table ips enable row level security;
alter table periodos enable row level security;
alter table cargas enable row level security;
alter table registros enable row level security;
alter table resultados_componente enable row level security;
alter table evidencias enable row level security;

create policy "acceso total eps" on eps for all using (true) with check (true);
create policy "acceso total ips" on ips for all using (true) with check (true);
create policy "acceso total periodos" on periodos for all using (true) with check (true);
create policy "acceso total cargas" on cargas for all using (true) with check (true);
create policy "acceso total registros" on registros for all using (true) with check (true);
create policy "acceso total resultados" on resultados_componente for all using (true) with check (true);
create policy "acceso total evidencias" on evidencias for all using (true) with check (true);
