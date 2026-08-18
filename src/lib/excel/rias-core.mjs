// Lee los Excel y saca las cifras. Funciona igual en la web (página Cargar) y en los scripts.
import * as XLSX from "xlsx";

export const clean = (v) => (v == null ? "" : String(v).replace(/\s+/g, " ").trim());

// Protección de datos: nunca guardamos el nombre ni el documento completos.
// Dejamos solo las iniciales y los últimos 4 dígitos.
// "JUAN CARLOS PEREZ GOMEZ" -> "J. C. P. G."
export const iniciales = (nombre) => {
  const t = clean(nombre).replace(/\d/g, "").trim();
  if (!t) return "Paciente";
  const parts = t.split(/\s+/).filter((p) => p.length > 1 || /^[A-ZÁÉÍÓÚÑ]$/i.test(p));
  const ini = parts.slice(0, 4).map((p) => p[0].toUpperCase() + ".").join(" ");
  return ini || "Paciente";
};
// "1075670635" -> "••••0635"  (solo los últimos 4 dígitos)
export const enmascararDoc = (doc) => {
  const t = clean(doc);
  const soloNum = t.replace(/\D/g, "");
  if (soloNum.length >= 4) return "••••" + soloNum.slice(-4);
  return soloNum ? "••••" + soloNum : "—";
};
export const num = (v) => {
  const n = parseFloat(String(v).replace("%", "").replace(",", "."));
  return isNaN(n) ? null : n;
};
export const round = (x) => Math.round(x * 10) / 10;
export const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
export const aoa = (sheet) => XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "", raw: false });

export function headerRow(rows, pista) {
  for (let i = 0; i < Math.min(rows.length, 30); i++)
    if (rows[i].some((c) => clean(c).toLowerCase().includes(pista))) return i;
  return 0;
}

function genericRows(rows, hr) {
  const H = (rows[hr] || []).map(clean);
  const data = rows.slice(hr + 1);
  const cols = [];
  H.forEach((h, i) => {
    if (!h || /^columna \d+$/i.test(h)) return;
    if (!data.some((r) => clean(r[i]) !== "")) return;
    cols.push([i, h]);
  });
  const out = [];
  for (const r of data) {
    const datos = {};
    let n = 0;
    for (const [i, h] of cols) {
      const v = clean(r[i]);
      datos[h] = v;
      if (v) n++;
    }
    if (n >= 2) out.push(datos);
  }
  return out;
}

export function parseGenerico(wb, pista, pctRe) {
  const registros = [];
  const pcts = [];
  for (const sn of wb.SheetNames) {
    const objs = genericRows(aoa(wb.Sheets[sn]), headerRow(aoa(wb.Sheets[sn]), pista));
    for (const d of objs) {
      registros.push({ hoja: sn, datos: d });
      for (const [k, v] of Object.entries(d)) {
        if (!pctRe.test(k)) continue;
        const n = num(v);
        if (n != null && n >= 0 && n <= 100) pcts.push(n);
      }
    }
  }
  return { registros, pct: pcts.length ? round(avg(pcts)) : null };
}

