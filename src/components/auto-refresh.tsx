"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Refresca los datos del servidor (gráficas, índices) cada N segundos.
export function AutoRefresh({ segundos = 60 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), segundos * 1000);
    return () => clearInterval(id);
  }, [router, segundos]);
  return null;
}
