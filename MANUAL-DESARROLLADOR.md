# Manual de Desarrollador — Plataforma RIAS Zipaquirá

Documento de entrega para el equipo de ingeniería. Explica **con qué está hecha** la
plataforma, **dónde está cada cosa**, **cómo funciona** y **cómo está integrado Supabase**.

- **Sitio en vivo:** https://plataforma-zeta-nine.vercel.app
- **Código (GitHub):** https://github.com/Zamsz22/rias-zipaquira
- **Hosting:** Vercel · **Base de datos:** Supabase · **Análisis de texto:** Cloudflare Workers AI

---

## 1. Qué es

Plataforma de la Secretaría de Salud de Zipaquirá para hacer seguimiento a la implementación
de las **RIAS** (Rutas Integrales de Atención en Salud) por parte de las EPS/IPS. Recibe los
Excel que entregan los prestadores, extrae las cifras de cada componente, las muestra con
semáforo por prestador y genera informes en PDF con análisis.

**Principio central:** la plataforma **no recalcula ni inventa** datos. Respeta el valor que
trae cada Excel; solo le asigna un color de semáforo. Los datos personales de pacientes se
**anonimizan en el parser** (solo iniciales del nombre y últimos 4 dígitos del documento)
antes de llegar a la base de datos.

---

## 2. Tecnologías

| Área | Tecnología |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, Server Components) |
| UI | **React 19**, **Tailwind CSS v4**, **TypeScript** |
| Gráficas / animación | Recharts, anime.js, framer-motion |
| Íconos | lucide-react |
| Lectura de Excel | **SheetJS (`xlsx`)** — corre igual en navegador y en Node |
| Base de datos | **Supabase** (Postgres + API REST) vía `@supabase/ssr` |
| Análisis IA | **Cloudflare Worker** con Workers AI (Llama 3.3 70B) |
| Hosting | **Vercel** |
| ZIP en carga masiva | jszip |
| Tour de inducción | driver.js |

> ⚠️ Es un Next.js 16 reciente: `params`/`searchParams` son **async** (Promises), y la
> convención de middleware se llama ahora `proxy`. Ver `AGENTS.md`.

---

## 3. Correr en local

```bash
npm install
# crear .env.local (ver sección 11)
npm run dev        # http://localhost:3000
```

Otros comandos: `npm run build` (build de producción), `npm run start` (servir el build),
`npm run lint`.

---

## 4. Estructura del proyecto

```
plataforma/
├── src/
│   ├── app/                      # Páginas y APIs (App Router)
│   │   ├── page.tsx              # Inicio
│   │   ├── dashboard/            # Resumen del municipio + página por EPS + informe
│   │   ├── prestadores/          # Directorio de EPS
│   │   ├── cargar/               # Carga masiva de Excel
│   │   ├── manual/               # Manual de usuario (dentro de la app)
│   │   ├── eps/nueva/            # Crear EPS
│   │   └── api/                  # Endpoints (cargas, eps, plan-mejora)
│   ├── components/               # Componentes React (tablas, gráficas, modales…)
│   └── lib/
│       ├── excel/
│       │   ├── rias-core.mjs     # ★ EL PARSER (corazón del sistema)
│       │   ├── specs.ts          # Tipos de documento y detección
│       │   └── eps-detect.ts     # Detecta la EPS por nombre/carpeta
│       ├── data.ts               # Lectura de datos desde Supabase (servidor)
│       ├── scoring.ts            # Pesos de componentes + semáforo
│       ├── informe.ts            # Arma el informe PDF
│       ├── analisis.ts           # Resumen compacto para la IA + llamada al worker
│       ├── prestadores.ts        # Lista base de EPS/IPS
│       └── supabase/             # Clientes de Supabase (client, server, config)
├── scripts/                      # Herramientas Node (ingesta, auditoría, migración…)
├── supabase/migrations/          # SQL para crear las tablas
├── cloudflare-worker/            # Código del worker de IA
└── public/                       # Estáticos (logo, PDF del manual, instrumentos)
```

---

## 5. Cómo funciona (flujo general)

```
   Excel del prestador
          │
          ▼
   PARSER (rias-core.mjs)  ──► extrae { registros, porcentaje }  y anonimiza pacientes
          │
          ├─(carga web)──► batch-upload.tsx (parsea en el navegador) ─► POST /api/cargas
          │                                                                 │
          └─(scripts)────► ingest-reales.mjs (parsea en Node) ─────────► POST /api/cargas
                                                                            │
                                                                            ▼
                                                        SUPABASE (cargas, registros,
                                                        resultados_componente)
                                                                            │
                          Páginas (Server Components) leen con data.ts ◄────┘
                                                                            │
                                                                            ▼
                                     Dashboard / Prestadores / EPS / Informe PDF
```

Punto clave: **las páginas leen Supabase desde el servidor** (Server Components), no desde el
navegador. Por eso en las herramientas de red del navegador NO se ven peticiones a Supabase:
Vercel arma el HTML ya con los datos. Las **escrituras** (subir Excel, editar plan de mejora)
sí pasan por las rutas `/api/*`.