// Calificación ponderada de una hoja de checklist (historias).
export function calificar(rows) {
  let cD = -1, cN = -1, cA = -1;
  for (const row of rows) {
    let d = -1, n = -1, a = -1;
    row.forEach((c, j) => {
      const t = clean(c).toUpperCase();
      if (t === "CUMPLE") d = j;
      else if (t === "NO CUMPLE") n = j;
      else if (t === "NO APLICA") a = j;
    });
    if (d >= 0 && n >= 0 && a >= 0) { cD = d; cN = n; cA = a; }
  }
  if (cD < 0) return { cal: null, aspectos: [], cc: 0, ncc: 0, nac: 0, wTotal: 0 };
  const esMarca = (v) => { const t = clean(v).toUpperCase(); return t === "1" || t === "X" || t === "✓" || t === "SI" || t === "SÍ"; };
  const marca = (row) =>
    esMarca(row[cD]) ? "CUMPLE" : esMarca(row[cN]) ? "NO CUMPLE" : esMarca(row[cA]) ? "NO APLICA" : "";

  const maxMark = Math.max(cD, cN, cA);
  const marcadas = rows.filter((r) => marca(r));
  let pesoCol = -1, best = 0;
  for (let j = 0; j < maxMark; j++) {
    const cnt = marcadas.filter((r) => { const v = clean(r[j]); return /%/.test(v) && num(v) != null; }).length;
    if (cnt > best) { best = cnt; pesoCol = j; }
  }
  if (pesoCol < 0) return { cal: null, aspectos: [], cc: 0, ncc: 0, nac: 0, wTotal: 0 };

  let obsCol = -1;
  for (const row of rows) row.forEach((c, j) => { if (/observac/i.test(clean(c))) obsCol = j; });

  let categoria = "General";
  const aspectos = [];
  let wCumple = 0, wNoCumple = 0, wNoAplica = 0, wTotal = 0, cc = 0, ncc = 0, nac = 0;
  for (const row of rows) {
    const A = clean(row[0]);
    if (/calificacion total/i.test(A)) break;
    const m = marca(row);
    const peso = num(clean(row[pesoCol]));
    if (!m || peso == null) {
      if (A && !m) categoria = A;
      continue;
    }
    if (A) categoria = A;
    let asp = "";
    for (let j = 1; j < pesoCol; j++) {
      const v = clean(row[j]);
      if (v && !/%/.test(v) && v.length > asp.length) asp = v;
    }
    if (!asp) asp = clean(row[1]) || clean(row[2]);
    wTotal += peso;
    if (m === "CUMPLE") { wCumple += peso; cc++; }
    else if (m === "NO CUMPLE") { wNoCumple += peso; ncc++; }
    else { wNoAplica += peso; nac++; }
    const obs = obsCol >= 0 ? clean(row[obsCol]) : "";
    const asObj = { cat: categoria, a: asp.slice(0, 120), r: m, p: clean(row[pesoCol]) };
    if (obs && obs.length > 2) asObj.o = obs.slice(0, 220);
    aspectos.push(asObj);
  }
  // La nota es el % del puntaje que cumple, dividido por el puntaje total real de la hoja
  // (así nunca pasa de 100%, aunque la hoja sume distinto).
  const cal = wTotal > 0 ? round((wCumple / wTotal) * 100) : null;
  return { cal, aspectos, cc, ncc, nac, wTotal: round(wTotal), wNoCumple: round(wNoCumple), wNoAplica: round(wNoAplica) };
}

// El curso de vida (prenatal, infancia, vejez...) se detecta por el contenido de la hoja,
// no por su nombre: cada EPS nombra las hojas distinto.
export const CURSOS = [
  [/PRECONCEPCION|PRECONCEPCIONAL/, "Preconcepción"],
  [/CONTROL PRENATAL|\bPRENATAL\b|\bCPN\b/, "Control prenatal"],
  [/PLANIFICACION/, "Planificación familiar"],
  // Nutrición y desnutrición (Res. 2350) van DENTRO de Lactancia materna (indicación del usuario).
  [/LACTANCIA|DESNUTRICION|NUTRICION|RESOL\.?\s*2350|2350\s*\/?\s*2020/, "Lactancia materna"],
  [/PRIMERA INFANCIA/, "Primera infancia"],
  [/VEJEZ|ADULTO MAYOR|PERSONA MAYOR|PERSONA ADULTA MAYOR/, "Vejez"],
  [/ADOLESCENCIA/, "Adolescencia"],
  [/JUVENTUD|\bJOVEN\b/, "Juventud"],
  [/ADULTEZ|\bADULTO\b|\bADULTA\b/, "Adultez"],
  [/\bINFANCIA\b/, "Infancia"],
  [/CUELLO UTERINO/, "Cáncer de cuello uterino"],
  [/\bMAMA\b/, "Cáncer de mama"],
  [/PROSTATA/, "Cáncer de próstata"],
  [/COLON|COLORRECTAL/, "Cáncer de colon y recto"],
  [/VIOLENCIA/, "Violencia sexual"],
];
function detectarCurso(rows) {
  let t = "";
  for (let i = 0; i < Math.min(rows.length, 14); i++) t += " " + rows[i].map(clean).join(" ");
  t = t.toUpperCase();
  for (const [re, label] of CURSOS) if (re.test(t)) return label;
  return null;
}

