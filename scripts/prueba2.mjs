// Prueba 2: enviar el Excel CRUDO (CSV de una hoja) directo a la IA, para comparar
// con el sistema corregido (parser determinista = 75.4% ponderado para este paciente).
import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
const f = "C:/Users/david/OneDrive/Escritorio/RIAS/FAMISANAR - CAFAM/Consolidado_RIAS_Historias_Clinicas.xlsx";
const wb = XLSX.read(readFileSync(f), { type: "buffer", cellDates: true });
const csv = XLSX.utils.sheet_to_csv(wb.Sheets["01_PRE_1075670635"]);
console.log("CSV crudo:", csv.length, "caracteres (sin optimizar tokens)");
const r = await fetch("https://rias.davidsambr716.workers.dev/", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ tipo: "adherencia_hc", eps: "Famisanar", muestra: csv }),
});
const d = await r.json();
console.log("IA (excel crudo) -> promedio:", d.analisis?.promedio, "| nivel:", d.analisis?.nivel);
console.log("resumen:", String(d.analisis?.resumen || d.error).slice(0, 200));
