// Genera el análisis de IA por componente para las EPS ya cargadas.
// Lee registros de Supabase, arma un resumen COMPACTO (exacto, pocos tokens),
// llama al Worker de Cloudflare y guarda el resultado en cargas.analisis.
// Uso: node scripts/generar-analisis.mjs

const URL = "https://oxbbtuvobwxjcwdefury.supabase.co/rest/v1";
const KEY = "sb_publishable_gOboudz7VTT0ayOtgu44mQ_TBqM1s4W";
const WORKER = "https://rias.davidsambr716.workers.dev/";
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

const ETAPAS = [
  [/precon/, "Preconcepción"], [/prenatal|cpn/, "Control prenatal"], [/planfam|_pf_|_pf /, "Planificación familiar"],
  [/lact|_lm[_ ]|materna/, "Lactancia materna"], [/nut2350|nut|desnutri/, "Nutrición"], [/pinf|primera infancia/, "Primera infancia"],
  [/_inf_|infancia/, "Infancia"], [/adol|_ado[_ ]|adolescente/, "Adolescencia"], [/_juv|joven/, "Juventud"],
  [/adul/, "Adultez"], [/_vej|vejez/, "Vejez"], [/saludoral|oral/, "Salud oral"], [/saludmental|mental/, "Salud mental"],
  [/cuello/, "Cáncer cuello uterino"], [/mama/, "Cáncer de mama"], [/prostata/, "Cáncer de próstata"], [/colo[mn]/, "Cáncer de colon"],
];
const etapa = (h) => { const x = String(h).toLowerCase(); for (const [re, l] of ETAPAS) if (re.test(x)) return l; return h; };
const num = (v) => { const x = parseFloat(String(v ?? "").replace("%", "").replace(",", ".")); return isNaN(x) ? null : x; };
const get = (d, re) => { const k = Object.keys(d).find((x) => re.test(x)); return k ? String(d[k] ?? "") : ""; };