function parseHistorias(wb) {
  const registros = [];
  const cals = [];
  for (const sn of wb.SheetNames) {
    const rows = aoa(wb.Sheets[sn]);
    const curso = detectarCurso(rows);
    let cc = "", nombre = "", edad = "", sexo = "";
    for (const row of rows)
      for (const c of row) {
        const t = clean(c);
        const m = t.match(/\b(CC|TI|RC|CE|PA|MS|NUIP|PPT|PT)[:\s]*([0-9]{4,})/i);
        if (m && !cc) { cc = m[2]; const nm = t.match(/NOMBRE[:\s]*([^|]+)/i); if (nm) nombre = nm[1].replace(/(FECHA|EDAD|SEXO).*/i, "").trim(); }
        const e = t.match(/EDAD[:\s]*([0-9]{1,3})/i) || t.match(/([0-9]{1,3})\s*A[ÑN]OS/i);
        if (e && !edad) edad = e[1];
        const s = t.match(/SEXO[:\s]*([A-Za-zÁÉÍÓÚ]+)/i); if (s && !sexo) sexo = s[1];
      }
    const { cal, aspectos, cc: nc, ncc, nac, wTotal } = calificar(rows);
    // Saltamos las hojas de plantilla vacías para no mostrar pacientes sin datos.
    if (cal == null && aspectos.length === 0) continue;
    if (cal != null) cals.push(cal);
    // Solo iniciales y últimos 4 dígitos (protección de datos).
    const datos = { Paciente: iniciales(nombre), Documento: enmascararDoc(cc || sn) };
    if (edad) datos["Edad"] = edad + " años";
    if (sexo) datos["Sexo"] = sexo;
    datos["Calificación"] = cal + "%";
    datos["Cumple"] = String(nc);
    datos["No cumple"] = String(ncc);
    datos["No aplica"] = String(nac);
    if (curso) datos["__etapa"] = curso; // curso de vida (para agrupar)
    if (aspectos.length) datos["__aspectos"] = aspectos.slice(0, 70);
    registros.push({ hoja: sn, datos, _wTotal: wTotal });
  }
  return { registros, pct: cals.length ? round(avg(cals)) : null };
}

// Anexos: aspecto = col B, peso = col C, % logrado = col D. Calificación = suma del logrado.
export function parseAnexos(wb) {
  const registros = [];
  const cals = [];
  for (const sn of wb.SheetNames) {
    const rows = aoa(wb.Sheets[sn]);
    const hr = headerRow(rows, "aspecto evaluado");
    let categoria = "General";
    const aspectos = [];
    let logradoSum = 0, pesoSum = 0, cc = 0, ncc = 0;
    for (let r = hr + 1; r < rows.length; r++) {
      const A = clean(rows[r][0]), B = clean(rows[r][1]), C = clean(rows[r][2]), D = clean(rows[r][3]);
      if (/calificacion total/i.test(A)) break;
      const peso = num(C);
      if (!B || peso == null) {
        if (A && !B) categoria = A;
        continue;
      }
      if (A) categoria = A;
      const logrado = num(D) ?? 0;
      logradoSum += logrado;
      pesoSum += peso;
      const cumple = logrado > 0;
      if (cumple) cc++; else ncc++;
      aspectos.push({ cat: categoria, a: B.slice(0, 120), r: cumple ? "CUMPLE" : "NO CUMPLE", p: C });
    }
    if (!aspectos.length) continue;
    const cal = round(logradoSum);
    cals.push(cal);
    registros.push({
      hoja: sn,
      datos: { Anexo: sn, Calificación: cal + "%", Cumple: String(cc), "No cumple": String(ncc), __aspectos: aspectos.slice(0, 70) },
      _pesoSum: round(pesoSum),
    });
  }
  return { registros, pct: cals.length ? round(avg(cals)) : null };
}

