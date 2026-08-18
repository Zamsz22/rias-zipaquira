import { BatchUpload } from "@/components/batch-upload";
import { TIPOS_DOCUMENTO } from "@/lib/excel/specs";
import { UploadCloud, ShieldCheck, ScanSearch, FolderTree } from "lucide-react";

export const metadata = { title: "Cargar datos · RIAS Zipaquirá" };

export default function CargarPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8">
      <div className="flex items-center gap-2">
        <UploadCloud className="h-6 w-6 text-rias-azul2" />
        <h1 className="text-[26px] font-extrabold tracking-tight text-rias-azul">Cargar datos</h1>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-rias-tenue">
        Sube el ZIP o la carpeta del prestador y la plataforma lee todos los Excel y sus hojas, detecta a qué EPS
        pertenecen, evita repetir lo ya analizado y lo guarda. No modifica tus datos.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { I: FolderTree, t: "Lee todo el contenido", d: "Cada archivo y cada hoja del Excel (indicadores, planes, matrices, historias)." },
          { I: ScanSearch, t: "Detecta la EPS", d: "Reconoce Famisanar–Cafam y Nueva EPS–Clínica Chía por la carpeta." },
          { I: ShieldCheck, t: "Evita duplicados", d: "Marca lo que ya se había analizado para no cargarlo dos veces." },
        ].map(({ I, t, d }) => (
          <div key={t} className="rias-card flex gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e6efff] text-rias-azul2">
              <I className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-sm font-bold text-rias-azul">{t}</p>
              <p className="text-xs text-rias-tenue">{d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6" data-tour="cargar">
        <BatchUpload />
      </div>

      <p className="mt-6 text-xs text-rias-tenue">
        Tipos reconocidos: {TIPOS_DOCUMENTO.map((t) => t.titulo).join(" · ")}.
      </p>
    </div>
  );
}
