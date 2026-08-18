import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
const f = "C:/Users/david/OneDrive/Escritorio/RIAS/FAMISANAR - CAFAM/Consolidado_RIAS_Historias_Clinicas.xlsx";
const wb = XLSX.read(readFileSync(f), { type: "buffer", cellDates: true });
const c = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
for (const sn of ["02_CPN_1003824700", "06_PINF_PRIMERA INFANCIA 1", "08_ADO_ HC 1"]) {
  if (!wb.Sheets[sn]) { console.log("NO existe", sn); continue; }
  const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, blankrows: false, defval: "", raw: false });
  console.log(`\n===== ${sn} (${aoa.length} filas) =====`);
  for (let r = 0; r < Math.min(16, aoa.length); r++) {
    const row = (aoa[r] || []).slice(0, 7).map((x, i) => { const v = c(x); return v ? `[${String.fromCharCode(65 + i)}]${v.slice(0, 32)}` : ""; }).filter(Boolean);
    if (row.length) console.log(`R${r + 1}: ` + row.join(" | "));
  }
}
