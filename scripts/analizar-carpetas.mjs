// Análisis independiente de CADA Excel: escribe en cada carpeta de EPS un
// `_ANALISIS_RIAS.json` (qué contiene cada archivo, hojas, columnas, filas, métrica)
// + un resumen, y compara contra lo que está subido a la web (Supabase).
// Genera además AUDITORIA_RIAS.csv y AUDITORIA_RIAS.json en la raíz de RIAS.
// Uso: node scripts/analizar-carpetas.mjs
import { writeFileSync } from "node:fs";
import { dirname, basename } from "node:path";
import { ARCHIVOS, ARCHIVOS_BASE, parseFile, aoa, clean, round, leerWb } from "./parser.mjs";

const SUPA = "https://oxbbtuvobwxjcwdefury.supabase.co/rest/v1";
const KEY = "sb_publishable_gOboudz7VTT0ayOtgu44mQ_TBqM1s4W";
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const DESC = {
  adherencia_hc: "Historias clínicas evaluadas por adherencia (1 hoja por paciente; aspectos CUMPLE/NO CUMPLE/NO APLICA ponderados por su peso).",
  indicadores: "Indicadores trazadores SIGERES (numerador, denominador y % de cumplimiento por curso de vida).",
  anexos: "Anexos / listas de chequeo RIAS (aspecto evaluado, % a calificar y % de cumplimiento).",
  biomedica: "Dotación y equipos biomédicos (servicio, criterio, % de cumplimiento, semáforo).",
  plan_mejora: "MÓDULO Plan de Mejora: hallazgos clasificados en Efectivo / No efectivo / En seguimiento (sin %).",
  canalizacion: "Canalización efectiva por riesgo (canalizados vs. efectivos). Archivo ÚNICO con todas las EPS.",
  medicamentos: "Medicamentos y laboratorios ordenados, con su estado de entrega por paciente.",
  capacidad: "Capacidad instalada (servicio, profesionales que reporta la IPS vs. los que requiere la herramienta).",
  oportunidad: "Oportunidad de consultas (días de espera por especialidad y mes, o 'No agenda disponible').",
  alertas: "Tablero de alertas tempranas gestionadas desde RIAS (alerta, ruta, riesgo, acción y resultado).",
};
const METRICA = {
  adherencia_hc: "Calificación promedio de adherencia (%)",
  indicadores: "Cumplimiento promedio de indicadores (%)",
  anexos: "Cumplimiento promedio de anexos (%)",
  biomedica: "Cumplimiento promedio de dotación biomédica (%)",
  plan_mejora: "Indicador Efectivo / No efectivo (módulo, sin porcentaje)",
  canalizacion: "Canalizaciones efectivas sobre canalizadas (%)",
  medicamentos: "Órdenes de medicamento con entrega confirmada (%)",
  capacidad: "Servicios con dotación suficiente (%)",
  oportunidad: "Disponibilidad de agenda de citas (%)",
  alertas: "Alertas gestionadas con resultado documentado (%)",
};

// Detecta la fila de encabezado (la de más valores DISTINTOS entre las primeras 15, para
// evitar filas de título combinado repetido) y devuelve sus columnas sin duplicados.
function columnas(rows) {
  let best = -1, bestN = 0;
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const vals = rows[i].map(clean).filter((c) => c && !/^columna \d+$/i.test(c));
    const distinct = new Set(vals).size;
    if (distinct > bestN) { bestN = distinct; best = i; }
  }
  if (best < 0) return [];
  const seen = new Set();
  return rows[best].map(clean).filter((c) => c && !/^columna \d+$/i.test(c) && !seen.has(c) && seen.add(c)).slice(0, 20);
}
const filasDatos = (wb) => wb.SheetNames.reduce((a, sn) => {
  const r = aoa(wb.Sheets[sn]);
  return a + r.filter((row) => row.filter((c) => clean(c) !== "").length >= 2).length;
}, 0);

// Detalle hoja por hoja: nombre, filas con datos, columnas detectadas y una muestra real.
// Devuelve solo las hojas CON datos + el conteo de hojas-plantilla vacías.
function detalleHojas(wb) {
  const detalle = [];
  let vacias = 0;
  for (const sn of wb.SheetNames) {
    const rows = aoa(wb.Sheets[sn]);
    const datos = rows.filter((r) => r.filter((c) => clean(c) !== "").length >= 2);
    if (datos.length === 0) { vacias++; continue; }
    const cols = columnas(rows);
    let muestra = "";
    for (const r of datos) {
      const vals = r.map(clean).filter(Boolean);
      if (vals.length >= 2 && !cols.every((c, i) => clean(r[i]) === c)) { muestra = vals.join(" | ").slice(0, 160); break; }
    }
    detalle.push({ hoja: sn, filas_con_datos: datos.length, n_columnas: cols.length, columnas: cols, muestra });
  }
  return { detalle, vacias };
}
// Columnas de la primera hoja que tenga datos (para el resumen del archivo).
function columnasPrincipales(wb) {
  for (const sn of wb.SheetNames) {
    const rows = aoa(wb.Sheets[sn]);
    if (rows.some((r) => r.filter((c) => clean(c) !== "").length >= 2)) return columnas(rows);
  }
  return [];
}

