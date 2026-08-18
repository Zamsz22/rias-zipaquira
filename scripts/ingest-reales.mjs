// Ingesta exhaustiva de las 5 EPS. Usa el parser compartido (scripts/parser.mjs).
// CALIFICACIÓN: cada aspecto tiene un peso; la calificación = % del peso evaluado que CUMPLE
// (normalizada por la suma real de pesos de la hoja). NO se inventan datos.
// Uso: node scripts/ingest-reales.mjs
import { ARCHIVOS, parseFile, leerWb } from "./parser.mjs";

const API = "http://localhost:3000/api/cargas";

async function post(body) {
  for (let i = 1; i <= 3; i++) {
    try {
      const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body });
      return await res.json();
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return { ok: false, error: "fetch falló" };
}

async function main() {
  // Filtro opcional por tipo o por EPS: `node ingest-reales.mjs capacidad` o `... cosalud`
  // (re-ingesta solo lo que coincide, preserva las cargas/análisis de los demás).
  const filtro = process.argv.slice(2);
  const lista = filtro.length ? ARCHIVOS.filter(([e, t]) => filtro.includes(e) || filtro.includes(t)) : ARCHIVOS;
  for (const [eps, tipo, ruta] of lista) {
    const rutas = Array.isArray(ruta) ? ruta : [ruta];
    const nombre = rutas.map((r) => r.split("/").pop()).join(" + ");
    let wb;
    try {
      wb = leerWb(ruta);
    } catch (e) {
      console.log(`✗ ${eps}/${tipo}: no se pudo leer (${e.message})`);
      continue;
    }
    const { registros, pct } = parseFile(tipo, wb, { eps });
    console.log(`• ${eps}/${tipo}: hojas=${wb.SheetNames.length} registros=${registros.length} %=${pct ?? "—"}`);
    const d = await post(
      JSON.stringify({
        epsId: eps, tipo, modoUsado: "ingesta", archivo: nombre,
        // plan_mejora es un MÓDULO (indicador Efectivo/No efectivo), no un componente con %.
        totalFilas: registros.length, porcentaje: pct, componente: tipo === "plan_mejora" ? null : tipo,
        registros: registros.slice(0, 2000), reemplazar: true,
      }),
    );
    console.log(`  -> ${d.ok ? `guardado (${d.registrosInsertados} filas)` : d.error}`);
    await new Promise((r) => setTimeout(r, 350));
  }
  console.log("\nListo.");
}

main();
