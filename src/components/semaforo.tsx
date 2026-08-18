import { clasificar, type Semaforo } from "@/lib/scoring";

// Punto SVG de semáforo (sin emojis).
export function SemaforoDot({ color, size = 11 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
      <circle cx="6" cy="6" r="5" fill={color} />
      <circle cx="6" cy="6" r="5" fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="2" />
    </svg>
  );
}

export function SemaforoPill({ valor, semaforo }: { valor?: number; semaforo?: Semaforo }) {
  const s = semaforo ?? (valor !== undefined ? clasificar(valor) : null);
  if (!s) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold"
      style={{ background: s.bg, color: s.texto }}
    >
      <SemaforoDot color={s.color} size={9} />
      {s.etiqueta}
      {valor !== undefined && <span className="opacity-70">· {valor.toFixed(1)}%</span>}
    </span>
  );
}

export function LeyendaSemaforo() {
  const items = [
    { v: 92, t: "Satisfactorio 85–100%" },
    { v: 77, t: "Aceptable 70–84%" },
    { v: 60, t: "Crítico 50–69%" },
    { v: 40, t: "Muy crítico ≤ 50%" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => {
        const s = clasificar(i.v);
        return (
          <span
            key={i.t}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold"
            style={{ background: s.bg, color: s.texto }}
          >
            <SemaforoDot color={s.color} size={9} /> {i.t}
          </span>
        );
      })}
    </div>
  );
}