---

## 6. Supabase — cómo está integrado y funcionando

### 6.1 Proyecto
- Proyecto: **"RIAS Project"**, ref `gpjtcdirqcrlxqrduzqq`.
- URL: `https://gpjtcdirqcrlxqrduzqq.supabase.co`
- La app se conecta con la **clave pública (publishable/anon)**.

### 6.2 Dónde se configura la conexión
`src/lib/supabase/config.ts` centraliza URL + clave. Las toma de variables de entorno
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) y, si no están, cae a un valor
por defecto (fallback) para que el build funcione. Hay dos clientes:

- `src/lib/supabase/client.ts` → cliente de **navegador** (lo usa la carga masiva).
- `src/lib/supabase/server.ts` → cliente de **servidor** (lo usan las páginas y las APIs).
  Usa `SUPABASE_SERVICE_ROLE_KEY` si está definida; si no, la clave pública.

### 6.3 Tablas (esquema)
Creadas por `supabase/migrations/0001_init.sql`:

| Tabla | Para qué |
|---|---|
| `eps` | Prestadores (id de texto, ej. `famisanar`). |
| `ips` | IPS primaria de cada EPS. |
| `periodos` | Periodo de carga (año/trimestre). |
| `cargas` | Un registro por archivo Excel subido. Incluye la columna `analisis` (jsonb) con el análisis de IA. |
| `resultados_componente` | El % de cada componente por EPS (alimenta el semáforo/índice). |
| `registros` | Las filas normalizadas de cada Excel (`datos` en jsonb). Es la tabla grande (~4.400 filas). |
| `evidencias` | Fotos/soportes (opcional). |
| `plan_mejora_seguimiento` | Seguimiento editable del Plan de Mejora (migración `0003`). |

**RLS (Row Level Security):** hoy en modo **acceso total** (lectura y escritura con la clave
pública). La migración `0002_seguridad.sql` está lista para cerrar la escritura (dejar
lectura pública y que solo el servidor escriba con `service_role`), pero **aún no se ha
ejecutado**. Ver sección 12.

### 6.4 Migraciones
Carpeta `supabase/migrations/`. Se ejecutan en el **SQL Editor** de Supabase, en orden:
- `0001_init.sql` — crea todas las tablas + siembra las EPS/IPS + RLS acceso total.
- `0003_plan_mejora_seguimiento.sql` — tabla del seguimiento editable del plan de mejora.
- `0002_seguridad.sql` — (opcional, para producción) cierra la escritura al público.

> Nota: al proyecto se le agregó a mano la columna `cargas.analisis jsonb` (no venía en
> `0001`). Si se recrea desde cero, agregarla: `alter table cargas add column if not exists analisis jsonb;`

### 6.5 Cómo se lee y se escribe
- **Lectura:** `src/lib/data.ts` (funciones `getResultados`, `getRegistros`, `getAnalisis`…).
  Las llaman las páginas (Server Components). El índice se pondera **solo** sobre los
  componentes que tienen dato.
- **Escritura:** `src/app/api/cargas/route.ts` (guarda carga + registros + resultado) y
  `src/app/api/plan-mejora/route.ts` (seguimiento). La carga grande se parte en lotes de 400
  filas para no exceder el límite de tamaño de Vercel.

---

## 7. El parser (`src/lib/excel/rias-core.mjs`)

Es el corazón del sistema y es **puro** (sin dependencias de Node), por eso funciona igual en
el navegador y en los scripts, garantizando el mismo resultado.

- `parseFile(tipo, wb, opts)` decide qué parser usar según el tipo de documento.
- Un parser por componente: `parseHistorias` (adherencia), `parseAnexos`, `parseMedLab`
  (medicamentos/laboratorios), `parseCapacidad`, `parseOportunidad`, `parseAlertas`,
  `parseBiomedica`, `parseCanalizacion`, `parsePlanMejora`, y `parseGenerico` (indicadores).
- Cada uno devuelve `{ registros, pct }`: las filas normalizadas y el porcentaje del componente.
- **Confidencialidad:** `iniciales()` y `enmascararDoc()` anonimizan aquí mismo, antes de
  guardar. La base de datos nunca ve el nombre ni el documento completos.

`scripts/parser.mjs` reexporta este núcleo y le añade utilidades para Node (leer archivos,
mapa de rutas de los Excel). `src/lib/excel/specs.ts` deriva los tipos de documento desde
`scoring.ts`, así que agregar/quitar un componente actualiza sola la pantalla de carga.

---

## 8. Índice y semáforo (`src/lib/scoring.ts`)

- **10 componentes** con su peso (suman 100%): adherencia 20, indicadores 20, anexos 12,
  capacidad 12, biomédica 8, alertas 8, canalización 8, oportunidad 6, medicamentos 3,
  laboratorios 3.
