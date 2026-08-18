"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { parseFile } from "@/lib/excel/rias-core.mjs";
import { detectarTipos, TIPOS_DOCUMENTO, componenteDe, type TipoDocumento } from "@/lib/excel/specs";
import { detectarEpsDesdeRuta } from "@/lib/excel/eps-detect";
import { resumenCompacto, analizarConIA, ANALYZER_URL } from "@/lib/analisis";
import { SemaforoPill } from "@/components/semaforo";
import {
  FolderUp,
  FileArchive,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  CircleAlert,
  CircleSlash,
  Save,
  Layers,
} from "lucide-react";

type EpsOpcion = { id: string; eps: string; ips: string };
type Registro = { hoja: string; datos: Record<string, string | number> };

type Item = {
  key: string;
  path: string;
  nombre: string;
  epsId: string | null;
  tipo: TipoDocumento | null;
  hojas: number;
  filas: number;
  pct: number | null;
  registros: Registro[];
  estado: "nuevo" | "dup" | "sineps" | "sintipo" | "guardando" | "guardado" | "error";
  mensaje?: string;
};

const EXT_OK = /\.(xlsx|xlsm|xls|csv)$/i;

export function BatchUpload() {
  const [epsList, setEpsList] = useState<EpsOpcion[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [analizando, setAnalizando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [reemplazar, setReemplazar] = useState(true);
  const [progreso, setProgreso] = useState("");
  const folderRef = useRef<HTMLInputElement>(null);
  const wbs = useRef(new Map<string, XLSX.WorkBook>()); // workbook por archivo (para re-parsear al cambiar tipo)

  useEffect(() => {
    fetch("/api/eps")
      .then((r) => r.json())
      .then((d) => d?.ok && setEpsList(d.eps))
      .catch(() => {});
    if (folderRef.current) {
      folderRef.current.setAttribute("webkitdirectory", "");
      folderRef.current.setAttribute("directory", "");
    }
  }, []);

  async function recolectar(files: FileList): Promise<{ path: string; buffer: ArrayBuffer }[]> {
    const out: { path: string; buffer: ArrayBuffer }[] = [];
    for (const file of Array.from(files)) {
      if (file.name.toLowerCase().endsWith(".zip")) {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        for (const entry of Object.values(zip.files)) {
          if (entry.dir || !EXT_OK.test(entry.name)) continue;
          out.push({ path: entry.name, buffer: await entry.async("arraybuffer") });
        }
      } else if (EXT_OK.test(file.name)) {
        const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
        out.push({ path: rel || file.name, buffer: await file.arrayBuffer() });
      }
    }
    return out;
  }

  async function procesar(files: FileList | null) {
    if (!files || !files.length) return;
    setAnalizando(true);
    setItems([]);
    wbs.current.clear();
    setProgreso("Leyendo archivos…");
    try {
      const archivos = await recolectar(files);
      const existentes = new Set<string>();
      try {
        const r = await fetch("/api/cargas");
        const d = await r.json();
        (d?.cargas ?? []).forEach((c: { eps_id: string; tipo_documento: string }) =>
          existentes.add(`${c.eps_id}|${c.tipo_documento}`),
        );
      } catch {}

      const nuevos: Item[] = [];
      for (let i = 0; i < archivos.length; i++) {
        const a = archivos[i];
        const nombre = a.path.split("/").pop() || a.path;
        setProgreso(`Analizando ${i + 1} de ${archivos.length}: ${nombre}`);
        const epsId = detectarEpsDesdeRuta(a.path);
        let wb: XLSX.WorkBook;
        try {
          wb = XLSX.read(a.buffer, { type: "array", cellDates: true });
        } catch (e) {
          nuevos.push({ key: a.path + i, path: a.path, nombre, epsId, tipo: null, hojas: 0, filas: 0, pct: null, registros: [], estado: "error", mensaje: e instanceof Error ? e.message : "No se pudo leer" });
          continue;
        }
        wbs.current.set(a.path, wb);
        const tipos = detectarTipos(nombre);
        const lista: (TipoDocumento | null)[] = tipos.length ? tipos : [null];
        for (const tipo of lista) {
          let filas = 0, pct: number | null = null, registros: Registro[] = [];
          if (tipo) {
            const res = parseFile(tipo, wb, { eps: epsId });
            registros = res.registros as Registro[];
            filas = registros.length;
            pct = res.pct;
          }
          const estado: Item["estado"] = !epsId ? "sineps" : !tipo ? "sintipo" : existentes.has(`${epsId}|${tipo}`) ? "dup" : "nuevo";
          nuevos.push({ key: a.path + i + (tipo ?? "?"), path: a.path, nombre, epsId, tipo, hojas: wb.SheetNames.length, filas, pct, registros, estado });
        }
      }
      setItems(nuevos);
    } finally {
      setAnalizando(false);
      setProgreso("");
    }
  }

  // Re-parsea con el parser REAL cuando el usuario corrige el tipo.
  function cambiarTipo(key: string, path: string, tipo: TipoDocumento | null) {
    const wb = wbs.current.get(path);
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        let filas = 0, pct: number | null = null, registros: Registro[] = [];
        if (wb && tipo) {
          const res = parseFile(tipo, wb, { eps: it.epsId });
          registros = res.registros as Registro[];
          filas = registros.length;
          pct = res.pct;
        }
        const estado: Item["estado"] = !it.epsId ? "sineps" : !tipo ? "sintipo" : "nuevo";
        return { ...it, tipo, filas, pct, registros, estado };
      }),
    );
  }

  // Al cambiar la EPS hay que re-parsear si el componente depende de ella (canalización,
  // cuyo archivo trae TODAS las EPS y se filtra por fila).
  function cambiarEps(key: string, epsId: string | null) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        let { filas, pct, registros } = it;
        const wb = wbs.current.get(it.path);
        if (wb && it.tipo === "canalizacion") {
          const res = parseFile(it.tipo, wb, { eps: epsId });
          registros = res.registros as Registro[];
          filas = registros.length;
          pct = res.pct;
        }
        const estado: Item["estado"] = !epsId ? "sineps" : !it.tipo ? "sintipo" : "nuevo";
        return { ...it, epsId, filas, pct, registros, estado };
      }),
    );
  }

  const guardables = items.filter(
    (it) => it.epsId && it.tipo && (it.estado === "nuevo" || (reemplazar && it.estado === "dup")),
  );

  async function guardarTodo() {
    setGuardando(true);
    const pendientes = guardables;
    for (let i = 0; i < pendientes.length; i++) {
      const it = pendientes[i];
      setProgreso(`Guardando ${i + 1} de ${pendientes.length}: ${it.nombre}`);
      setItems((prev) => prev.map((x) => (x.key === it.key ? { ...x, estado: "guardando" } : x)));
      try {
        const epsNombre = epsList.find((p) => p.id === it.epsId)?.eps ?? it.epsId ?? "";
        const muestra = resumenCompacto(it.tipo ?? "", it.registros);
        const analisis = muestra ? await analizarConIA(ANALYZER_URL, { tipo: it.tipo ?? "", eps: epsNombre, muestra }) : null;
        // Carga por LOTES de 400 filas (evita el 413 de Vercel).
        const CHUNK = 400;
        const regs = it.registros;
        const res = await fetch("/api/cargas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            epsId: it.epsId,
            tipo: it.tipo,
            modoUsado: "web",
            archivo: it.nombre,
            totalFilas: it.filas,
            porcentaje: it.pct,
            componente: componenteDe(it.tipo!),
            registros: regs.slice(0, CHUNK),
            reemplazar,
            analisis,
          }),
        });
        const d = await res.json();
        if (!res.ok || !d.ok) {
          setItems((prev) => prev.map((x) => (x.key === it.key ? { ...x, estado: "error", mensaje: d.error || `HTTP ${res.status}` } : x)));
          continue;
        }
        let okAll = true;
        for (let off = CHUNK; off < regs.length && d.cargaId; off += CHUNK) {
          const r2 = await fetch("/api/cargas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ append: true, cargaId: d.cargaId, epsId: it.epsId, tipo: it.tipo, registros: regs.slice(off, off + CHUNK) }),
          });
          const d2 = await r2.json();
          if (!r2.ok || !d2.ok) { okAll = false; setItems((prev) => prev.map((x) => (x.key === it.key ? { ...x, estado: "error", mensaje: d2.error || "Error en lote" } : x))); break; }
        }
        if (okAll) setItems((prev) => prev.map((x) => (x.key === it.key ? { ...x, estado: "guardado" } : x)));
      } catch (e) {
        setItems((prev) => prev.map((x) => (x.key === it.key ? { ...x, estado: "error", mensaje: e instanceof Error ? e.message : "Error" } : x)));
      }
    }
    setGuardando(false);
    setProgreso("");
  }

  const resumen = {
    total: items.length,
    nuevos: items.filter((i) => i.estado === "nuevo").length,
    dup: items.filter((i) => i.estado === "dup").length,
    sineps: items.filter((i) => i.estado === "sineps" || i.estado === "sintipo").length,
    guardados: items.filter((i) => i.estado === "guardado").length,
  };

  return (
    <div className="space-y-5">
      <div className="rias-card p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Boton icon={<FileArchive className="h-6 w-6" />} titulo="Subir un ZIP" sub="La carpeta comprimida de la EPS" onPick={(f) => procesar(f)} accept=".zip" />
          <Boton icon={<FolderUp className="h-6 w-6" />} titulo="Subir una carpeta" sub="Se analizan todos los Excel dentro" inputRef={folderRef} onPick={(f) => procesar(f)} />
          <Boton icon={<FileSpreadsheet className="h-6 w-6" />} titulo="Subir archivos" sub="Uno o varios .xlsx / .xlsm / .csv" multiple accept=".xlsx,.xlsm,.xls,.csv" onPick={(f) => procesar(f)} />
        </div>
        <p className="mt-3 text-xs text-rias-tenue">
          Se analizan con el <strong>mismo motor</strong> del sistema (detecta EPS, tipo y % igual que la carga oficial). El archivo de medicamentos y laboratorios alimenta ambos componentes.
        </p>
        {(analizando || guardando) && (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-rias-azul2">
            <Loader2 className="h-4 w-4 animate-spin" /> {progreso}
          </p>
        )}
      </div>

      {items.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat n={resumen.total} t="Filas de datos" tono="azul" />
            <Stat n={resumen.nuevos} t="Nuevos por guardar" tono="verde" />
            <Stat n={resumen.dup} t="Ya analizados" tono="tenue" />
            <Stat n={resumen.sineps} t="Falta EPS o tipo" tono="naranja" />
          </div>

          <div className="rias-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rias-borde px-5 py-3">
              <p className="flex items-center gap-2 font-bold text-rias-azul">
                <Layers className="h-4 w-4" /> Archivos analizados
              </p>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-rias-tenue">
                  <input type="checkbox" checked={reemplazar} onChange={(e) => setReemplazar(e.target.checked)} />
                  Reemplazar lo ya analizado
                </label>
                <button onClick={guardarTodo} disabled={guardando || guardables.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-rias-azul px-4 py-2 text-sm font-bold text-white transition enabled:hover:bg-rias-azul2 disabled:opacity-50">
                  {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar {guardables.length}
                </button>
              </div>
            </div>
            <div className="max-h-[30rem] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-rias-app">
                  <tr className="text-left text-rias-azul">
                    <th className="px-4 py-2 font-bold">Archivo</th>
                    <th className="px-3 py-2 font-bold">EPS / IPS</th>
                    <th className="px-3 py-2 font-bold">Componente</th>
                    <th className="px-3 py-2 font-bold">Filas</th>
                    <th className="px-3 py-2 font-bold">%</th>
                    <th className="px-3 py-2 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.key} className="border-t border-rias-borde align-middle">
                      <td className="max-w-[15rem] truncate px-4 py-2 text-rias-texto" title={it.path}>{it.nombre}</td>
                      <td className="px-3 py-2">
                        <select value={it.epsId ?? ""} onChange={(e) => cambiarEps(it.key, e.target.value || null)} className="max-w-[12rem] rounded-lg border border-rias-borde bg-white px-2 py-1 text-xs">
                          <option value="">— elegir —</option>
                          {epsList.map((p) => (
                            <option key={p.id} value={p.id}>{p.eps} · {p.ips}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={it.tipo ?? ""} onChange={(e) => cambiarTipo(it.key, it.path, (e.target.value || null) as TipoDocumento | null)} className="max-w-[12rem] rounded-lg border border-rias-borde bg-white px-2 py-1 text-xs">
                          <option value="">— sin clasificar —</option>
                          {TIPOS_DOCUMENTO.map((t) => (
                            <option key={t.tipo} value={t.tipo}>{t.titulo}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-rias-tenue">{it.filas}</td>
                      <td className="px-3 py-2">{it.pct !== null ? <SemaforoPill valor={it.pct} /> : "—"}</td>
                      <td className="px-3 py-2"><Estado it={it} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {resumen.guardados > 0 && (
            <p className="flex items-center gap-2 rounded-2xl border border-[#bfe6cf] bg-[#e7f6ec] px-4 py-3 text-sm font-semibold text-[#157f3a]">
              <CheckCircle2 className="h-4 w-4" /> {resumen.guardados} componente(s) guardado(s). Revisa el dashboard y la sección de cada EPS.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Boton({ icon, titulo, sub, onPick, accept, multiple, inputRef }: { icon: React.ReactNode; titulo: string; sub: string; onPick: (f: FileList | null) => void; accept?: string; multiple?: boolean; inputRef?: React.RefObject<HTMLInputElement | null> }) {
  return (
    <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-rias-borde bg-rias-app px-4 py-6 text-center transition hover:border-rias-azul2 hover:bg-white">
      <span className="text-rias-azul2">{icon}</span>
      <span className="text-sm font-bold text-rias-azul">{titulo}</span>
      <span className="text-xs text-rias-tenue">{sub}</span>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => onPick(e.target.files)} />
    </label>
  );
}

function Stat({ n, t, tono }: { n: number; t: string; tono: "azul" | "verde" | "naranja" | "tenue" }) {
  const color = tono === "verde" ? "#157f3a" : tono === "naranja" ? "#bd470f" : tono === "tenue" ? "#5b6b78" : "#1f5fd0";
  return (
    <div className="rias-card p-4">
      <p className="text-3xl font-extrabold" style={{ color }}>{n}</p>
      <p className="text-xs font-medium text-rias-tenue">{t}</p>
    </div>
  );
}

function Estado({ it }: { it: Item }) {
  const map = {
    nuevo: { t: "Nuevo", c: "#1f5fd0", bg: "#e6efff", I: CheckCircle2 },
    dup: { t: "Ya analizado", c: "#5b6b78", bg: "#eef2f5", I: CircleSlash },
    sineps: { t: "Falta EPS", c: "#bd470f", bg: "#fde9dd", I: CircleAlert },
    sintipo: { t: "Falta tipo", c: "#bd470f", bg: "#fde9dd", I: CircleAlert },
    guardando: { t: "Guardando…", c: "#1f5fd0", bg: "#e6efff", I: Loader2 },
    guardado: { t: "Guardado", c: "#157f3a", bg: "#e7f6ec", I: CheckCircle2 },
    error: { t: "Error", c: "#b91c1c", bg: "#fbe3e3", I: CircleAlert },
  } as const;
  const e = map[it.estado];
  const I = e.I;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: e.bg, color: e.c }} title={it.mensaje}>
      <I className={`h-3.5 w-3.5 ${it.estado === "guardando" ? "animate-spin" : ""}`} /> {e.t}
    </span>
  );
}