// Mira el texto (cada IPS lo escribe distinto) y decide si la orden se cumplió.
// "No cumplida" = la EPS no la entregó (no había, el paciente la compró, quedó incompleta…).
export function clasificarEstado(texto) {
  const t = clean(texto).toUpperCase();
  if (!t || /^(NA|N\/A|NO|NO APLICA|0)$/.test(t)) return "No aplica";
  // Primero los casos negativos: "NO SE HA REALIZADO" no debe contar como realizada.
  if (/NO ENTREGAD|NO REALIZAD|NO SE HA REALIZADO|NO SE LA HA|NO SE HAN|NO SE LO HA|A[UÚ]N NO|NO RECLAM|NO HAB[IÍ]A|NO HAIAN|NO HABIAN|COMPR[OÓ]|COMPRARON|INCOMPLET|PARCIAL|FALTAN|DESABASTEC|AGOTAD|NUNCA SE LOS|NO SE LOS|DEMORA/.test(t)) return "No cumplida";
  if (/SIN RESPUESTA|NO CONTEST|NO CONTACT|FUERA DE SERVICIO|SIN N[UÚ]MERO|APAGAD|INCORRECT|NO LA CITAR|BUZ[OÓ]N|NO RESPONDE/.test(t)) return "Sin contactar";
  if (/PENDIENTE|EN TR[AÁ]MITE|POR ENTREGAR|POR REALIZAR/.test(t)) return "Pendiente";
  if (/SIN INCONVENIENTE|ENTREGAD|REALIZAD|SE REALIZ[OÓ]|SE RELAIZ|RELAIZ[OÓ]|SE TOM[OÓ]|SE LOS ENTREG|SE LOS TOM|RECLAM|CUMPLE/.test(t)) return "Cumplida";
  if (/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(t) || /^\d{5}$/.test(t.trim())) return "Cumplida"; // una fecha = se realizó
  return "Sin dato";
}

// Medicamentos y laboratorios. El Excel viene en dos formatos (una hoja por tipo, o columnas
// separadas en la misma hoja) y se soportan ambos.
// % = cumplidas / (cumplidas + no cumplidas + sin contactar + pendiente).
function parseMedLab(wb, kind) {
  const lab = kind === "laboratorios";
  const tags = wb.SheetNames.some((s) => /\bMTO\b|\bLA?BT?\b/i.test(s));
  const registros = [];
  const cuenta = { Cumplida: 0, "No cumplida": 0, "Sin contactar": 0, Pendiente: 0, "No aplica": 0, "Sin dato": 0 };
  const idx = (H, re) => H.findIndex((h) => re.test(h));
  for (const sn of wb.SheetNames) {
    if (tags) {
      const esLab = /\bLA?BT?\b/i.test(sn), esMed = /\bMTO\b/i.test(sn);
      if (lab ? !esLab : !esMed) continue; // formato nuevo: filtra por la sigla de la hoja
    }
    const rows = aoa(wb.Sheets[sn]);
    const hr = rows.findIndex((r) => r.some((c) => /SI\s*\/\s*NO/i.test(clean(c))));
    if (hr < 0) continue;
    const H = rows[hr].map((c) => clean(c).toUpperCase());
    const cDoc = idx(H, /^DOCUMENTO/) >= 0 ? idx(H, /^DOCUMENTO/) : 1;
    const cSi = idx(H, lab ? /LABORATORIOS SI/ : /MEDICAMENTO SI/);
    const cRel = idx(H, lab ? /LABORATORIOS ORDENADOS/ : /MEDICAMENTOS ORDENADOS/);
    if (cRel < 0) continue;
    // Columnas donde va el estado de cada orden.
    const statusCols = H.map((h, i) => [h, i])
      .filter(([h]) => (lab ? /REALIZACI.N DE LABORATORIOS|OBSERVACIONES DE LABORATORIOS/ : /ENTREGA DE MEDICAMENTO|OBSERVACIONES DE MEDICAMENTOS/).test(h))
      .map(([, i]) => i);
    let doc = "";
    for (let r = hr + 1; r < rows.length; r++) {
      const row = rows[r];
      if (clean(row[cDoc])) doc = clean(row[cDoc]);
      const item = clean(row[cRel]);
      const si = cSi >= 0 ? clean(row[cSi]).toUpperCase() : "";
      // Si hay columna SI/NO mandamos por ella; si no, miramos la relación.
      const hayOrden = cSi >= 0 ? si === "SI" : Boolean(item && !/^(no|na|no aplica|n\/a)$/i.test(item));
      if (!hayOrden) continue;
      const statusText = tags
        ? row.slice(cRel + 1).map(clean).filter(Boolean).join(" ")
        : statusCols.map((i) => clean(row[i])).filter(Boolean).join(" ");
      const estado = clasificarEstado(statusText);
      cuenta[estado]++;
      // Documento con solo los últimos 4 dígitos.
      registros.push({ hoja: sn, datos: { Documento: enmascararDoc(doc), [lab ? "Laboratorio" : "Medicamento"]: item || "—", Estado: estado } });
    }
  }
  const den = cuenta["Cumplida"] + cuenta["No cumplida"] + cuenta["Sin contactar"] + cuenta["Pendiente"];
  return { registros, pct: den ? round((cuenta["Cumplida"] / den) * 100) : null, _cuenta: cuenta, _cumplidas: cuenta["Cumplida"], _den: den };
}
export const parseMedicamentos = (wb) => parseMedLab(wb, "medicamentos");
export const parseLaboratorios = (wb) => parseMedLab(wb, "laboratorios");

