import { FadeIn } from "@/components/dashboard-bits";
import { BotonInduccion } from "@/components/boton-induccion";
import { LeyendaSemaforo } from "@/components/semaforo";
import { ExcelViewer } from "@/components/excel-viewer";
import {
  Compass,
  LayoutGrid,
  Building2,
  CloudUpload,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  MapPin,
  Gauge,
  HelpCircle,
  FileText,
  Download,
} from "lucide-react";

export const metadata = { title: "Manual · RIAS Zipaquirá" };

const PRIMEROS_PASOS = [
  "Entra al Dashboard para ver el resumen del municipio.",
  "Abre Prestadores y entra a una EPS (Famisanar o Nueva EPS) para ver su detalle.",
  "Para subir información, ve a Cargar y sube el ZIP o la carpeta del prestador.",
  "Revisa la tabla de archivos analizados y pulsa Guardar.",
  "Cuando lleguen archivos corregidos, vuelve a Cargar y marca “Reemplazar lo ya analizado”.",
];

const SECCIONES: { icon: typeof Compass; t: string; items: string[] }[] = [
  {
    icon: LayoutGrid,
    t: "La barra superior (menú)",
    items: [
      "Inicio: presentación de la plataforma y del RIAS.",
      "Dashboard: resumen de todos los prestadores.",
      "Prestadores: la lista; cada EPS por separado.",
      "Cargar: subir o actualizar archivos.",
      "Manual: esta guía. Botón “Inducción”: vuelve a abrir el tour.",
    ],
  },
  {
    icon: Gauge,
    t: "El Dashboard",
    items: [
      "Índice promedio del municipio, con su color de semáforo.",
      "Cuántos prestadores están en cada nivel (satisfactorio, aceptable, crítico).",
      "Gráficas: cumplimiento por componente, distribución y barras por EPS.",
      "Tarjetas de prestadores: haz clic para entrar a una EPS.",
    ],
  },
  {
    icon: Building2,
    t: "La página de cada EPS",
    items: [
      "Arriba: el índice integral y las 7 tarjetas de componente.",
      "Si un componente trae registros pero no porcentaje, muestra el conteo (ej. “89 hallazgos”).",
      "Si no hay archivo de ese componente, muestra “Sin dato”.",
      "Abajo: el detalle por documento, agrupado por curso de vida.",
    ],
  },
  {
    icon: MapPin,
    t: "Agrupación por curso de vida",
    items: [
      "Cada sección grande es una etapa: preconcepción, control prenatal, planificación, lactancia, primera infancia, infancia, adolescencia, juventud, adultez, vejez, y anexos (salud oral, mental, cáncer).",
      "Haz clic en el título de la etapa para abrir o cerrar.",
      "Cada dato es una tarjeta (no una tabla): nombre, porcentaje con color, y detalles.",
      "En Adherencia, cada paciente muestra edad, sexo y “Ver detalle de aspectos” (cumple/no cumple).",
    ],
  },
  {
    icon: CloudUpload,
    t: "Cargar datos",
    items: [
      "Tres formas: subir un ZIP, una carpeta completa, o varios archivos sueltos.",
      "La plataforma lee todos los Excel y sus hojas, y detecta a qué EPS pertenecen.",
      "Marca como “Ya analizado” lo que ya estaba cargado, para no repetir.",
      "Puedes corregir la EPS o el tipo en cualquier fila antes de guardar.",
    ],
  },
  {
    icon: RefreshCw,
    t: "Actualizar (volver a subir)",
    items: [
      "Marca “Reemplazar lo ya analizado” en Cargar: reemplaza los datos anteriores de esa EPS y tipo.",
      "También desde la página de la EPS, con el botón “Actualizar datos”.",
    ],
  },
  {
    icon: PlusCircle,
    t: "Agregar una EPS nueva",
    items: [
      "Pulsa “Nueva EPS” (arriba a la derecha).",
      "Escribe el nombre de la EPS y su IPS primaria; marca “régimen especial” si aplica.",
      "Guarda: la EPS queda lista para cargarle archivos.",
    ],
  },
  {
    icon: FileSpreadsheet,
    t: "Qué datos se analizan (y de qué Excel)",
    items: [
      "Historias clínicas → Adherencia: documento, edad, sexo y CUMPLE/NO CUMPLE por aspecto.",
      "Indicadores trazadores → Indicadores: indicador, numerador, denominador, % y análisis.",
      "Anexos / listas de chequeo → Anexos: aspecto y % de cumplimiento.",
      "Matriz de dotación → Biomédica: servicio, criterio, % y riesgo.",
      "Plan de mejora → Plan: hallazgos, causas, acciones y responsables.",
    ],
  },
  {
    icon: HelpCircle,
    t: "Cómo se mide el índice",
    items: [
      "El índice pondera solo los componentes que traen porcentaje en el Excel, y se normaliza entre ellos.",
      "Historias: % = cumple / (cumple + no cumple). Indicadores, anexos y biomédica: promedio del % del Excel.",
      "La plataforma respeta los datos: no inventa porcentajes.",
    ],
  },
];

