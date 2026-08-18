// Copia todos los datos de un proyecto de Supabase a otro (tabla por tabla, sin perder ids).
// Uso:
//   DST_URL="https://NUEVO.supabase.co" DST_KEY="clave_del_nuevo" node scripts/migrar-supabase.mjs
// El proyecto de origen (el actual) ya viene puesto por defecto abajo.
// No copia la lista de usuarios: el proyecto nuevo conserva su propio administrador.
import { createClient } from "@supabase/supabase-js";

const SRC_URL = process.env.SRC_URL || "https://oxbbtuvobwxjcwdefury.supabase.co";
const SRC_KEY = process.env.SRC_KEY || "sb_publishable_gOboudz7VTT0ayOtgu44mQ_TBqM1s4W";
const DST_URL = process.env.DST_URL;
const DST_KEY = process.env.DST_KEY;

if (!DST_URL || !DST_KEY) {
  console.error("Falta el proyecto destino. Ejecuta con:  DST_URL=... DST_KEY=... node scripts/migrar-supabase.mjs");
  process.exit(1);
}

const src = createClient(SRC_URL, SRC_KEY, { auth: { persistSession: false } });
const dst = createClient(DST_URL, DST_KEY, { auth: { persistSession: false } });

// De PADRE a HIJO (para insertar sin romper relaciones). Se borra al revés.
const TABLAS = [
  ["eps", "id"],
  ["ips", "id"],
  ["periodos", "id"],
  ["cargas", "id"],
  ["resultados_componente", "id"],
  ["registros", "id"],
  ["evidencias", "id"],
  ["plan_mejora_seguimiento", "id"],
];

async function leerTodo(tabla) {
  const filas = [];
  const paso = 1000;
  for (let desde = 0; ; desde += paso) {
    const { data, error } = await src.from(tabla).select("*").range(desde, desde + paso - 1);
    if (error) return { error };
    filas.push(...data);
    if (data.length < paso) break;
  }
  return { filas };
}

async function main() {
  // 1) Leer todo el origen (para saber qué tablas existen y con cuántas filas).
  const datos = {};
  for (const [t] of TABLAS) {
    const { filas, error } = await leerTodo(t);
    datos[t] = error ? null : filas;
  }

  // 2) Vaciar el destino de las tablas que SÍ vamos a copiar (hijos primero).
  for (let i = TABLAS.length - 1; i >= 0; i--) {
    const [t, pk] = TABLAS[i];
    if (datos[t] === null) continue;
    const { error } = await dst.from(t).delete().not(pk, "is", null);
    if (error && !/does not exist|schema cache/.test(error.message)) console.warn(`  aviso al vaciar ${t}: ${error.message}`);
  }

  // 3) Copiar (padres primero).
  for (const [t] of TABLAS) {
    if (datos[t] === null) { console.log(`- ${t}: no existe en el origen, se omite.`); continue; }
    const filas = datos[t];
    if (!filas.length) { console.log(`- ${t}: 0 filas.`); continue; }
    let ok = 0;
    for (let i = 0; i < filas.length; i += 500) {
      const lote = filas.slice(i, i + 500);
      const { error } = await dst.from(t).insert(lote);
      if (error) { console.error(`  ERROR en ${t}: ${error.message}`); break; }
      ok += lote.length;
    }
    console.log(`- ${t}: ${ok}/${filas.length} copiadas.`);
  }
  console.log("Listo.");
}

main().catch((e) => { console.error(e); process.exit(1); });
