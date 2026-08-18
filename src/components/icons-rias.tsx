// Iconos SVG a medida (lucide no los tiene).

export function IconEmbarazada({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* cabeza */}
      <circle cx="10" cy="4" r="2" />
      {/* espalda */}
      <path d="M10 6v3" />
      {/* barriga (semicírculo hacia la derecha) */}
      <path d="M10 9a4.2 4.2 0 0 1 0 8.4" />
      {/* pierna */}
      <path d="M10 17.4V21" />
      {/* brazo apoyado en la barriga */}
      <path d="M10 11c-1.8.5-2.6 1.8-2.4 3.2" />
    </svg>
  );
}

export function IconCursoVida({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* línea de tiempo */}
      <path d="M2 21h20" />
      {/* niño (pequeño, izquierda) */}
      <circle cx="6" cy="11" r="1.5" />
      <path d="M6 12.5v3.8" />
      <path d="M6 16.3l-1.1 3.6M6 16.3l1.1 3.6" />
      <path d="M4.7 14h2.6" />
      {/* adulto mayor (alto, derecha, con bastón) */}
      <circle cx="15.5" cy="6.5" r="1.7" />
      <path d="M15.5 8.2v6.4" />
      <path d="M15.5 14.6l-1.4 4.9M15.5 14.6l1.4 4.9" />
      <path d="M15.5 10l2.4 1" />
      <path d="M18.3 10.7V20" />
    </svg>
  );
}
