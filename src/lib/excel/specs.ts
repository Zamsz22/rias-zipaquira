// Cada tipo de documento es un componente evaluado (uno por Excel). Salen de scoring.ts,
// así que si se agrega o quita un componente, la sección de cargar se actualiza sola.

import { COMPONENTES_META, type Componente } from "@/lib/scoring";

// Los componentes puntuados, más el módulo de Plan de Mejora (que no da %).
export type TipoDocumento = Componente | "plan_mejora";

export type TipoInfo = { tipo: TipoDocumento; titulo: string };

// Lista para el <select> de tipo (se auto-actualiza con scoring.ts).
export const TIPOS_DOCUMENTO: TipoInfo[] = [
  ...(Object.keys(COMPONENTES_META) as Componente[]).map((c) => ({ tipo: c as TipoDocumento, titulo: COMPONENTES_META[c].nombre })),
  { tipo: "plan_mejora" as TipoDocumento, titulo: "Plan de Mejora RIAS (módulo)" },
];

// Cada tipo alimenta su componente homónimo; plan_mejora NO puntúa (módulo aparte).
export function componenteDe(tipo: TipoDocumento): Componente | null {
  return tipo === "plan_mejora" ? null : tipo;
}

// Pistas de NOMBRE DE ARCHIVO por componente.
const PISTAS: Record<TipoDocumento, RegExp> = {
  plan_mejora: /plan.*mejora/i,
  canalizacion: /canaliza/i,
  capacidad: /capacidad/i,
  oportunidad: /oportunida/i,
  biomedica: /dotacion|dotación|biomedic|matriz\s*r/i,
  indicadores: /indicador|trazador|sigeres|tablero.*control/i,
  anexos: /\banexos?\b/i,
  alertas: /alerta/i,
  adherencia_hc: /historia|adherencia|_hc\b/i,
  medicamentos: /medicamento|laboratorio/i,
  laboratorios: /medicamento|laboratorio/i,
};

// Orden de prioridad para desambiguar (lo más específico primero).
const ORDEN: TipoDocumento[] = [
  "plan_mejora",
  "canalizacion",
  "capacidad",
  "oportunidad",
  "biomedica",
  "indicadores",
  "anexos",
  "alertas",
  "adherencia_hc",
  "medicamentos",
];

// Detecta el/los tipo(s) del archivo por su nombre. El archivo de "medicamentos y laboratorios"
// alimenta AMBOS componentes, por eso devuelve un arreglo.
export function detectarTipos(nombreArchivo: string): TipoDocumento[] {
  const n = nombreArchivo.toLowerCase();
  for (const tipo of ORDEN) {
    if (PISTAS[tipo].test(n)) {
      return tipo === "medicamentos" ? ["medicamentos", "laboratorios"] : [tipo];
    }
  }
  return [];
}
