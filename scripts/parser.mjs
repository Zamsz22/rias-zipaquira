// Driver Node del parser RIAS: re-exporta el núcleo compartido y añade leerWb + ARCHIVOS
// (que usan node:fs y rutas locales). El núcleo vive en src/lib/excel/rias-core.mjs.
import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
export * from "../src/lib/excel/rias-core.mjs";

// Lee uno o varios Excel y los une en un solo workbook.
export function leerWb(ruta) {
  const rutas = Array.isArray(ruta) ? ruta : [ruta];
  const merged = { SheetNames: [], Sheets: {} };
  for (const rt of rutas) {
    const wb = XLSX.read(readFileSync(rt), { type: "buffer", cellDates: true });
    for (const sn of wb.SheetNames) {
      let name = sn, k = 2;
      while (merged.Sheets[name]) name = `${sn} (${k++})`;
      merged.SheetNames.push(name);
      merged.Sheets[name] = wb.Sheets[sn];
    }
  }
  return merged;
}

export const ARCHIVOS_BASE = "C:/Users/david/OneDrive/Escritorio/RIAS";
export const ARCHIVOS = [
  ["famisanar", "biomedica", `${ARCHIVOS_BASE}/FAMISANAR - CAFAM/2. Matriz R.Dotacion E.B IPS CAS Cafam.xlsx`],
  ["famisanar", "anexos", `${ARCHIVOS_BASE}/FAMISANAR - CAFAM/ANEXOS-RIAS 2026.xlsx`],
  ["famisanar", "adherencia_hc", `${ARCHIVOS_BASE}/FAMISANAR - CAFAM/Consolidado_RIAS_Historias_Clinicas.xlsx`],
  ["famisanar", "indicadores", `${ARCHIVOS_BASE}/FAMISANAR - CAFAM/consolidado_RIAS_indicadores-trazadores.xlsx`],
  ["famisanar", "plan_mejora", `${ARCHIVOS_BASE}/FAMISANAR - CAFAM/PLAN DE MEJORA CAS CAFAM-FINAL.xlsx`],
  ["famisanar", "medicamentos", `${ARCHIVOS_BASE}/FAMISANAR - CAFAM/Consolidado_RIAS_medicamentos_laboratorios_ordenado.xlsx`],
  ["nueva-eps", "biomedica", `${ARCHIVOS_BASE}/NUEVA EPS - CLINICA CHIA/4. Matriz R.Dotacion E.B CLINICA CHIA SEDE 1 – NUEVA EPS.xlsx`],
  ["nueva-eps", "adherencia_hc", [
    `${ARCHIVOS_BASE}/NUEVA EPS - CLINICA CHIA/Consolidado_RIAS_Historias_Clinicas_Nuevo.xlsx`,
    `${ARCHIVOS_BASE}/NUEVA EPS - CLINICA CHIA/CONSOLIDADO ADHERNEICA LACTANCIA MATERNA.xlsx`,
  ]],
  ["nueva-eps", "indicadores", `${ARCHIVOS_BASE}/NUEVA EPS - CLINICA CHIA/consolidado_RIAS_NUEVA_EPS_Indicadores_Trazadores.xlsx`],
  ["nueva-eps", "plan_mejora", `${ARCHIVOS_BASE}/NUEVA EPS - CLINICA CHIA/PLAN DE MEJORA NUEVA EPS FINAL.xlsx`],
  ["nueva-eps", "medicamentos", `${ARCHIVOS_BASE}/NUEVA EPS - CLINICA CHIA/Consolidado_RIAS_medicamentos_laboratorios_nuevo.xlsx`],
  ["sura", "biomedica", `${ARCHIVOS_BASE}/EPS SURA- A&G SERVICIOS/7. Matriz R.Dotacion E.B A & G sura.xlsx`],
  ["sura", "adherencia_hc", `${ARCHIVOS_BASE}/EPS SURA- A&G SERVICIOS/Consolidado_RIAS_Historias_Clinicas_SURA.xlsx`],
  ["sura", "indicadores", `${ARCHIVOS_BASE}/EPS SURA- A&G SERVICIOS/consolidado_RIAS_SURA_Indicadores_Trazadores.xlsx`],
  ["sura", "plan_mejora", `${ARCHIVOS_BASE}/EPS SURA- A&G SERVICIOS/PLAN DE MEJORA SURA 2026.xlsx`],
  ["sura", "medicamentos", `${ARCHIVOS_BASE}/EPS SURA- A&G SERVICIOS/Consolidado_RIAS_SURA_medicamentos_laboratorios.xlsx`],
  ["compensar", "biomedica", `${ARCHIVOS_BASE}/COMPENSSAR - IPS VIVA 1A/8. Matriz R.Dotacion E.B Viva 1As.xlsx`],
  ["compensar", "adherencia_hc", `${ARCHIVOS_BASE}/COMPENSSAR - IPS VIVA 1A/Consolidado_RIAS_Historias_Clinicas_COMPENSAR.xlsx`],
  ["compensar", "indicadores", `${ARCHIVOS_BASE}/COMPENSSAR - IPS VIVA 1A/consolidado_RIAS_COMPENSAR_Indicadores.xlsx`],
  ["compensar", "plan_mejora", `${ARCHIVOS_BASE}/COMPENSSAR - IPS VIVA 1A/PLAN DE MEJORA COMPENSAR FINAL.xlsx`],
  ["compensar", "medicamentos", `${ARCHIVOS_BASE}/COMPENSSAR - IPS VIVA 1A/Consolidado_RIAS_COMPENSAR_medicamentos_laboratorios.xlsm`],
  ["magisterio", "biomedica", `${ARCHIVOS_BASE}/REGIMEN ESPECIAL MAGISTERIO - IPS SERVISALUD QCL/5. Matriz R.Dotacion E.B IPS SERVISALUD.xlsx`],
  ["magisterio", "adherencia_hc", `${ARCHIVOS_BASE}/REGIMEN ESPECIAL MAGISTERIO - IPS SERVISALUD QCL/Consolidado_RIAS_Historias_Clinicas_SERVISALUD.xlsx`],
  ["magisterio", "indicadores", `${ARCHIVOS_BASE}/REGIMEN ESPECIAL MAGISTERIO - IPS SERVISALUD QCL/consolidado_RIAS_SERVISALUD_Indicadores.xlsx`],
  ["magisterio", "plan_mejora", `${ARCHIVOS_BASE}/REGIMEN ESPECIAL MAGISTERIO - IPS SERVISALUD QCL/PLAN DE MEJORA SERVISALUD -FINAL.xlsx`],
  ["magisterio", "medicamentos", `${ARCHIVOS_BASE}/REGIMEN ESPECIAL MAGISTERIO - IPS SERVISALUD QCL/Consolidado_RIAS_SERVISALUD_medicamentos_laboratorios.xlsm`],
  // Capacidad instalada (servicio · profesionales que reporta/requiere)
  ["famisanar", "capacidad", `${ARCHIVOS_BASE}/FAMISANAR - CAFAM/EPS FAMISANAR-IPS CAS-CAFAM.xlsx`],
  ["nueva-eps", "capacidad", `${ARCHIVOS_BASE}/NUEVA EPS - CLINICA CHIA/NUEVAEPS-IPS CLINICA CHIA SEDE1.xlsx`],
  ["sura", "capacidad", `${ARCHIVOS_BASE}/EPS SURA- A&G SERVICIOS/EPS -SURA -IPS A&G.xlsx`],
  ["compensar", "capacidad", `${ARCHIVOS_BASE}/COMPENSSAR - IPS VIVA 1A/EPS COMPENSAR-IPS VIVA 1A.xlsx`],
  ["magisterio", "capacidad", `${ARCHIVOS_BASE}/REGIMEN ESPECIAL MAGISTERIO - IPS SERVISALUD QCL/MAGISTERIO-IPS SERVISALUD QCL.xlsx`],
  // Oportunidad de consultas (días de espera por especialidad y mes)
  ["famisanar", "oportunidad", `${ARCHIVOS_BASE}/FAMISANAR - CAFAM/FAMISANAR-IPS CAS-CAFAM.xlsx`],
  ["nueva-eps", "oportunidad", `${ARCHIVOS_BASE}/NUEVA EPS - CLINICA CHIA/NUEVAEPS-IPS CLINICA CHIA-1.xlsx`],
  ["sura", "oportunidad", `${ARCHIVOS_BASE}/EPS SURA- A&G SERVICIOS/EPS-SURA-IPS A&G.xlsx`],
  ["compensar", "oportunidad", `${ARCHIVOS_BASE}/COMPENSSAR - IPS VIVA 1A/COMPENSAR-IPS VIVA 1A.xlsx`],
  ["magisterio", "oportunidad", `${ARCHIVOS_BASE}/REGIMEN ESPECIAL MAGISTERIO - IPS SERVISALUD QCL/MAGISTERIO-IPS SERVISALUD QCL OPORTUNIDAD.xlsx`],
  // Alertas tempranas gestionadas desde RIAS
  ["famisanar", "alertas", `${ARCHIVOS_BASE}/FAMISANAR - CAFAM/CONSOLIDADO-RIAS-FAMISANAR-ALERTAS.xlsx`],
  ["nueva-eps", "alertas", `${ARCHIVOS_BASE}/NUEVA EPS - CLINICA CHIA/CONSOLIDADO-RIAS-NUEVA EPS-ALERTAS.xlsx`],
  ["sura", "alertas", `${ARCHIVOS_BASE}/EPS SURA- A&G SERVICIOS/CONSOLIDADO-RIAS-SURA-ALERTAS.xlsx`],
  ["compensar", "alertas", `${ARCHIVOS_BASE}/COMPENSSAR - IPS VIVA 1A/CONSOLIDADO-RIAS-COMPENSAR-ALERTAS.xlsx`],
  ["magisterio", "alertas", `${ARCHIVOS_BASE}/REGIMEN ESPECIAL MAGISTERIO - IPS SERVISALUD QCL/CONSOLIDADO-RIAS-MAGISTERIO-ALERTAS.xlsx`],
  // EPS Coosalud · IPS HUS Unidad Funcional de Zipaquirá (HUFS) — sin anexos
  ["cosalud", "biomedica", `${ARCHIVOS_BASE}/IPS HUFS - EPS COOSALUD/6. Matriz R.Dotacion E.B Unidad Funcional.xlsx`],
  ["cosalud", "adherencia_hc", `${ARCHIVOS_BASE}/IPS HUFS - EPS COOSALUD/Consolidado_RIAS_Historias_Clinicas_UFZ.xlsx`],
  ["cosalud", "indicadores", `${ARCHIVOS_BASE}/IPS HUFS - EPS COOSALUD/consolidado_RIAS_HUS_Indicadores.xlsx`],
  ["cosalud", "plan_mejora", `${ARCHIVOS_BASE}/IPS HUFS - EPS COOSALUD/FORMATO PLAN DE MEJORA IPS COOSALUD-RIAS FINAL.xlsx`],
  ["cosalud", "medicamentos", `${ARCHIVOS_BASE}/IPS HUFS - EPS COOSALUD/Consolidado_RIAS_Unidad_Funcional_medicamentos_laboratorios.xlsm`],
  ["cosalud", "capacidad", `${ARCHIVOS_BASE}/IPS HUFS - EPS COOSALUD/CONSOLIDADO CAPACIDAD INSTALADA-RIAS -HUFS.xlsx`],
  ["cosalud", "oportunidad", `${ARCHIVOS_BASE}/IPS HUFS - EPS COOSALUD/CONSOLIDADO-OPORTUNIDA-RIAS-IPS HUFS.xlsx`],
  ["cosalud", "alertas", `${ARCHIVOS_BASE}/IPS HUFS - EPS COOSALUD/CONSOLIDADO-RIAS-HUFS-ALERTAS.xlsx`],
  // EPS Sanitas · IPS Clínica Chía Sede 2 — sin biomédica, anexos ni alertas
  ["sanitas", "adherencia_hc", `${ARCHIVOS_BASE}/IPS CLINICA CHIA SEDE 2 -  EPS SANITAS/CONSOLIDADO-ADHERENCIA HISTORIA CLINICA.xlsx`],
  ["sanitas", "indicadores", `${ARCHIVOS_BASE}/IPS CLINICA CHIA SEDE 2 -  EPS SANITAS/Plantilla-tablero_control_indicadores_SANITAS.xlsx`],
  ["sanitas", "plan_mejora", `${ARCHIVOS_BASE}/IPS CLINICA CHIA SEDE 2 -  EPS SANITAS/FORMATO PLAN DE MEJORA FINAL.xlsx`],
  ["sanitas", "medicamentos", `${ARCHIVOS_BASE}/IPS CLINICA CHIA SEDE 2 -  EPS SANITAS/BASE MEDICAMENTOS Y LABORATORIO.xlsx`],
  ["sanitas", "laboratorios", `${ARCHIVOS_BASE}/IPS CLINICA CHIA SEDE 2 -  EPS SANITAS/BASE MEDICAMENTOS Y LABORATORIO.xlsx`],
  ["sanitas", "capacidad", `${ARCHIVOS_BASE}/IPS CLINICA CHIA SEDE 2 -  EPS SANITAS/CONSOLIDADO CAPACIDAD INSTALADA-RIAS -CLINICA CHIA SEDE 2-SANITAS.xlsx`],
  ["sanitas", "oportunidad", `${ARCHIVOS_BASE}/IPS CLINICA CHIA SEDE 2 -  EPS SANITAS/CONSOLIDADO-OPORTUNIDA-RIAS-IPS clinica chia sede 2.xlsx`],
  // Laboratorios RIAS vs GAUDI — mismo archivo que medicamentos, pero leyendo las columnas de laboratorios
  ["famisanar", "laboratorios", `${ARCHIVOS_BASE}/FAMISANAR - CAFAM/Consolidado_RIAS_medicamentos_laboratorios_ordenado.xlsx`],
  ["nueva-eps", "laboratorios", `${ARCHIVOS_BASE}/NUEVA EPS - CLINICA CHIA/Consolidado_RIAS_medicamentos_laboratorios_nuevo.xlsx`],
  ["sura", "laboratorios", `${ARCHIVOS_BASE}/EPS SURA- A&G SERVICIOS/Consolidado_RIAS_SURA_medicamentos_laboratorios.xlsx`],
  ["compensar", "laboratorios", `${ARCHIVOS_BASE}/COMPENSSAR - IPS VIVA 1A/Consolidado_RIAS_COMPENSAR_medicamentos_laboratorios.xlsm`],
  ["magisterio", "laboratorios", `${ARCHIVOS_BASE}/REGIMEN ESPECIAL MAGISTERIO - IPS SERVISALUD QCL/Consolidado_RIAS_SERVISALUD_medicamentos_laboratorios.xlsm`],
  ["cosalud", "laboratorios", `${ARCHIVOS_BASE}/IPS HUFS - EPS COOSALUD/Consolidado_RIAS_Unidad_Funcional_medicamentos_laboratorios.xlsm`],
  // Sanitas: biomédica (archivo agregado después)
  ["sanitas", "biomedica", `${ARCHIVOS_BASE}/IPS CLINICA CHIA SEDE 2 -  EPS SANITAS/9. Matriz R.Dotacion E.B CLINICA CHIA SEDE 2 – Sanitas.xlsx`],
  // EPS Salud Total · IPS Virrey Solís — sin anexos ni alertas
  ["salud-total", "biomedica", `${ARCHIVOS_BASE}/IPS VIRREY SOLIS - EPS SALUD TOTAL/1. Matriz R.Dotacion E.B Virrey Solis.xlsx`],
  ["salud-total", "adherencia_hc", `${ARCHIVOS_BASE}/IPS VIRREY SOLIS - EPS SALUD TOTAL/CONSOLIDADO-ADHERENCIA-HISTORIACLINICA.xlsx`],
  ["salud-total", "indicadores", `${ARCHIVOS_BASE}/IPS VIRREY SOLIS - EPS SALUD TOTAL/CONSOLIDADO INDICADORES TRAZADORES _VIRREY SOLIS.xlsx`],
  ["salud-total", "plan_mejora", `${ARCHIVOS_BASE}/IPS VIRREY SOLIS - EPS SALUD TOTAL/PLAN DE MEJORA VIRREY FINAL.xlsx`],
  ["salud-total", "medicamentos", `${ARCHIVOS_BASE}/IPS VIRREY SOLIS - EPS SALUD TOTAL/CONSOLIDADO  MEDICAMENTOS Y LABORATORIO.xlsx`],
  ["salud-total", "laboratorios", `${ARCHIVOS_BASE}/IPS VIRREY SOLIS - EPS SALUD TOTAL/CONSOLIDADO  MEDICAMENTOS Y LABORATORIO.xlsx`],
  ["salud-total", "capacidad", `${ARCHIVOS_BASE}/IPS VIRREY SOLIS - EPS SALUD TOTAL/CONSOLIDADO CAPACIDAD INSTALADA-RIAS -VIRREY SOLIS-SALUD TOTAL.xlsx`],
  ["salud-total", "oportunidad", `${ARCHIVOS_BASE}/IPS VIRREY SOLIS - EPS SALUD TOTAL/CONSOLIDADO-OPORTUNIDA-RIAS-IPS VIRREY SOLIS-SALUD TOTAL.xlsx`],
  // Alertas (archivos agregados después) para Salud Total y Sanitas
  ["salud-total", "alertas", `${ARCHIVOS_BASE}/IPS VIRREY SOLIS - EPS SALUD TOTAL/CONSOLIDADO-RIAS-SALUD TOTAL-ALERTAS.xlsx`],
  ["sanitas", "alertas", `${ARCHIVOS_BASE}/IPS CLINICA CHIA SEDE 2 -  EPS SANITAS/CONSOLIDADO-RIAS-SANITAS-ALERTAS.xlsx`],
  // CANALIZACIÓN EFECTIVA — un ÚNICO archivo con todas las EPS (una fila por EPS).
  // El parser filtra la fila según el epsId (parseFile lo recibe en opts.eps).
  ...["famisanar", "nueva-eps", "sura", "compensar", "magisterio", "cosalud", "sanitas", "salud-total"].map(
    (eps) => [eps, "canalizacion", `${ARCHIVOS_BASE}/CANALIZACION EFECTICA ZP VIVE SALUDABLE.xlsx`],
  ),
];