- El **índice integral** = promedio ponderado de los componentes que tengan dato.
- **Semáforo** (`clasificar`): 🟢 Satisfactorio ≥85 · 🟡 Aceptable 70–84 · 🟠 Crítico 50–69 · 🔴 Muy crítico <50.
- El **Plan de Mejora** ya NO es un componente con %: es un módulo aparte con indicador
  Efectivo / No efectivo / En seguimiento.

---

## 9. Análisis con IA (`src/lib/analisis.ts` + `cloudflare-worker/`)

- Worker: `https://rias.davidsambr716.workers.dev/` (modelo Llama 3.3 70B en Cloudflare Workers AI).
- En vez de mandarle el Excel crudo, `resumenCompacto()` arma un resumen con las cifras exactas
  ya extraídas por el parser; el worker devuelve `{ resumen, nivel, hallazgos, alertas }`.
- Se usa en dos lugares: al subir un archivo (se guarda en `cargas.analisis`) y en el informe
  (llamada en vivo, con tope de tiempo y respaldo si el worker no responde).

---

## 10. Páginas y APIs

**Páginas** (todas leen datos en el servidor):
- `/` inicio · `/dashboard` resumen del municipio · `/prestadores` directorio de EPS.
- `/dashboard/eps/[epsId]` página de una EPS (índice, componentes, detalle, plan de mejora).
- `/dashboard/eps/[epsId]/informe` informe consolidado; el botón "Descargar PDF" usa
  `window.print()` con estilos de impresión (PDF nativo del navegador).
- `/cargar` carga masiva · `/eps/nueva` crear EPS · `/manual` manual de usuario.

**APIs:**
- `GET/POST /api/cargas` — lista/guarda cargas (con soporte de lotes).
- `GET/POST /api/eps` — lista/crea EPS.
- `GET/POST /api/plan-mejora` — lee/guarda el seguimiento del plan de mejora.

---

## 11. Variables de entorno

Archivo `.env.local` (no se sube al repo). En Vercel se ponen en *Settings → Environment Variables*.

| Variable | Para qué | ¿Obligatoria? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Recomendada (hay fallback en `config.ts`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública de Supabase | Recomendada (hay fallback) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta del servidor (para cerrar RLS) | Solo al endurecer seguridad |
| `NEXT_PUBLIC_ANALYZER_URL` | URL del worker de IA | Opcional (tiene valor por defecto) |

Ejemplo de `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://gpjtcdirqcrlxqrduzqq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxx
```

---

## 12. Despliegue

- Se despliega en **Vercel**. Cada push a `main` puede desplegar, o manualmente:
  ```bash
  npx vercel deploy --prod --yes
  ```
- El alias de producción (`plataforma-zeta-nine.vercel.app`) tarda ~10 s en propagar.
- Como `config.ts` trae las claves públicas por defecto, el build funciona aunque no se
  configuren variables en Vercel (para producción real, sí conviene definirlas).

---

## 13. Scripts (`scripts/`)

Herramientas de Node para cargar y verificar datos (se corren local; leen los Excel de la
carpeta de datos del municipio):
- `ingest-reales.mjs` — parsea los Excel reales y los sube (`POST /api/cargas`). Filtra por EPS o tipo.
- `generar-analisis.mjs` — genera el análisis de IA de las cargas.
- `auditoria.mjs` / `analizar-carpetas.mjs` — verifican que lo mostrado en la web coincide con el Excel.
- `migrar-supabase.mjs` — copia todos los datos de un proyecto de Supabase a otro (se usó para
  la migración de cuenta). Uso: `DST_URL=... DST_KEY=... node scripts/migrar-supabase.mjs`.
- `check-etapas.mjs` — control de calidad del curso de vida en historias.

---

## 14. Estado actual y pendientes

- ✅ Funcionando en producción con datos reales de 8 EPS (9 registradas).
- ✅ Base de datos migrada al proyecto nuevo (`RIAS Project`).
- ⏳ **Seguridad:** el sitio no tiene login (es de consulta pública) y la escritura en la base
  está **abierta** con la clave pública. Recomendado para producción: ejecutar
  `0002_seguridad.sql` + definir `SUPABASE_SERVICE_ROLE_KEY` en Vercel, para que solo el
  servidor pueda escribir.
- ⏳ Manual de usuario con capturas de pantalla (ver abajo).

---

## 15. Capturas de pantalla

El sitio está en vivo, así que la mejor referencia visual es abrirlo:
**https://plataforma-zeta-nine.vercel.app**

Pantallas principales a documentar:
1. **Inicio** (`/`) — presentación.
2. **Dashboard** (`/dashboard`) — índice del municipio y gráficas.
3. **Prestadores** (`/prestadores`) — tarjetas de EPS con su semáforo.
4. **Página de una EPS** (`/dashboard/eps/famisanar`) — componentes y detalle.
5. **Informe PDF** (`/dashboard/eps/famisanar/informe`) — botón "Descargar PDF".
6. **Cargar** (`/cargar`) — subida de Excel.

Para incluir las imágenes en este manual: guarda los PNG en `docs/img/` y enlázalos, por
ejemplo: `![Prestadores](docs/img/prestadores.png)`.
