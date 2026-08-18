// Adivina a qué EPS pertenece un archivo por su carpeta o su nombre.
// El orden importa: los nombres más específicos van primero (Sanitas es "Clínica Chía Sede 2"
// y Nueva EPS "Clínica Chía Sede 1"; si "clínica chía" se mirara antes, ambas caerían en Nueva EPS).
const ALIAS: [string, string[]][] = [
  ["sanitas", ["sanitas", "sede 2", "clinica chia sede 2"]],
  ["famisanar", ["famisanar", "cafam", "cas cafam"]],
  ["sura", ["sura", "a&g", "aig"]],
  ["cosalud", ["cosalud", "coosalud", "hufs", "unidad funcional", "samaritana"]],
  ["compensar", ["compensar", "compenssar", "viva 1a", "viva1a"]],
  ["magisterio", ["magisterio", "fomag", "servisalud", "qcl", "qsl"]],
  ["salud-total", ["salud total", "salud-total", "virrey", "solis", "solís"]],
  ["sanidad-policia", ["sanidad", "policia", "policía"]],
  ["nueva-eps", ["nueva eps", "nueva-eps", "nuevaeps", "sede 1", "clinica chia", "clínica chía", "chia", "chía"]],
];

export function detectarEpsDesdeRuta(ruta: string): string | null {
  const r = ruta.toLowerCase().replace(/\\/g, "/");
  for (const [id, claves] of ALIAS) {
    if (claves.some((k) => r.includes(k))) return id;
  }
  return null;
}
