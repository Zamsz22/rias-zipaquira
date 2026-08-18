// Traduce el nombre crudo de una hoja del Excel (ej "03_Precon_Gest_2026",
// "08_ADO_ HC 3", "07_CA_Mama_2026") a la etapa / curso de vida legible.
// lista de prefijos; alcanza para los nombres reales de RIAS.

const MAP: [RegExp, string][] = [
  [/precon/, "Preconcepción"],
  [/prenatal|cpn/, "Control prenatal"],
  [/planfam|_pf_|^pf\b|_pf /, "Planificación familiar"],
  // Nutrición y desnutrición (Res. 2350) se agrupan DENTRO de Lactancia materna.
  [/lact|_lm[_ ]|materna|nut2350|nut|desnutri/, "Lactancia materna"],
  [/pinf|primera inf/, "Primera infancia"],
  [/_inf_|infancia/, "Infancia"],
  [/adol|_ado[_ ]|adolescente/, "Adolescencia"],
  [/_juv|joven/, "Juventud"],
  [/adul/, "Adultez"],
  [/_vej|vejez/, "Vejez"],
  [/saludoral|oral/, "Salud oral"],
  [/saludmental|mental/, "Salud mental"],
  [/cuello/, "Cáncer de cuello uterino"],
  [/mama/, "Cáncer de mama"],
  [/prostata/, "Cáncer de próstata"],
  [/colo[mn]|colon/, "Cáncer de colon y recto"],
  [/violencia/, "Violencia sexual"],
  [/its|vih/, "ITS / VIH"],
  [/^01_pre|_pre[_ ]/, "Preconcepción"],
];

export function etapaDeHoja(hoja: string): string | null {
  const h = hoja.toLowerCase();
  for (const [re, label] of MAP) if (re.test(h)) return label;
  return null;
}

// Código corto (último segmento útil: nº de paciente / detalle).
export function detalleHoja(hoja: string): string {
  return hoja.replace(/^\d+[_\s]*/, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}