// Capacidad instalada: por cada servicio, profesionales que reporta vs. que requiere.
// % = servicios con dotación suficiente / total.
export function parseCapacidad(wb) {
  const registros = [];
  let suf = 0, tot = 0;
  for (const sn of wb.SheetNames) {
    const rows = aoa(wb.Sheets[sn]);
    let hr = -1;
    for (let i = 0; i < rows.length; i++) if (clean(rows[i][0]).toUpperCase() === "SERVICIO") { hr = i; break; }
    if (hr < 0) continue;
    for (let r = hr + 1; r < rows.length; r++) {
      const servicio = clean(rows[r][0]);
      const reporta = num(clean(rows[r][1]));
      const requiere = num(clean(rows[r][2]));
      if (!servicio || (reporta == null && requiere == null)) continue;
      if (/total|aseguramiento|contributivo|subsidiado/i.test(servicio)) continue;
      const rep = reporta ?? 0, req = requiere ?? 0;
      const cumple = rep >= req;
      tot++; if (cumple) suf++;
      const cob = req > 0 ? Math.min(Math.round((rep / req) * 100), 100) : 100;
      registros.push({
        hoja: sn,
        datos: { Servicio: servicio, Reporta: String(rep), Requiere: String(req), Cumplimiento: cob + "%", Estado: cumple ? "Suficiente" : "Déficit" },
      });
    }
  }
  return { registros, pct: tot ? round((suf / tot) * 100) : null, _suf: suf, _tot: tot };
}

// Oportunidad de citas: días de espera por especialidad, por mes.
// % = cumplimiento de la Resolución 1552 (días máximos por especialidad).
const MESES = /enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre/i;
const UMBRAL_1552 = [
  [/medicina general/i, 3], [/odontolog/i, 3], [/medicina interna/i, 30],
  [/ginecolog/i, 15], [/psicolog/i, 15], [/obstetric|obsteric/i, 10],
  [/pediatr/i, 8], [/nutric/i, 15],
];
const umbral1552 = (col) => { for (const [re, m] of UMBRAL_1552) if (re.test(col)) return m; return null; };
const diasDe = (v) => { const m = String(v).match(/\d+/); return m ? parseInt(m[0], 10) : null; };

export function parseOportunidad(wb) {
  const registros = [];
  let cumple = 0, tot = 0;
  for (const sn of wb.SheetNames) {
    const rows = aoa(wb.Sheets[sn]);
    let hr = -1;
    for (let i = 0; i < rows.length; i++) if (rows[i].some((c) => clean(c).toUpperCase() === "MES")) { hr = i; break; }
    if (hr < 0) continue;
    const H = rows[hr].map(clean);
    const cMes = H.findIndex((h) => h.toUpperCase() === "MES");
    const espCols = [];
    for (let j = cMes + 1; j < H.length; j++) if (H[j]) espCols.push([j, H[j], umbral1552(H[j])]);
    for (let r = hr + 1; r < rows.length; r++) {
      const mes = clean(rows[r][cMes]);
      if (!mes || !MESES.test(mes)) continue;
      const datos = { Mes: mes };
      let okMes = 0, totMes = 0;
      const incumple = [], umbral = {};
      for (const [j, nombre, max] of espCols) {
        const v = clean(rows[r][j]);
        if (!v) continue;
        datos[nombre] = v;
        if (max == null) continue; // especialidad sin umbral definido: no se evalúa
        umbral[nombre] = max;
        const d = /no agenda|sin agenda|no disponible/i.test(v) ? null : diasDe(v);
        totMes++; tot++;
        if (d != null && d <= max) { okMes++; cumple++; }
        else incumple.push(nombre); // excede el máximo o sin agenda
      }
      datos["Cumple Res.1552"] = `${okMes}/${totMes}`;
      if (incumple.length) datos["__incumple"] = incumple;
      datos["__umbral"] = umbral;
      if (Object.keys(datos).length > 1) registros.push({ hoja: "Oportunidad de citas (Res. 1552)", datos });
    }
  }
  return { registros, pct: tot ? round((cumple / tot) * 100) : null, _cumple: cumple, _tot: tot };
}

