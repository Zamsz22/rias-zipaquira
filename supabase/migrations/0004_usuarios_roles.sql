-- ============================================================
-- Usuarios y roles.
-- El acceso público es de SOLO LECTURA. Para subir/editar hay que iniciar sesión
-- con un correo AUTORIZADO por el administrador (login por PIN al correo, Supabase Auth OTP).
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

create table if not exists usuarios_autorizados (
  email text primary key,
  rol text not null default 'editor' check (rol in ('admin', 'editor')),
  activo boolean not null default true,
  nombre text,
  created_at timestamptz default now()
);

-- El administrador (tú). Cambia el correo si usas otro para entrar.
insert into usuarios_autorizados (email, rol, nombre, activo) values
  ('davidsambr716@gmail.com', 'admin', 'Administrador', true)
on conflict (email) do update set rol = 'admin', activo = true;

-- Prototipo: acceso total (igual que el resto). La APP exige rol admin para escribir
-- en esta tabla (vía /api/usuarios). Al endurecer seguridad, restringir a service_role.
alter table usuarios_autorizados enable row level security;
create policy "lectura usuarios" on usuarios_autorizados for select using (true);
create policy "escritura usuarios" on usuarios_autorizados for all using (true) with check (true);