const stored = await (await fetch(`${SUPA}/resultados_componente?select=eps_id,componente,valor_pct`, { headers: H })).json();
const storedPct = {};
for (const s of stored) storedPct[`${s.eps_id}/${s.componente}`] = Number(s.valor_pct);
const ipsData = await (await fetch(`${SUPA}/ips?select=eps_id,nombre`, { headers: H })).json();
const ips = {}; for (const i of ipsData) ips[i.eps_id] = i.nombre;

// Agrupa archivos por EPS (cada uno conoce su carpeta por el path)
const porEps = {};
for (const [eps, tipo, ruta] of ARCHIVOS) (porEps[eps] ??= []).push({ tipo, ruta });

const csv = [["eps", "ips", "componente", "archivo", "metrica_pct_independiente", "en_web_pct", "coincide"]];
const global = [];

const prim = (r) => (Array.isArray(r) ? r[0] : r);
for (const [eps, files] of Object.entries(porEps)) {
  const carpeta = dirname(prim(files[0].ruta));
  const archivos = [];
  for (const { tipo, ruta } of files) {
    const nombre = (Array.isArray(ruta) ? ruta : [ruta]).map((r) => basename(r)).join(" + ");
    let wb;
    try { wb = leerWb(ruta); }
    catch (e) { archivos.push({ archivo: nombre, componente: tipo, error: e.message }); continue; }
    const res = parseFile(tipo, wb, { eps });
    const web = storedPct[`${eps}/${tipo}`] ?? null;
    const mine = res.pct;
    const coincide = mine == null && web == null ? true : (mine != null && web != null && Math.abs(mine - web) < 0.15);
    const { detalle, vacias } = detalleHojas(wb);
    const item = {
      archivo: nombre,
      componente: tipo,
      que_contiene: DESC[tipo] ?? "—",
      hojas: wb.SheetNames.length,
      hojas_con_datos: detalle.length,
      hojas_vacias: vacias,
      columnas_detectadas: columnasPrincipales(wb),
      filas_con_datos: filasDatos(wb),
      registros_analizados: res.registros.length,
      metrica: { nombre: METRICA[tipo], valor_pct: mine },
      en_web_pct: web,
      coincide,
      hojas_detalle: detalle,
    };
    archivos.push(item);
    csv.push([eps, ips[eps] ?? "", tipo, nombre, mine ?? "", web ?? "", coincide ? "SI" : "NO"]);
    global.push({ eps, componente: tipo, independiente: mine, web, coincide });
  }
  const conDato = archivos.filter((a) => a.metrica && a.metrica.valor_pct != null).length;
  const folder = {
    eps,
    ips: ips[eps] ?? "—",
    carpeta: basename(carpeta),
    generado: new Date().toISOString(),
    total_archivos: archivos.length,
    componentes_con_valor: conDato,
    coinciden_con_web: archivos.filter((a) => a.coincide).length + "/" + archivos.length,
    resumen: `${archivos.length} Excel analizados para ${eps} (IPS ${ips[eps] ?? "—"}). ${conDato} con métrica calculada. ` +
      archivos.filter((a) => a.metrica?.valor_pct != null).map((a) => `${a.componente}=${a.metrica.valor_pct}%`).join(", ") + ".",
    archivos,
  };
  writeFileSync(`${carpeta}/_ANALISIS_RIAS.json`, JSON.stringify(folder, null, 2), "utf8");
  console.log(`✓ ${eps}: ${archivos.length} archivos → ${carpeta}/_ANALISIS_RIAS.json  (coinciden ${folder.coinciden_con_web})`);
}

// Comparación global web ↔ análisis independiente
writeFileSync(`${ARCHIVOS_BASE}/AUDITORIA_RIAS.csv`, csv.map((r) => r.join(",")).join("\n"), "utf8");
writeFileSync(`${ARCHIVOS_BASE}/AUDITORIA_RIAS.json`, JSON.stringify(global, null, 2), "utf8");
const ok = global.filter((g) => g.coincide).length;
console.log(`\nComparación web ↔ independiente: ${ok}/${global.length} coinciden.`);
const difs = global.filter((g) => !g.coincide);
if (difs.length) for (const d of difs) console.log(`  ✗ ${d.eps}/${d.componente}: independiente=${d.independiente} web=${d.web}`);
else console.log("✓ Todo lo que muestra la web coincide con el análisis independiente de los Excel.");
console.log(`\nArchivos: ${ARCHIVOS_BASE}/AUDITORIA_RIAS.csv + .json y un _ANALISIS_RIAS.json por carpeta.`);
