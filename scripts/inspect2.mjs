import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
const BASE = "C:/Users/david/OneDrive/Escritorio/RIAS";
const aoa = (s) => XLSX.utils.sheet_to_json(s, { header: 1, blankrows: false, defval: "", raw: false });
const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

function dump(file, sheetIdx, rows = 60, cols = 8) {
  const wb = XLSX.read(readFileSync(file), { type: "buffer", cellDates: true });
  console.log("\n==== " + file.split("/").pop() + " | hojas: " + wb.SheetNames.length);
  console.log("HOJAS:", wb.SheetNames.slice(0, 12).join(" | "));
  const sn = wb.SheetNames[sheetIdx];
  const a = aoa(wb.Sheets[sn]);
  console.log("--- HOJA[" + sheetIdx + "]: " + sn + " (filas " + a.length + ") ---");
  for (let r = 0; r < Math.min(rows, a.length); r++) {
    const line = (a[r] || []).slice(0, cols).map((c, i) => { const v = clean(c); return v ? `[${String.fromCharCode(65 + i)}]${v.slice(0, 40)}` : ""; }).filter(Boolean);
    if (line.length) console.log(`R${r + 1}: ` + line.join(" | "));
  }
}

// Medicamentos (Famisanar)
dump(`${BASE}/FAMISANAR - CAFAM/Consolidado_RIAS_medicamentos_laboratorios_ordenado.xlsx`, 0, 22, 8);
// Historia clínica: buscar CALIFICACION TOTAL y categoria col A
dump(`${BASE}/FAMISANAR - CAFAM/Consolidado_RIAS_Historias_Clinicas.xlsx`, 0, 60, 7);
