// Arma el informe de un prestador: reúne sus resultados, el plan de mejora y el análisis,
// y redacta una interpretación por componente, resumen, fortalezas, riesgos y recomendaciones.
// No recalcula ni inventa cifras: usa lo que ya está cargado.

import type { Resultado, RegistroFila } from "@/lib/data";
import type { AnalisisIA } from "@/lib/analisis";
import { COMPONENTES_META, clasificar, type Componente, type Semaforo, type NivelSemaforo } from "@/lib/scoring";

export type Corte = "mensual" | "trimestral" | "anual" | "personalizado";

export type CompInforme = {
  comp: Componente;
  nombre: string;
  peso: number;
  valor: number | null;
  conteo: number;
  semaforo: Semaforo | null;
  interpretacion: string;
  fortaleza: string;
  oportunidad: string;
  ia?: AnalisisIA;
};

export type InformeModel = {
  eps: string;
  ips: string;
  corteLabel: string;
  periodo: string;
  fechaGen: string;
  indice: number;
  semaforoGlobal: Semaforo;
  medidos: CompInforme[];
  sinMedir: { nombre: string; conteo: number }[];
  planMejora: { total: number; efectivo: number; no: number; seg: number; efectividad: number | null } | null;
  resumenGeneral: string;
  fortalezas: string[];
  riesgos: string[];
  recomendaciones: string[];
  mensajeFinal: string;
  // Análisis que genera la IA; puede faltar si la IA no respondió a tiempo.
  iaResumen?: string;
  iaHallazgos?: string[];
  iaAlertas?: string[];
};

// Resumen corto y exacto de todo el prestador, para enviárselo a la IA.
export function muestraInforme(resultado: Resultado, registros: RegistroFila[]): string {
  const L: string[] = [];
  L.push(`Índice integral de implementación de la RIAS: ${resultado.indice}% (${clasificar(resultado.indice).etiqueta}).`);
  L.push("Componentes evaluados (valor% · peso en el índice · registros):");
  for (const c of resultado.medidos) {
    const v = resultado.componentes[c]!;
    L.push(`- ${COMPONENTES_META[c].nombre}: ${v}% · peso ${COMPONENTES_META[c].peso}% · ${resultado.conteos[c] ?? 0} registros (${clasificar(v).etiqueta}).`);
  }
  const sin = (Object.keys(COMPONENTES_META) as Componente[]).filter((c) => resultado.componentes[c] === null && (resultado.conteos[c] ?? 0) > 0);
  if (sin.length) L.push(`Con registros cargados pero sin porcentaje calculable: ${sin.map((c) => COMPONENTES_META[c].nombre).join(", ")}.`);
  const pm = registros.filter((r) => r.tipo === "plan_mejora");
  if (pm.length) {
    let ef = 0, no = 0, sg = 0;
    for (const r of pm) { const x = String(r.datos.Resultado ?? ""); if (x === "Efectivo") ef++; else if (x === "No efectivo") no++; else sg++; }
    L.push(`Plan de Mejora: ${pm.length} hallazgos (${ef} efectivos, ${no} no efectivos, ${sg} en seguimiento).`);
  }
  return L.join("\n");
}

const NIVEL_INTERP: Record<NivelSemaforo, string> = {
  satisfactorio: "cumple satisfactoriamente los lineamientos de la Ruta Integral de Atención en Salud. Los procesos están estandarizados y la información se registra de forma consistente.",
  aceptable: "alcanza un nivel de cumplimiento aceptable. Es una base adecuada, con oportunidades concretas para consolidar la adherencia total a la ruta.",
  critico: "presenta un cumplimiento crítico. Se identifican brechas que afectan la continuidad de la atención y requieren un plan de acción en el corto plazo.",
  "muy-critico": "presenta un cumplimiento muy crítico. Constituye una prioridad institucional inmediata, pues las brechas comprometen la implementación de la ruta.",
};

const oportunidadDe = (nivel: NivelSemaforo): string =>
  nivel === "satisfactorio"
    ? "Sostener el estándar alcanzado y documentar las buenas prácticas para replicarlas en otras rutas."
    : nivel === "aceptable"
    ? "Cerrar la brecha hacia el nivel satisfactorio reforzando el registro clínico y el seguimiento de casos."
    : "Priorizar acciones de mejora: capacitación del talento humano, auditoría concurrente y ajuste de los flujos de atención.";

const fortalezaDe = (valor: number, nivel: NivelSemaforo): string =>
  nivel === "satisfactorio" || nivel === "aceptable"
    ? `Con un ${valor}% de cumplimiento, el prestador demuestra una base operativa sólida que puede sostenerse y servir de referencia.`
    : "Haber medido este componente permite focalizar el esfuerzo institucional justo donde tendrá mayor impacto en la atención.";

// Nombre y período del corte (mensual, trimestral, etc.).
function metaCorte(corte: Corte, desde?: string, hasta?: string): { label: string; periodo: string } {
  const fmt = (d: Date) => d.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
  const hoy = hasta ? new Date(hasta + "T00:00:00") : new Date();
  if (corte === "personalizado" && desde) return { label: "Informe por corte personalizado", periodo: `${fmt(new Date(desde + "T00:00:00"))} — ${fmt(hoy)}` };
  if (corte === "anual") return { label: "Informe anual", periodo: `Año ${hoy.getFullYear()} · corte a ${fmt(hoy)}` };
  if (corte === "trimestral") { const t = Math.floor(hoy.getMonth() / 3) + 1; return { label: "Informe trimestral", periodo: `Trimestre ${t} de ${hoy.getFullYear()} · corte a ${fmt(hoy)}` }; }
  return { label: "Informe mensual", periodo: `${hoy.toLocaleDateString("es-CO", { month: "long", year: "numeric" })} · corte a ${fmt(hoy)}` };
}

