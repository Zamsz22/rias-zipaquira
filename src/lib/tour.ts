// Tour real con spotlight (driver.js): overlay oscuro, resalta cada sección y
// va navegando por cada página explicando qué es y cómo se usa.
import { driver } from "driver.js";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type Paso = { path: string; el: string; title: string; desc: string };

const PASOS: Paso[] = [
  {
    path: "/dashboard",
    el: '[data-tour="dash-welcome"]',
    title: "Dashboard",
    desc: "Es el resumen del municipio. Desde aquí ves de un vistazo cómo va la implementación RIAS en todos los prestadores.",
  },
  {
    path: "/dashboard",
    el: '[data-tour="dash-kpi"]',
    title: "Índice promedio",
    desc: "El cumplimiento general, con su color de semáforo. Verde es satisfactorio; rojo, muy crítico.",
  },
  {
    path: "/prestadores",
    el: '[data-tour="prestadores-grid"]',
    title: "Prestadores",
    desc: "Cada EPS aparece por separado con su IPS y un mini-perfil. Haz clic en una tarjeta para abrir su página.",
  },
  {
    path: "/dashboard/eps/famisanar",
    el: '[data-tour="eps-overview"]',
    title: "Página de la EPS",
    desc: "Arriba: el índice y las 7 tarjetas de componente (adherencia, indicadores, anexos, biomédica, etc.).",
  },
  {
    path: "/dashboard/eps/famisanar",
    el: '[data-tour="eps-tabs"]',
    title: "Detalle por curso de vida",
    desc: "Cada pestaña abre el detalle del documento, agrupado por etapa (preconcepción, infancia, adolescencia…). En historias verás cada paciente y sus aspectos.",
  },
  {
    path: "/cargar",
    el: '[data-tour="cargar"]',
    title: "Cargar datos",
    desc: "Sube un ZIP, una carpeta o varios Excel. La plataforma detecta la EPS, evita repetir lo ya analizado y lo guarda.",
  },
  {
    path: "/manual",
    el: '[data-tour="manual"]',
    title: "Manual",
    desc: "Aquí tienes la guía completa paso a paso. ¡Listo para empezar a usar la plataforma!",
  },
];

function esperar(sel: string, timeout = 3000): Promise<Element | null> {
  return new Promise((resolve) => {
    const ya = document.querySelector(sel);
    if (ya) return resolve(ya);
    const t0 = Date.now();
    const iv = setInterval(() => {
      const e = document.querySelector(sel);
      if (e || Date.now() - t0 > timeout) {
        clearInterval(iv);
        resolve(e);
      }
    }, 80);
  });
}

export async function iniciarTour(router: AppRouterInstance) {
  const d = driver({
    showProgress: true,
    progressText: "{{current}} de {{total}}",
    overlayColor: "#0f2a66",
    overlayOpacity: 0.72,
    stagePadding: 6,
    stageRadius: 14,
    nextBtnText: "Siguiente",
    prevBtnText: "Atrás",
    doneBtnText: "Finalizar",
    popoverClass: "rias-tour",
    steps: PASOS.map((p, i) => ({
      element: p.el,
      popover: {
        title: p.title,
        description: p.desc,
        onNextClick: async () => {
          const sig = PASOS[i + 1];
          if (sig) {
            if (location.pathname !== sig.path) router.push(sig.path);
            await esperar(sig.el);
          }
          d.moveNext();
        },
        onPrevClick: async () => {
          const ant = PASOS[i - 1];
          if (ant) {
            if (location.pathname !== ant.path) router.push(ant.path);
            await esperar(ant.el);
          }
          d.movePrevious();
        },
      },
    })),
  });

  // Asegura estar en la página del primer paso antes de empezar.
  if (location.pathname !== PASOS[0].path) router.push(PASOS[0].path);
  await esperar(PASOS[0].el);
  d.drive(0);
}