// Alertas: una fila por alerta. % = alertas con resultado documentado / total.
export function parseAlertas(wb) {
  const registros = [];
  let gestion = 0, tot = 0;
  for (const sn of wb.SheetNames) {
    const rows = aoa(wb.Sheets[sn]);
    const hr = headerRow(rows, "alerta-identificada");
    const H = (rows[hr] || []).map(clean);
    const col = (re) => H.findIndex((h) => re.test(h));
    const cFe = col(/fecha/i), cRu = col(/ruta/i), cFu = col(/fuente/i), cRi = col(/riesgo/i),
      cPr = col(/profesional/i), cAc = col(/acci[oó]n/i), cRe = col(/resultado/i);
    for (let r = hr + 1; r < rows.length; r++) {
      const alerta = clean(rows[r][0]);
      if (!alerta) continue;
      const accion = cAc >= 0 ? clean(rows[r][cAc]) : "";
      const resultado = cRe >= 0 ? clean(rows[r][cRe]) : "";
      const gest = resultado.length > 1;
      tot++; if (gest) gestion++;
      registros.push({
        hoja: sn,
        datos: {
          Alerta: alerta.slice(0, 150),
          Fecha: cFe >= 0 ? clean(rows[r][cFe]) : "",
          Ruta: cRu >= 0 ? clean(rows[r][cRu]) : "",
          Fuente: cFu >= 0 ? clean(rows[r][cFu]) : "",
          Riesgo: cRi >= 0 ? clean(rows[r][cRi]) : "",
          Profesional: cPr >= 0 ? clean(rows[r][cPr]) : "",
          "Acción realizada": accion.slice(0, 220),
          "Resultado obtenido": resultado.slice(0, 220),
          Estado: gest ? "Gestionada" : "En gestión",
        },
      });
    }
  }
  return { registros, pct: tot ? round((gestion / tot) * 100) : null, _gest: gestion, _tot: tot };
}

// Equipos biomédicos: la nota de cada servicio es su fila "Ponderado".
// % del componente = promedio de esas notas.
export function parseBiomedica(wb) {
  const sheet = wb.SheetNames.find((s) => /diagn/i.test(s)) || wb.SheetNames[0];
  const rows = aoa(wb.Sheets[sheet]);
  const hr = headerRow(rows, "servicio");
  const H = (rows[hr] || []).map((c) => clean(c).toLowerCase());
  const ci = (re, def) => { const i = H.findIndex((h) => re.test(h)); return i >= 0 ? i : def; };
  const cServ = ci(/servicio/, 2), cCrit = ci(/criterio/, 3), cCump = ci(/cumplimiento/, 4),
    cCal = ci(/calificaci/, 6), cSem = ci(/sem[aá]foro/, 8), cHall = ci(/hallazgo/, 9), cAcc = ci(/acci/, 10);
  const registros = [];
  const scores = [];
  let cur = null;
  const cerrar = () => {
    if (!cur) return;
    if (cur.score != null) scores.push(cur.score);
    const datos = { Servicio: cur.serv, Calificación: (cur.score ?? 0) + "%" };
    if (cur.sem) datos["Semáforo"] = cur.sem;
    if (cur.hall && !/^ninguno$/i.test(cur.hall)) datos["Hallazgo"] = cur.hall;
    if (cur.acc && !/^ninguno$/i.test(cur.acc)) datos["Acción correctiva"] = cur.acc;
    if (cur.crit.length) datos["__aspectos"] = cur.crit;
    registros.push({ hoja: "Equipos biomédicos", datos });
    cur = null;
  };
  for (let r = hr + 1; r < rows.length; r++) {
    const serv = clean(rows[r][cServ]);
    const crit = clean(rows[r][cCrit]);
    if (serv) {
      cerrar();
      cur = { serv, score: num(clean(rows[r][cCal])), sem: clean(rows[r][cSem]), hall: clean(rows[r][cHall]), acc: clean(rows[r][cAcc]), crit: [] };
    }
    if (!cur) continue;
    if (/ponderado/i.test(crit)) { const v = num(clean(rows[r][cCump])); if (v != null) cur.score = v; }
    else if (crit) {
      const mx = (crit.match(/\((\d+(?:\.\d+)?)\)/) || [])[1];
      const val = num(clean(rows[r][cCump]));
      const max = mx ? Number(mx) : null;
      const marca = val == null ? "" : max && val >= max ? "CUMPLE" : "NO CUMPLE";
      cur.crit.push({ a: crit, r: marca, p: val != null ? String(val) : "" });
    }
  }
  cerrar();
  return { registros, pct: scores.length ? round(avg(scores)) : null };
}

