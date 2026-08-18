import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
const f = "C:/Users/david/OneDrive/Escritorio/RIAS/FAMISANAR - CAFAM/Consolidado_RIAS_Historias_Clinicas.xlsx";
const wb = XLSX.read(readFileSync(f), { type: "buffer", cellDates: true });
const aoa = (s) => XLSX.utils.sheet_to_json(s, { header: 1, blankrows: false, defval: "", raw: false });
const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();
for (const pref of ["10_ADUL", "11_VEJ"]) {
  const sn = wb.SheetNames.find((s) => s.startsWith(pref));
  console.log("\n==== HOJA:", sn, "====");
  const a = aoa(wb.Sheets[sn]);
  for (let r = 0; r < Math.min(20, a.length); r++) {
    const line = (a[r] || []).slice(0, 9).map((c, i) => { const v = clean(c); return v ? `[${String.fromCharCode(65 + i)}]${v.slice(0, 34)}` : ""; }).filter(Boolean);
    if (line.length) console.log(`R${r + 1}: ` + line.join(" | "));
  }
}
