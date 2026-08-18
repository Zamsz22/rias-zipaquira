import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
const f = "C:/Users/david/OneDrive/Escritorio/RIAS/FAMISANAR - CAFAM/PLAN DE MEJORA CAS CAFAM-FINAL.xlsx";
const wb = XLSX.read(readFileSync(f), { type: "buffer", cellDates: true });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, blankrows: false, defval: "", raw: false });
const clean = (v) => (v == null ? "" : String(v).replace(/\s+/g, " ").trim());
// fila de encabezado
let hr = 0;
for (let i = 0; i < 10; i++) if (rows[i].some((c) => clean(c).toUpperCase().includes("DESCRIPCIÓN DEL HALLAZGO") || clean(c).toUpperCase().includes("DESCRIPCION DEL HALLAZGO"))) { hr = i; break; }
const H = rows[hr].map(clean);
console.log("HEADER fila", hr + 1);
H.forEach((h, i) => { if (h) console.log("  col", i, "=", h); });
// contar valores no vacíos por columna que parezca de cumplimiento/cierre/estado
const data = rows.slice(hr + 1).filter((r) => r.some((c) => clean(c)));
console.log("\nFilas de datos:", data.length);
H.forEach((h, i) => {
  if (!/cumpli|cierre|estado|seguimiento/i.test(h)) return;
  const llenos = data.filter((r) => clean(r[i])).length;
  const muestra = data.map((r) => clean(r[i])).filter(Boolean).slice(0, 4);
  console.log(`  [${h}] -> llenos ${llenos}/${data.length} | ej:`, muestra.join(" / "));
});