export function construirInforme(
  resultado: Resultado,
  registros: RegistroFila[],
  analisis: Record<string, AnalisisIA>,
  corte: Corte,
  desde?: string,
  hasta?: string,
  iaGlobal?: AnalisisIA | null,
): InformeModel {
  const { label, periodo } = metaCorte(corte, desde, hasta);

  const medidos: CompInforme[] = resultado.medidos
    .map((comp) => {
      const valor = resultado.componentes[comp]!;
      const sem = clasificar(valor);
      const nombre = COMPONENTES_META[comp].nombre;
      return {
        comp,
        nombre,
        peso: COMPONENTES_META[comp].peso,
        valor,
        conteo: resultado.conteos[comp] ?? 0,
        semaforo: sem,
        interpretacion: `Con ${valor}% (peso ${COMPONENTES_META[comp].peso}% en el índice), el componente “${nombre}” ${NIVEL_INTERP[sem.nivel]}`,
        fortaleza: fortalezaDe(valor, sem.nivel),
        oportunidad: oportunidadDe(sem.nivel),
        ia: analisis[comp],
      };
    })
    .sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));

  // Componentes con registros cargados pero sin porcentaje calculable.
  const sinMedir = (Object.keys(COMPONENTES_META) as Componente[])
    .filter((c) => resultado.componentes[c] === null && (resultado.conteos[c] ?? 0) > 0)
    .map((c) => ({ nombre: COMPONENTES_META[c].nombre, conteo: resultado.conteos[c] }));

  // Módulo Plan de Mejora (indicador Efectivo/No efectivo).
  const pm = registros.filter((r) => r.tipo === "plan_mejora");
  let planMejora: InformeModel["planMejora"] = null;
  if (pm.length) {
    let efectivo = 0, no = 0, seg = 0;
    for (const r of pm) {
      const res = String(r.datos.Resultado ?? "");
      if (res === "Efectivo") efectivo++;
      else if (res === "No efectivo") no++;
      else seg++;
    }
    const cerrados = efectivo + no;
    planMejora = { total: pm.length, efectivo, no, seg, efectividad: cerrados ? Math.round((efectivo / cerrados) * 1000) / 10 : null };
  }

  const altos = medidos.filter((c) => c.semaforo!.nivel === "satisfactorio" || c.semaforo!.nivel === "aceptable");
  const bajos = medidos.filter((c) => c.semaforo!.nivel === "critico" || c.semaforo!.nivel === "muy-critico");
  const semaforoGlobal = clasificar(resultado.indice);

  const resumenGeneral =
    `${resultado.eps} (IPS ${resultado.ips}) presenta un índice integral de implementación de la RIAS del ${resultado.indice}%, ` +
    `clasificado como ${semaforoGlobal.etiqueta.toLowerCase()}. ` +
    (altos.length ? `Sus mayores fortalezas se ubican en ${listar(altos.map((c) => c.nombre))}. ` : "") +
    (bajos.length
      ? `Requiere atención prioritaria en ${listar(bajos.map((c) => c.nombre))}, donde se concentran las principales brechas de la ruta.`
      : "No se identifican componentes en nivel crítico, lo que refleja una implementación consolidada.");

  const recomendaciones = construirRecomendaciones(bajos, altos, planMejora);

  const mensajeFinal =
    (altos.length
      ? `El prestador cuenta con fortalezas claras en ${listar(altos.slice(0, 3).map((c) => c.nombre))}, que constituyen una base para sostener la mejora. `
      : "") +
    (bajos.length
      ? `Concentrar los esfuerzos en ${listar(bajos.slice(0, 3).map((c) => c.nombre))} permitirá elevar el índice integral en el próximo corte. `
      : "Mantener el estándar alcanzado y documentar las buenas prácticas asegurará la sostenibilidad de los resultados. ") +
    "La Secretaría de Salud de Zipaquirá acompañará el seguimiento a los planes de mejora acordados.";

  return {
    eps: resultado.eps,
    ips: resultado.ips,
    corteLabel: label,
    periodo,
    fechaGen: new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }),
    indice: resultado.indice,
    semaforoGlobal,
    medidos,
    sinMedir,
    planMejora,
    resumenGeneral,
    fortalezas: altos.map((c) => `${c.nombre} (${c.valor}%)`),
    riesgos: bajos.map((c) => `${c.nombre} (${c.valor}%)`),
    recomendaciones,
    mensajeFinal,
    iaResumen: iaGlobal?.resumen,
    iaHallazgos: iaGlobal?.hallazgos,
    iaAlertas: iaGlobal?.alertas,
  };
}

function construirRecomendaciones(
  bajos: CompInforme[],
  altos: CompInforme[],
  pm: InformeModel["planMejora"],
): string[] {
  const recs: string[] = [];
  for (const c of bajos.slice(0, 5)) {
    recs.push(
      `Fortalecer “${c.nombre}” (${c.valor}%): definir responsables, cronograma y auditoría concurrente para cerrar las brechas identificadas en la ruta.`,
    );
  }
  if (pm && pm.seg > 0) {
    recs.push(
      `Cerrar el seguimiento de los ${pm.seg} hallazgos del Plan de Mejora que siguen abiertos, verificando la efectividad de cada acción implementada.`,
    );
  }
  if (altos.length) {
    recs.push(
      `Documentar y replicar las buenas prácticas de ${listar(altos.slice(0, 2).map((c) => c.nombre))} en los componentes con menor cumplimiento.`,
    );
  }
  recs.push(
    "Mantener el registro clínico completo y oportuno como condición transversal para la medición confiable de todos los componentes.",
  );
  return recs;
}

function listar(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? "";
  return `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
}