export default function Manual() {
  return (
    <div className="mx-auto max-w-[1000px] px-5 py-8 sm:px-8">
      <FadeIn>
        <section data-tour="manual" className="overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-rias-azul to-rias-azul2 px-7 py-8 text-white shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-white/80">
            <Compass className="h-5 w-5" />
            <span className="text-sm font-semibold">Guía de uso</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold">Manual de la Plataforma RIAS</h1>
          <p className="mt-2 max-w-2xl text-white/85">
            Todo lo que necesitas saber: qué muestra cada pantalla, dónde está cada dato, cómo se mide y cómo cargar
            o actualizar la información. ¿Primera vez? Inicia el recorrido guiado.
          </p>
          <div className="mt-5">
            <BotonInduccion />
          </div>
        </section>
      </FadeIn>

      {/* Manual metodológico (PDF oficial) */}
      <FadeIn>
        <section className="rias-card mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6efff] text-rias-azul2">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-rias-azul">Manual metodológico oficial</h2>
                <p className="text-xs text-rias-tenue">
                  Seguimiento a la implementación de las RIAS · Secretaría de Salud de Zipaquirá
                </p>
              </div>
            </div>
            <a
              href="/manual-rias.pdf"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-rias-azul px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rias-azul2"
            >
              <Download className="h-4 w-4" /> Descargar PDF
            </a>
          </div>
          <object data="/manual-rias.pdf#view=FitH" type="application/pdf" className="mt-4 h-[80vh] w-full rounded-xl border border-rias-borde">
            <p className="p-4 text-sm text-rias-tenue">
              Tu navegador no puede mostrar el PDF.{" "}
              <a href="/manual-rias.pdf" className="font-bold text-rias-azul2 underline">
                Ábrelo aquí
              </a>
              .
            </p>
          </object>
        </section>
      </FadeIn>

      {/* Manual e Instrumentos de la Estrategia RIAS */}
      <FadeIn>
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-rias-azul2" />
            <h2 className="text-lg font-bold text-rias-azul">Manual e Instrumentos de la Estrategia RIAS</h2>
          </div>
          <p className="mb-4 max-w-3xl text-sm text-rias-tenue">
            Formatos oficiales que diligencian los prestadores. Puedes verlos completos aquí o descargarlos para usarlos.
          </p>
          <div className="space-y-5">
            <ExcelViewer file="/instrumentos/adh-hx-clinica-rias-2026.xlsx" titulo="Adherencia a Historia Clínica 2026" descripcion="Formato original de evaluación de adherencia por curso de vida." />
            <ExcelViewer file="/instrumentos/anexos-rias-2026.xlsx" titulo="Anexos RIAS 2026" descripcion="Listas de chequeo (violencia sexual, ITS-VIH, cánceres, etc.)." />
            <ExcelViewer file="/instrumentos/formato-plan-mejora-ips-rias.xlsx" titulo="Formato de Plan de Mejora IPS-RIAS" descripcion="Plantilla para registrar hallazgos, acciones y seguimiento." />
          </div>
        </section>
      </FadeIn>

      {/* Primeros pasos */}
      <FadeIn>
        <section className="rias-card mt-6 p-6">
          <h2 className="text-lg font-bold text-rias-azul">Primeros pasos</h2>
          <ol className="mt-4 space-y-3">
            {PRIMEROS_PASOS.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rias-azul text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-[15px] text-rias-texto">{p}</span>
              </li>
            ))}
          </ol>
        </section>
      </FadeIn>

      {/* Secciones */}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {SECCIONES.map((s, i) => {
          const Icon = s.icon;
          return (
            <FadeIn key={s.t} delay={(i % 2) * 0.05}>
              <div className="rias-card h-full p-6">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6efff] text-rias-azul2">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="text-base font-bold text-rias-azul">{s.t}</h2>
                </div>
                <ul className="mt-3 space-y-2">
                  {s.items.map((it, j) => (
                    <li key={j} className="flex gap-2 text-sm leading-relaxed text-rias-texto">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rias-azul2" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          );
        })}
      </div>

      {/* Semáforo */}
      <FadeIn>
        <section className="rias-card mt-6 p-6">
          <h2 className="text-lg font-bold text-rias-azul">El semáforo</h2>
          <p className="mt-1 text-sm text-rias-tenue">Cada porcentaje recibe un color según su nivel de cumplimiento:</p>
          <div className="mt-3">
            <LeyendaSemaforo />
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
