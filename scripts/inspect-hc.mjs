import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
const f = "C:/Users/david/OneDrive/Escritorio/RIAS/FAMISANAR - CAFAM/Consolidado_RIAS_Historias_Clinicas.xlsx";
const wb = XLSX.read(readFileSync(f), { type: "buffer", cellDates: true });
const sn = wb.SheetNames[0];
const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, blankrows: false, defval: "", raw: false });
const c = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
console.log("HOJA:", sn, "filas:", aoa.length);
for (let r = 0; r < aoa.length; r++) {
  const row = (aoa[r] || []).slice(0, 7).map((x, i) => { const v = c(x); return v ? `[${String.fromCharCode(65 + i)}]${v.slice(0, 40)}` : ""; }).filter(Boolean);
  if (row.length) console.log(`R${r + 1}: ` + row.join(" | "));
}
