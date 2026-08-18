import { NextResponse } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";

// Seguimiento editable del Plan de Mejora (una fila por hallazgo).
type Seg = {
  clave: string;
  resultado?: string;
  avance?: number | null;
  observacion?: string;
  responsable?: string;
  fecha_cierre?: string | null;
};

async function cliente() {
  if (!supabaseConfigurado) return null;
  return createClient();
}

// Devuelve el seguimiento guardado de una EPS (uno por hallazgo).
export async function GET(req: Request) {
  const epsId = new URL(req.url).searchParams.get("epsId");
  if (!epsId) return NextResponse.json({ ok: false, error: "Falta epsId." }, { status: 400 });
  const supabase = await cliente();
  if (!supabase) return NextResponse.json({ ok: true, seguimiento: {} });

  const { data } = await supabase
    .from("plan_mejora_seguimiento")
    .select("clave, resultado, avance, observacion, responsable, fecha_cierre")
    .eq("eps_id", epsId);

  const seguimiento: Record<string, Seg> = {};
  for (const r of (data ?? []) as Seg[]) seguimiento[r.clave] = r;
  return NextResponse.json({ ok: true, seguimiento });
}

// Guarda (crea o actualiza) el seguimiento de un hallazgo.
export async function POST(req: Request) {
  if (!supabaseConfigurado) {
    return NextResponse.json({ ok: false, error: "Supabase no está configurado." }, { status: 503 });
  }
  const supabase = await cliente();
  if (!supabase) return NextResponse.json({ ok: false, error: "Sin cliente." }, { status: 503 });

  let body: Seg & { epsId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }
  if (!body.epsId || !body.clave) {
    return NextResponse.json({ ok: false, error: "Falta epsId o clave." }, { status: 400 });
  }

  const fila = {
    eps_id: body.epsId,
    clave: body.clave,
    resultado: body.resultado ?? "En seguimiento",
    avance: body.avance ?? null,
    observacion: body.observacion ?? null,
    responsable: body.responsable ?? null,
    fecha_cierre: body.fecha_cierre || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("plan_mejora_seguimiento").upsert(fila, { onConflict: "eps_id,clave" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