// Canalización: un solo archivo con todas las EPS (por eso necesita saber cuál es).
// % = efectivos / canalizados.
const ALIAS_CANALIZACION = {
  compensar: /compensar/i,
  famisanar: /famisanar/i,
  "salud-total": /salud\s*total/i,
  sanitas: /sanitas/i,
  sura: /^sura|[^a-z]sura/i,
  "nueva-eps": /nueva\s*eps/i,
  cosalud: /coosalud|cosalud/i,
  magisterio: /servisalud|magisterio|fomag/i,
};

export function parseCanalizacion(wb, epsId) {
  const rows = aoa(wb.Sheets[wb.SheetNames[0]]);
  // Fila 0: nombres de riesgo (combinados); fila 1: CANALIZADOS/EFECTIVOS.
  const riesgos = [];
  const f0 = (rows[0] || []).map(clean);
  const f1 = (rows[1] || []).map(clean);
  let actual = "";
  for (let j = 1; j < f1.length; j++) {
    if (f0[j]) actual = f0[j];
    if (/CANALIZADOS/i.test(f1[j])) riesgos.push({ nombre: actual, cCan: j, cEfe: j + 1 });
  }
  const re = ALIAS_CANALIZACION[epsId];
  if (!re) return { registros: [], pct: null };
  const fila = rows.find((r, i) => i > 1 && re.test(clean(r[0])) && !/^total$/i.test(clean(r[0])));
  if (!fila) return { registros: [], pct: null };

  const registros = [];
  let totCan = 0, totEfe = 0;
  for (const r of riesgos) {
    const can = num(clean(fila[r.cCan])) ?? 0;
    const efe = num(clean(fila[r.cEfe])) ?? 0;
    if (!can && !efe) continue;
    totCan += can;
    totEfe += efe;
    const pctR = can ? Math.min(round((efe / can) * 100), 100) : 0;
    registros.push({
      hoja: "Canalización efectiva",
      datos: {
        Riesgo: r.nombre || "—",
        Canalizados: String(can),
        Efectivos: String(efe),
        Cumplimiento: pctR + "%",
        Resultado: efe > 0 ? (pctR >= 50 ? "Efectivo" : "Parcialmente efectivo") : "No efectivo",
      },
    });
  }
  return { registros, pct: totCan ? round((totEfe / totCan) * 100) : null, _canalizados: totCan, _efectivos: totEfe };
}

