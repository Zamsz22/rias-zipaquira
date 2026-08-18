"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Download, Loader2, AlertTriangle } from "lucide-react";

type Celda = { v: string; rs: number; cs: number };
type Hoja = { nombre: string; grid: (Celda | null)[][]; nCols: number; nRows: number };

// Construye una hoja RESPETANDO las celdas combinadas (merges) para que se vea como el Excel.
function construirHoja(nombre: string, ws: XLSX.WorkSheet): Hoja {
  const ref = ws["!ref"];
  if (!ref) return { nombre, grid: [], nCols: 0, nRows: 0 };
  const range = XLSX.utils.decode_range(ref);
  const merges = ws["!merges"] ?? [];
  const cover = new Set<string>();
  const spanAt = new Map<string, { rs: number; cs: number }>();
  for (const m of merges) {
    spanAt.set(`${m.s.r}:${m.s.c}`, { rs: m.e.r - m.s.r + 1, cs: m.e.c - m.s.c + 1 });
    for (let r = m.s.r; r <= m.e.r; r++) for (let c = m.s.c; c <= m.e.c; c++) if (!(r === m.s.r && c === m.s.c)) cover.add(`${r}:${c}`);
  }
  const cellStr = (r: number, c: number) => {
    const cell = ws[XLSX.utils.encode_cell({ r, c })] as { w?: string; v?: unknown } | undefined;
    return cell ? String(cell.w ?? cell.v ?? "").replace(/\s+/g, " ").trim() : "";
  };
  // Recorta filas/columnas vacías al final.
  let maxR = range.s.r, maxC = range.s.c;
  for (let r = range.s.r; r <= range.e.r; r++) for (let c = range.s.c; c <= range.e.c; c++) {
    if (cellStr(r, c)) { if (r > maxR) maxR = r; if (c > maxC) maxC = c; }
  }
  maxC = Math.min(maxC, range.s.c + 40);
  const grid: (Celda | null)[][] = [];
  for (let r = range.s.r; r <= maxR; r++) {
    const row: (Celda | null)[] = [];
    for (let c = range.s.c; c <= maxC; c++) {
      if (cover.has(`${r}:${c}`)) { row.push(null); continue; }
      const span = spanAt.get(`${r}:${c}`);
      row.push({ v: cellStr(r, c), rs: span?.rs ?? 1, cs: span?.cs ?? 1 });
    }
    grid.push(row);
  }
  return { nombre, grid, nCols: maxC - range.s.c + 1, nRows: maxR - range.s.r + 1 };
}

const esCabecera = (cel: Celda, r: number) =>
  r === 0 ||
  (cel.cs > 1 && cel.v.length < 70 && cel.v === cel.v.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(cel.v));

// Visor que muestra un Excel COMPLETO en el navegador: pestañas por hoja + tabla con combinaciones.
export function ExcelViewer({ file, titulo, descripcion }: { file: string; titulo: string; descripcion?: string }) {
  const [hojas, setHojas] = useState<Hoja[] | null>(null);
  const [activa, setActiva] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const buf = await (await fetch(file)).arrayBuffer();
        const wb = XLSX.read(buf, { type: "array", cellDates: true });
        const hs = wb.SheetNames.map((sn) => construirHoja(sn, wb.Sheets[sn]));
        if (vivo) setHojas(hs);
      } catch {
        if (vivo) setError("No se pudo abrir el archivo.");
      }
    })();
    return () => { vivo = false; };
  }, [file]);

  const h = hojas?.[activa];

  return (
    <div className="rias-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rias-borde px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f6ec] text-[#157f3a]">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-rias-azul">{titulo}</p>
            {descripcion && <p className="text-xs text-rias-tenue">{descripcion}</p>}
          </div>
        </div>
        <a href={file} download className="inline-flex items-center gap-1.5 rounded-xl border border-rias-borde bg-white px-3 py-1.5 text-xs font-bold text-rias-azul transition hover:bg-rias-app">
          <Download className="h-4 w-4 text-rias-azul2" /> Descargar
        </a>
      </div>

      {error ? (
        <p className="flex items-center gap-2 p-5 text-sm text-rias-rojo"><AlertTriangle className="h-4 w-4" /> {error}</p>
      ) : !hojas ? (
        <p className="flex items-center gap-2 p-5 text-sm text-rias-tenue"><Loader2 className="h-4 w-4 animate-spin" /> Cargando instrumento…</p>
      ) : (
        <>
          {hojas.length > 1 && (
            <div className="flex flex-wrap gap-1.5 border-b border-rias-borde px-4 py-2.5">
              {hojas.map((hh, i) => (
                <button
                  key={hh.nombre + i}
                  onClick={() => setActiva(i)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${i === activa ? "bg-rias-azul text-white" : "bg-rias-app text-rias-tenue hover:text-rias-azul"}`}
                >
                  {hh.nombre}
                </button>
              ))}
            </div>
          )}
          <div className="max-h-[72vh] overflow-auto">
            <table className="border-collapse text-xs">
              <tbody>
                {h?.grid.map((fila, r) => (
                  <tr key={r}>
                    {fila.map((cel, c) => {
                      if (!cel) return null;
                      const cab = esCabecera(cel, r);
                      return (
                        <td
                          key={c}
                          rowSpan={cel.rs}
                          colSpan={cel.cs}
                          className={`min-w-[7rem] max-w-[24rem] border border-rias-borde px-2 py-1 align-top ${cab ? "bg-rias-app text-center font-bold text-rias-azul" : "text-rias-texto"}`}
                          title={cel.v}
                        >
                          <div className="whitespace-pre-wrap break-words">{cel.v}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-rias-borde px-4 py-2 text-[11px] text-rias-tenue">
            {h?.nRows ?? 0} filas · {h?.nCols ?? 0} columnas{hojas.length > 1 ? ` · ${hojas.length} hojas` : ""} · respeta celdas combinadas
          </p>
        </>
      )}
    </div>
  );
}
