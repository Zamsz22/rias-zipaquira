import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";

const BASE = "C:/Users/david/OneDrive/Escritorio/RIAS";

function dump(file, sheetNames, rows = 18, cols = 9) {
  const wb = XLSX.read(readFileSync(file), { type: "buffer", cellDates: true });
  console.log("\n==================================================");
  console.log("FILE:", file.split("/").pop());
  console.log("HOJAS (" + wb.SheetNames.length + "):", wb.SheetNames.join(" | "));
  const targets = sheetNames === "*" ? wb.SheetNames.slice(0, 3) : sheetNames;
  for (const sn of targets) {
    if (!wb.Sheets[sn]) continue;
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, blankrows: false, defval: "", raw: false });
    console.log(`\n--- HOJA: ${sn}  (filas con datos: ${aoa.length}) ---`);
    for (let r = 0; r < Math.min(rows, aoa.length); r++) {
      const row = (aoa[r] || []).slice(0, cols).map((c, i) => {
        const v = String(c).replace(/\s+/g, " ").trim();
        return v ? `[${String.fromCharCode(65 + i)}]${v.slice(0, 34)}` : "";
      }).filter(Boolean);
      if (row.length) console.log(`  R${r + 1}: ` + row.join(" | "));
    }
  }
}

dump(`${BASE}/FAMISANAR - CAFAM/consolidado_RIAS_indicadores-trazadores.xlsx`, "*", 16, 9);
dump(`${BASE}/FAMISANAR - CAFAM/ANEXOS-RIAS 2026.xlsx`, ["SALUD ORAL"], 16, 8);
dump(`${BASE}/FAMISANAR - CAFAM/Consolidado_RIAS_Historias_Clinicas.xlsx`, "*", 20, 7);
