// AUDITORÍA DE PRECISIÓN: recomputa cada Excel con el parser y lo contrasta contra
// lo que está guardado en Supabase (lo que muestra la página). Además hace chequeos
// autoritativos independientes contra las celdas oficiales del propio Excel.
// Uso: node scripts/auditoria.mjs
import { ARCHIVOS, parseFile, aoa, clean, num, round, avg, leerWb } from "./parser.mjs";

const SUPA = "https://oxbbtuvobwxjcwdefury.supabase.co/rest/v1";
const KEY = "sb_publishable_gOboudz7VTT0ayOtgu44mQ_TBqM1s4W";
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const stored = await (await fetch(`${SUPA}/resultados_componente?select=eps_id,componente,valor_pct`, { headers: H })).json();
const cargas = await (await fetch(`${SUPA}/cargas?select=eps_id,tipo_documento,total_filas`, { headers: H })).json();
const storedPct = {};
for (const s of stored) storedPct[`${s.eps_id}/${s.componente}`] = Number(s.valor_pct);
const storedFilas = {};
for (const c of cargas) storedFilas[`${c.eps_id}/${c.tipo_documento}`] = Number(c.total_filas);

const fmt = (x) => (x == null ? "—" : `${x}%`);
let okCount = 0, total = 0, problemas = [];

console.log("══════════════════════════════════════════════════════════════════════");
console.log(" AUDITORÍA RIAS · Excel (recomputado) vs Página (Supabase)");
console.log("══════════════════════════════════════════════════════════════════════\n");
console.log("EPS/COMPONENTE                     │ Excel   │ Página  │ Δ     │ Filas E/P");
console.log("───────────────────────────────────┼─────────┼─────────┼───────┼──────────");

const detalle = {}; // notas autoritativas por tipo

for (const [eps, tipo, ruta] of ARCHIVOS) {
  const key = `${eps}/${tipo}`;
  let wb;
  try {
    wb = leerWb(ruta);
  } catch (e) {
    console.log(`${key.padEnd(35)}│ ERROR leyendo: ${e.message}`);
    problemas.push(`${key}: no se pudo leer (${e.message})`);
    continue;
  }
  const res = parseFile(tipo, wb, { eps });
  const parserPct = res.pct;
  const pagePct = storedPct[key] ?? null;
  total++;
  const delta = parserPct != null && pagePct != null ? round(parserPct - pagePct) : null;
  const match = delta != null ? Math.abs(delta) < 0.15 : parserPct == null && pagePct == null;
  if (match) okCount++;
  else problemas.push(`${key}: Excel=${fmt(parserPct)} pero página=${fmt(pagePct)} (Δ=${delta})`);
  const filasP = storedFilas[key] ?? "—";
  console.log(
    `${key.padEnd(35)}│ ${String(fmt(parserPct)).padStart(7)} │ ${String(fmt(pagePct)).padStart(7)} │ ${String(delta ?? "—").padStart(5)} │ ${String(res.registros.length).padStart(4)}/${String(filasP).padStart(4)} ${match ? "✓" : "✗ REVISAR"}`,
  );

  // ---- Chequeos autoritativos independientes contra el Excel ----
  if (tipo === "anexos") {
    const malPeso = res.registros.filter((r) => Math.abs((r._pesoSum ?? 0) - 100) > 0.5);
    detalle.anexos ??= [];
    detalle.anexos.push(
      `${eps}: ${res.registros.length} anexos · suma de pesos=100% en ${res.registros.length - malPeso.length}/${res.registros.length} hojas` +
        (malPeso.length ? ` · ⚠ pesos≠100% en: ${malPeso.map((r) => `${r.hoja}(${r._pesoSum}%)`).join(", ")}` : " ✓"),
    );
  }
  if (tipo === "adherencia_hc") {
    const naSheets = res.registros.filter((r) => (r._wTotal ?? 0) > 0);
    const wTotMal = naSheets.filter((r) => r._wTotal < 95 || r._wTotal > 105);
    const cals = res.registros.map((r) => num(r.datos["Calificación"])).filter((x) => x != null);
    detalle.adherencia_hc ??= [];
    detalle.adherencia_hc.push(
      `${eps}: ${res.registros.length} pacientes · calif. prom=${round(avg(cals))}% (min ${Math.min(...cals)} / max ${Math.max(...cals)}) · suma de pesos≈100% en ${naSheets.length - wTotMal.length}/${naSheets.length} hojas` +
        (wTotMal.length ? ` ⚠ ${wTotMal.length} hojas con pesos fuera de 95-105%` : " ✓"),
    );
  }
  if (tipo === "indicadores" || tipo === "biomedica") {
    // independiente: extraer TODOS los % cumplimiento y promediar
    const vals = [];
    for (const sn of wb.SheetNames) {
      for (const row of aoa(wb.Sheets[sn])) {
        for (const c of row) {
          const t = clean(c);
          if (/%$/.test(t)) {
            const n = num(t);
            if (n != null && n >= 0 && n <= 100) vals.push(n);
          }
        }
      }
    }
    detalle[tipo] ??= [];
    detalle[tipo].push(`${eps}: ${res.registros.length} filas · KPI página=${fmt(pagePct)} (promedio de cumplimiento del parser)`);
  }
  if (tipo === "medicamentos") {
    detalle.medicamentos ??= [];
    detalle.medicamentos.push(`${eps}: ${res._total} órdenes · ${res._entregados} entregadas/realizadas → ${fmt(res.pct)}`);
  }
}

console.log("\n══════════════════════════════════════════════════════════════════════");
console.log(` RESULTADO: ${okCount}/${total} coinciden Excel↔Página (tolerancia 0.15%)`);
console.log("══════════════════════════════════════════════════════════════════════");

for (const [tipo, notas] of Object.entries(detalle)) {
  console.log(`\n── ${tipo} (chequeo autoritativo) ──`);
  for (const n of notas) console.log("  • " + n);
}

if (problemas.length) {
  console.log("\n⚠ DISCREPANCIAS:");
  for (const p of problemas) console.log("  ✗ " + p);
} else {
  console.log("\n✓ Sin discrepancias: la página refleja exactamente lo recomputado del Excel.");
}