function compacto(tipo, regs) {
  const L = [];
  if (tipo === "indicadores") {
    const vals = regs.map((r) => num(get(r.datos, /cumplimiento del mes|cumplimiento/i))).filter((x) => x != null && x >= 0 && x <= 100);
    const bajos = vals.filter((x) => x < 40).length;
    const optimos = vals.filter((x) => x >= 80).length;
    L.push(`${regs.length} mediciones de indicadores trazadores: ${bajos} por debajo del 40% (incumplimiento) y ${optimos} óptimas (≥80%).`);
    for (const r of regs) { const ind = get(r.datos, /nombre del indicador|indicador/i); if (!ind) continue;
      L.push(`${r.datos.__etapa || etapa(r.hoja)} | ${ind} | ${get(r.datos, /numerador/i)}/${get(r.datos, /denominador/i)} | ${get(r.datos, /cumplimiento|%/i)}`); if (L.length >= 55) break; }
  } else if (tipo === "adherencia_hc") {
    const g = {}; for (const r of regs) { const e = r.datos?.__etapa || etapa(r.hoja); g[e] ??= { n: 0, s: 0 }; g[e].n++; g[e].s += num(get(r.datos, /calificaci/i)) ?? 0; }
    for (const [e, v] of Object.entries(g)) L.push(`${e} | ${v.n} pacientes | calificación promedio ${v.n ? (v.s / v.n).toFixed(1) : 0}%`);
  } else if (tipo === "anexos") {
    const g = {}; for (const r of regs) { const a = r.hoja; g[a] ??= { n: 0, s: 0, c: 0 }; g[a].n++; const p = num(get(r.datos, /cumplimiento/i)); if (p != null) { g[a].s += p; g[a].c++; } }
    for (const [a, v] of Object.entries(g)) L.push(`${a} | ${v.n} aspectos | cumplimiento promedio ${v.c ? (v.s / v.c).toFixed(1) : 0}%`);
  } else if (tipo === "biomedica") {
    for (const r of regs) { L.push(`${get(r.datos, /servicio/i)} | ${get(r.datos, /criterio/i)} | ${get(r.datos, /cumplimiento|%/i)} | ${get(r.datos, /sem[aá]foro/i)}`); if (L.length >= 40) break; }
  } else if (tipo === "plan_mejora") {
    // MÓDULO: indicador Efectivo / No efectivo (no lleva %).
    const c = { Efectivo: 0, "No efectivo": 0, "En seguimiento": 0 };
    for (const r of regs) { const k = r.datos?.Resultado; if (k in c) c[k]++; }
    const cerrados = c.Efectivo + c["No efectivo"];
    L.push(`MÓDULO Plan de Mejora (indicador, sin porcentaje): ${regs.length} hallazgos · ${c.Efectivo} EFECTIVOS, ${c["No efectivo"]} NO EFECTIVOS, ${c["En seguimiento"]} en seguimiento. Efectividad de los cerrados: ${cerrados ? ((c.Efectivo / cerrados) * 100).toFixed(1) : 0}%.`);
    for (const r of regs.slice(0, 15)) L.push(`- [${r.datos?.Resultado}] ${get(r.datos, /ruta|programa/i)}: ${get(r.datos, /descripci|hallazgo/i).slice(0, 90)}`);
  } else if (tipo === "canalizacion") {
    L.push(`Canalización efectiva por riesgo (canalizados vs. efectivos). % del componente = efectivos / canalizados.`);
    for (const r of regs) L.push(`${r.datos?.Riesgo} | canalizados ${r.datos?.Canalizados} | efectivos ${r.datos?.Efectivos} | ${r.datos?.Cumplimiento} → ${r.datos?.Resultado}`);
  } else if (tipo === "medicamentos" || tipo === "laboratorios") {
    const esLab = tipo === "laboratorios";
    const cosa = esLab ? "laboratorios" : "medicamentos";
    const verbo = esLab ? "realización" : "entrega";
    const dist = {}; for (const r of regs) { const e = r.datos?.Estado || "Sin dato"; dist[e] = (dist[e] || 0) + 1; }
    const C = dist["Cumplida"] || 0, NC = dist["No cumplida"] || 0, SC = dist["Sin contactar"] || 0, P = dist["Pendiente"] || 0;
    const den = C + NC + SC + P;
    L.push(`Cumplimiento REAL de ${verbo} de ${cosa} = ${den ? ((C / den) * 100).toFixed(1) : 0}% = ${C} cumplidas / ${den} con seguimiento. NO cumplidas: ${NC} (la EPS no las entregó/realizó: "no había", el paciente las compró, incompletas, demoras…). Sin contactar (no verificable, cuenta en contra): ${SC}. Pendientes: ${P}. ("No aplica" y "sin dato" no cuentan.) Es el componente más importante.`);
    for (const [e, c] of Object.entries(dist)) L.push(`${e}: ${c}`);
  } else if (tipo === "capacidad") {
    const def = regs.filter((r) => /d[ée]ficit/i.test(r.datos?.Estado || ""));
    L.push(`${regs.length} servicios · ${regs.length - def.length} con dotación suficiente, ${def.length} en déficit.`);
    for (const r of def.slice(0, 20)) L.push(`- ${r.datos?.Servicio}: reporta ${r.datos?.Reporta} / requiere ${r.datos?.Requiere}`);
  } else if (tipo === "oportunidad") {
    const limp = (k) => { const s = k.replace(/\s*1\s*vez/i, "").trim().toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); };
    const fallas = {};
    for (const r of regs) for (const e of r.datos?.__incumple || []) fallas[limp(e)] = (fallas[limp(e)] || 0) + 1;
    const n = regs.length;
    L.push(`${n} meses evaluados contra la RESOLUCIÓN 1552 (días máximos por especialidad: medicina general y odontología ≤3, pediatría ≤8, obstetricia ≤10, ginecología/psicología/nutrición ≤15, medicina interna ≤30). "No agenda disponible" también incumple.`);
    const ord = Object.entries(fallas).sort((a, b) => b[1] - a[1]);
    if (ord.length) { L.push("Especialidades que INCUMPLEN (superan el máximo o sin agenda):"); for (const [e, c] of ord) L.push(`- ${e}: incumple en ${c} de ${n} meses`); }
    else L.push("Todas las especialidades cumplen los rangos de la Res. 1552.");
    for (const r of regs) L.push(`${r.datos.Mes}: cumple ${r.datos["Cumple Res.1552"]} especialidades`);
  } else if (tipo === "alertas") {
    const gest = regs.filter((r) => /gestionada/i.test(r.datos?.Estado || "")).length;
    L.push(`${regs.length} alertas tempranas · ${gest} gestionadas con resultado (${regs.length ? ((gest / regs.length) * 100).toFixed(1) : 0}%).`);
    const porRiesgo = {}; for (const r of regs) { const k = r.datos?.Riesgo || "Sin clasificar"; porRiesgo[k] = (porRiesgo[k] || 0) + 1; }
    for (const [k, c] of Object.entries(porRiesgo).slice(0, 10)) L.push(`Riesgo ${k}: ${c}`);
    for (const r of regs.slice(0, 6)) L.push(`- ${String(r.datos?.Alerta || "").slice(0, 80)} → ${String(r.datos?.["Acción realizada"] || "").slice(0, 60)}`);
  }
  return L.join("\n").slice(0, 7000);
}

async function main() {
  const cargas = await (await fetch(`${URL}/cargas?analisis=is.null&select=id,eps_id,tipo_documento`, { headers: H })).json();
  for (const c of cargas) {
    const regs = await (await fetch(`${URL}/registros?eps_id=eq.${c.eps_id}&tipo_documento=eq.${c.tipo_documento}&select=hoja,datos&limit=3000`, { headers: H })).json();
    const muestra = compacto(c.tipo_documento, regs);
    if (!muestra) { console.log(`· ${c.eps_id}/${c.tipo_documento}: sin muestra`); continue; }
    const r = await fetch(WORKER, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tipo: c.tipo_documento, eps: c.eps_id, muestra }) });
    const d = await r.json();
    if (!d?.ok || !d.analisis) { console.log(`✗ ${c.eps_id}/${c.tipo_documento}: ${d?.error || "sin análisis"}`); continue; }
    await fetch(`${URL}/cargas?id=eq.${c.id}`, { method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ analisis: d.analisis }) });
    console.log(`✓ ${c.eps_id}/${c.tipo_documento}: ${String(d.analisis.resumen || "").slice(0, 90)}`);
  }
  console.log("Listo.");
}
main();