// Plan de Mejora (no da %). Marca cada hallazgo como Efectivo / No efectivo / En seguimiento
// según las columnas Cumplió / No cumplió (gana el seguimiento más reciente).
export function parsePlanMejora(wb) {
  const registros = [];
  let efectivos = 0, noEfectivos = 0, enSeguimiento = 0;
  for (const sn of wb.SheetNames) {
    const rows = aoa(wb.Sheets[sn]);
    const hr = headerRow(rows, "descripción del hallazgo");
    const H = (rows[hr] || []).map((c) => clean(c).toUpperCase());
    const idx = (re, desde = 0) => { for (let j = desde; j < H.length; j++) if (re.test(H[j])) return j; return -1; };
    const cRuta = idx(/RUTA|PROGRAMA/), cDesc = idx(/DESCRIPCI.N DEL HALLAZGO/), cFecha = idx(/FECHA DEL HALLAZGO/);
    const cAccion = idx(/ACCION DE MEJORAMIENTO/), cResp = idx(/RESPONSABLE DE LA ACCI/);
    // seguimiento 1 y 2: cada uno con su par CUMPLIO / NO CUMPLIO
    const cCum1 = idx(/^CUMPLIO$/), cNo1 = idx(/^NO:?\s*CUMPLIO$/);
    const cCum2 = idx(/^CUMPLIO$/, cCum1 + 1), cNo2 = idx(/^NO:?\s*CUMPLIO$/, cNo1 + 1);
    const cObs1 = idx(/OBSEVACION|OBSERVACION - SEGUIMIENTO 1/), cObs2 = idx(/OBSERVACIONES - SEGUIMIENTO 2/);
    const cCierre = idx(/FECHA DE CIERRE/);
    if (cDesc < 0) continue;

    const marcado = (v) => { const t = clean(v).toUpperCase(); return t === "1" || t === "X" || t === "SI" || t === "SÍ" || t === "✓"; };
    for (let r = hr + 1; r < rows.length; r++) {
      const desc = clean(rows[r][cDesc]);
      if (!desc) continue;
      // el seguimiento más reciente con marca define el resultado
      const c2 = cCum2 >= 0 && marcado(rows[r][cCum2]), n2 = cNo2 >= 0 && marcado(rows[r][cNo2]);
      const c1 = cCum1 >= 0 && marcado(rows[r][cCum1]), n1 = cNo1 >= 0 && marcado(rows[r][cNo1]);
      let resultado = "En seguimiento";
      if (c2 || (!n2 && c1)) resultado = "Efectivo";
      else if (n2 || n1) resultado = "No efectivo";
      if (resultado === "Efectivo") efectivos++;
      else if (resultado === "No efectivo") noEfectivos++;
      else enSeguimiento++;

      const datos = { Ruta: cRuta >= 0 ? clean(rows[r][cRuta]) : "", "Descripción del hallazgo": desc.slice(0, 300), Resultado: resultado };
      if (cFecha >= 0 && clean(rows[r][cFecha])) datos["Fecha del hallazgo"] = clean(rows[r][cFecha]);
      if (cAccion >= 0 && clean(rows[r][cAccion])) datos["Acción de mejoramiento"] = clean(rows[r][cAccion]).slice(0, 300);
      if (cResp >= 0 && clean(rows[r][cResp])) datos["Responsable"] = clean(rows[r][cResp]).slice(0, 120);
      const obs = [cObs1 >= 0 ? clean(rows[r][cObs1]) : "", cObs2 >= 0 ? clean(rows[r][cObs2]) : ""].filter(Boolean).join(" · ");
      if (obs) datos["Observación del seguimiento"] = obs.slice(0, 300);
      if (cCierre >= 0 && clean(rows[r][cCierre])) datos["Fecha de cierre"] = clean(rows[r][cCierre]);
      registros.push({ hoja: sn, datos });
    }
  }
  // Es un módulo: no devuelve %, sino el conteo Efectivo/No efectivo.
  return { registros, pct: null, _efectivos: efectivos, _noEfectivos: noEfectivos, _enSeguimiento: enSeguimiento };
}

export function parseFile(tipo, wb, opts = {}) {
  if (tipo === "canalizacion") return parseCanalizacion(wb, opts.eps);
  if (tipo === "plan_mejora") return parsePlanMejora(wb);
  if (tipo === "biomedica") return parseBiomedica(wb);
  if (tipo === "indicadores") return parseGenerico(wb, "nombre del indicador", /cumplimiento/i);
  if (tipo === "anexos") return parseAnexos(wb);
  if (tipo === "adherencia_hc") return parseHistorias(wb);
  if (tipo === "medicamentos") return parseMedicamentos(wb);
  if (tipo === "laboratorios") return parseLaboratorios(wb);
  if (tipo === "capacidad") return parseCapacidad(wb);
  if (tipo === "oportunidad") return parseOportunidad(wb);
  if (tipo === "alertas") return parseAlertas(wb);
  return { registros: [], pct: null };
}
