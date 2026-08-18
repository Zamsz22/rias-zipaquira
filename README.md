# Plataforma Integral de Seguimiento RIAS — Zipaquirá

Plataforma web de la Secretaría de Salud de Zipaquirá para hacer seguimiento a la
implementación de las Rutas Integrales de Atención en Salud (RIAS) por parte de las EPS e IPS.

Reúne los Excel que entregan los prestadores, saca las cifras de cada componente,
las muestra con semáforo por EPS y genera informes en PDF con análisis.

## Qué hace

- Lee los Excel de cada componente: adherencia a historia clínica, indicadores, anexos,
  capacidad instalada, equipos biomédicos, alertas, canalización, oportunidad de citas,
  medicamentos y laboratorios.
- Calcula un índice integral por prestador y lo muestra con colores de semáforo.
- Módulo de Plan de Mejora con seguimiento editable por hallazgo.
- Informes en PDF por corte (mensual, trimestral, anual o personalizado) con análisis de IA.
- Acceso por roles: el público consulta; para subir o editar información hay que iniciar sesión
  con un correo autorizado por el administrador.

La plataforma no recalcula ni inventa datos: respeta los valores que trae cada Excel.
Los datos personales de los pacientes se anonimizan antes de guardarse (solo las iniciales
del nombre y los últimos 4 dígitos del documento).

## Tecnología

Next.js, React y Tailwind. Los datos se guardan en Supabase, el análisis de texto lo hace un
worker de Cloudflare y el despliegue va en Vercel.

## Correr en local

1. `npm install`
2. Crea un archivo `.env.local` con las claves de Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `npm run dev` y abre http://localhost:3000

## Base de datos

Los scripts de `supabase/migrations` crean las tablas. Se ejecutan en orden en el
SQL Editor de Supabase.
