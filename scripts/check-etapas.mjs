// Verifica que TODA hoja de historias quede en un curso de vida (contenido o nombre).


import { ARCHIVOS, parseFile, leerWb } from "./parser.mjs";

const MAP = [
  [/precon/, "Preconcepción"], [/prenatal|cpn/, "Control prenatal"], [/planfam|_pf_|^pf\b|_pf /, "Planificación familiar"],
  [/lact|_lm[_ ]|materna|nut2350|nut|desnutri/, "Lactancia materna"], [/pinf|primera inf/, "Primera infancia"],
  [/_inf_|infancia/, "Infancia"], [/adol|_ado[_ ]|adolescente/, "Adolescencia"], [/_juv|joven/, "Juventud"],
  [/adul/, "Adultez"], [/_vej|vejez/, "Vejez"], [/saludoral|oral/, "Salud oral"], [/saludmental|mental/, "Salud mental"],
  [/cuello/, "Cáncer cuello"], [/mama/, "Cáncer mama"], [/prostata/, "Cáncer próstata"], [/colo[mn]|colon/, "Cáncer colon"],
  [/violencia/, "Violencia"], [/its|vih/, "ITS/VIH"], [/^01_pre|_pre[_ ]/, "Preconcepción"],
];
const etapaNombre = (h) => { const x = String(h).toLowerCase(); for (const [re, l] of MAP) if (re.test(x)) return l; return null; };

for (const [eps, tipo, ruta] of ARCHIVOS) {
  if (tipo !== "adherencia_hc") continue;
  const wb = leerWb(ruta);
  const { registros } = parseFile(tipo, wb);
  const dist = {};
  const sin = [];
  const desacuerdos = [];
  const norm = (s) => (s || "").toLowerCase().replace(/ ·.*/, "").replace(/[áéíóú]/g, (m) => "aeiou"["áéíóú".indexOf(m)]).trim();
  for (const r of registros) {
    const eC = r.datos.__etapa;            // por contenido
    const eN = etapaNombre(r.hoja);        // por nombre
    const e = eC || eN;
    if (e) dist[e] = (dist[e] || 0) + 1; else sin.push(r.hoja);
    if (eC && eN && norm(eC) !== norm(eN)) desacuerdos.push(`${r.hoja}: contenido=${eC} vs nombre=${eN}`);
  }
  console.log(`\n### ${eps}: ${registros.length} hojas · SIN curso: ${sin.length} · desacuerdos contenido/nombre: ${desacuerdos.length}`);
  console.log("   " + JSON.stringify(dist));
  if (sin.length) console.log("   sueltas: " + sin.slice(0, 15).join(" | "));
  if (desacuerdos.length) desacuerdos.slice(0, 10).forEach((d) => console.log("   ⚠ " + d));
}
