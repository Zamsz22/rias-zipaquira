"use client";

import { useEffect, useRef, useState } from "react";

// Barra compacta que aparece al hacer scroll (cuando el encabezado grande sale de vista)
// para no tener que volver arriba a ver de qué EPS/IPS se trata.
export function EpsStickyHeader({ eps, ips, indice }: { eps: string; ips: string; indice?: number }) {
  const [show, setShow] = useState(false);
  const sentinela = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinela.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), {
      rootMargin: "-72px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* punto de referencia: cuando se va hacia arriba, mostramos la barra */}
      <div ref={sentinela} aria-hidden className="h-px w-full" />
      <div
        className={`fixed inset-x-0 top-[63px] z-20 border-b border-rias-borde bg-white/90 backdrop-blur transition-all duration-200 ${
          show ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-[1240px] items-center gap-2.5 px-5 py-2 sm:px-8">
          <span className="truncate text-sm font-extrabold text-rias-azul">{eps}</span>
          <span className="text-rias-borde">·</span>
          <span className="truncate text-sm font-medium text-rias-tenue">{ips}</span>
          {indice != null && (
            <span className="ml-auto shrink-0 rounded-full bg-rias-app px-2.5 py-0.5 text-xs font-bold text-rias-azul2">
              Índice {indice}%
            </span>
          )}
        </div>
      </div>
    </>
  );
}
