// Tipos del núcleo del parser (rias-core.mjs) para consumo desde TypeScript.
import type { WorkBook } from "xlsx";

export type RegistroRias = { hoja: string; datos: Record<string, string | number> };

export type ResultadoRias = {
  registros: RegistroRias[];
  pct: number | null;
  _cuenta?: Record<string, number>;
  _cumplidas?: number;
  _den?: number;
};

// Ejecuta el parser del componente `tipo` sobre el workbook y devuelve registros + %.
export function parseFile(tipo: string, wb: WorkBook): ResultadoRias;

export function clean(v: unknown): string;
export function num(v: unknown): number | null;
export function round(x: number): number;
