// Los 9 prestadores priorizados de Zipaquirá (EPS → IPS primaria).
// Tomados del HTML institucional. En producción viven en la tabla `eps` de Supabase;
// aquí sirven como semilla y como respaldo de demostración.

export type Prestador = {
  id: string;
  eps: string;
  ips: string;
  regimen?: boolean;
};

export const PRESTADORES: Prestador[] = [
  { id: "famisanar", eps: "EPS Famisanar", ips: "CAS Cafam" },
  { id: "nueva-eps", eps: "Nueva EPS", ips: "Clínica Chía Sede 1" },
  { id: "sura", eps: "EPS Sura", ips: "A&G Servicios" },
  { id: "cosalud", eps: "EPS Coosalud", ips: "HUS Unidad Funcional de Zipaquira (HUFS)" },
  { id: "compensar", eps: "EPS Compensar", ips: "Viva 1A" },
  { id: "magisterio", eps: "FOMAG", ips: "Servisalud QCL" },
  { id: "sanitas", eps: "EPS Sanitas", ips: "Clínica Chía Sede 2" },
  { id: "salud-total", eps: "EPS Salud Total", ips: "Virrey Solís" },
  { id: "sanidad-policia", eps: "Régimen especial Sanidad Policía", ips: "Establecimiento de Sanidad Policía", regimen: true },
];

export function getPrestador(id: string): Prestador | undefined {
  return PRESTADORES.find((p) => p.id === id);
}

// 10 cursos de vida / momentos de las dos rutas RIAS.
export const CURSOS_VIDA = [
  "Consulta preconcepcional",
  "Control prenatal",
  "Planificación familiar",
  "Lactancia materna",
  "Primera infancia",
  "Infancia",
  "Adolescencia",
  "Juventud",
  "Adultez",
  "Vejez",
] as const;
