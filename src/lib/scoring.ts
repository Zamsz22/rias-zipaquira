// Colores del semáforo. La plataforma no recalcula: solo le pone color al porcentaje
// que ya trae el Excel, para mostrarlo igual en toda la página.

export type NivelSemaforo = "satisfactorio" | "aceptable" | "critico" | "muy-critico";

export type Semaforo = {
  nivel: NivelSemaforo;
  etiqueta: string;
  color: string; // color del token de diseño
  bg: string; // fondo suave para "pills"
  texto: string; // color de texto sobre el fondo suave
};

const SEMAFOROS: Record<NivelSemaforo, Omit<Semaforo, "nivel">> = {
  satisfactorio: { etiqueta: "Satisfactorio", color: "#16a34a", bg: "#e7f6ec", texto: "#157f3a" },
  aceptable: { etiqueta: "Aceptable", color: "#d97706", bg: "#fcefdc", texto: "#a55b06" },
  critico: { etiqueta: "Crítico", color: "#ea580c", bg: "#fde9dd", texto: "#bd470f" },
  "muy-critico": { etiqueta: "Muy crítico", color: "#dc2626", bg: "#fbe3e3", texto: "#b91c1c" },
};

// Rangos: Satisfactorio 85-100 · Aceptable 70-84 · Crítico 50-69 · Muy crítico <=50
export function clasificar(valorPct: number): Semaforo {
  let nivel: NivelSemaforo;
  if (valorPct >= 85) nivel = "satisfactorio";
  else if (valorPct >= 70) nivel = "aceptable";
  else if (valorPct >= 50) nivel = "critico";
  else nivel = "muy-critico";
  return { nivel, ...SEMAFOROS[nivel] };
}

// Peso de cada componente dentro del índice integral (los 10 suman 100%).
export const PESOS_COMPONENTES = {
  adherencia_hc: 0.2,
  indicadores: 0.2,
  anexos: 0.12,
  capacidad: 0.12,
  biomedica: 0.08,
  alertas: 0.08,
  // Canalización toma el 8% que antes tenía Plan de Mejora (ahora es un módulo aparte).
  canalizacion: 0.08,
  oportunidad: 0.06,
  medicamentos: 0.03,
  laboratorios: 0.03,
} as const;

export type Componente = keyof typeof PESOS_COMPONENTES;

export const COMPONENTES_META: Record<Componente, { nombre: string; peso: number }> = {
  adherencia_hc: { nombre: "Adherencia a historia clínica", peso: 20 },
  indicadores: { nombre: "Indicadores trazadores SIGERES", peso: 20 },
  anexos: { nombre: "Anexos / listas de chequeo RIAS", peso: 12 },
  capacidad: { nombre: "Capacidad instalada", peso: 12 },
  biomedica: { nombre: "Dotación y equipos biomédicos", peso: 8 },
  alertas: { nombre: "Alertas gestionadas desde RIAS", peso: 8 },
  canalizacion: { nombre: "Canalización efectiva", peso: 8 },
  oportunidad: { nombre: "Oportunidad de consultas que articulan RIAS", peso: 6 },
  medicamentos: { nombre: "Medicamentos RIAS vs GAUDI", peso: 3 },
  laboratorios: { nombre: "Laboratorios RIAS vs GAUDI", peso: 3 },
};

export function calcularIndice(valores: Partial<Record<Componente, number>>): number {
  let total = 0;
  for (const [k, peso] of Object.entries(PESOS_COMPONENTES) as [Componente, number][]) {
    total += (valores[k] ?? 0) * peso;
  }
  return Math.round(total * 10) / 10;
}
