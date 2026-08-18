import { NextResponse } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";

// Lista las cargas existentes (para detectar archivos ya analizados).
export async function GET() {
  if (!supabaseConfigurado) return NextResponse.json({ ok: true, cargas: [] });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: true, cargas: [] });
  const { data } = await supabase
    .from("cargas")
    .select("id, eps_id, tipo_documento, archivo_nombre, total_filas, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);
  return NextResponse.json({ ok: true, cargas: data ?? [] });
}

type Payload = {
  epsId: string;
  tipo: string;
  modoUsado: string;
  archivo: string;
  totalFilas: number;
  porcentaje: number | null;
  componente: string | null;
  anio?: number;
  trimestre?: number;
  reemplazar?: boolean;
  analisis?: unknown;
  registros?: { hoja: string; datos: Record<string, unknown> }[];
  // Carga por lotes: el cliente parte los registros en varios POST para no superar el
  // límite de tamaño del cuerpo (413). El 1º crea la carga; los siguientes traen append+cargaId.
  cargaId?: string;
  append?: boolean;
};

const MAX_REGISTROS = 3000;

export async function POST(req: Request) {
  if (!supabaseConfigurado) {
    return NextResponse.json(
      { ok: false, error: "Supabase no está configurado. Agrega las claves en .env.local." },
      { status: 503 },
    );
  }
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "No se pudo crear el cliente de Supabase." }, { status: 503 });
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  // Modo "append": añadir un lote más de registros a una carga ya creada (carga por lotes).
  if (body.append && body.cargaId) {
    const { data: carga } = await supabase.from("cargas").select("periodo_id").eq("id", body.cargaId).single();
    const filas = (body.registros ?? []).slice(0, MAX_REGISTROS).map((r) => ({
      carga_id: body.cargaId,
      eps_id: body.epsId,
      periodo_id: carga?.periodo_id ?? null,
      tipo_documento: body.tipo,
      hoja: r.hoja,
      datos: r.datos,
    }));
    const { error, count } = await supabase.from("registros").insert(filas, { count: "exact" });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, cargaId: body.cargaId, registrosInsertados: count ?? filas.length });
  }

  const anio = body.anio ?? 2026;
  const trimestre = body.trimestre ?? 2;

  // Al volver a subir, borra lo anterior de esa EPS y tipo para reemplazarlo.
  if (body.reemplazar) {
    await supabase.from("cargas").delete().eq("eps_id", body.epsId).eq("tipo_documento", body.tipo);
    if (body.componente)
      await supabase.from("resultados_componente").delete().eq("eps_id", body.epsId).eq("componente", body.componente);
  }

  // Periodo (crear si no existe)
  const { data: periodo } = await supabase
    .from("periodos")
    .upsert({ anio, trimestre }, { onConflict: "anio,trimestre" })
    .select("id")
    .single();
  const periodoId = periodo?.id ?? null;

  // Registro de la carga
  const { data: carga, error: errCarga } = await supabase
    .from("cargas")
    .insert({
      eps_id: body.epsId,
      periodo_id: periodoId,
      tipo_documento: body.tipo,
      modo_lectura: body.modoUsado,
      archivo_nombre: body.archivo,
      total_filas: body.totalFilas,
      porcentaje: body.porcentaje,
      analisis: body.analisis ?? null,
    })
    .select("id")
    .single();

  if (errCarga || !carga) {
    return NextResponse.json(
      { ok: false, error: errCarga?.message ?? "No se pudo registrar la carga." },
      { status: 500 },
    );
  }

  // Resultado por componente (alimenta dashboard/semáforo)
  if (body.porcentaje !== null && body.componente) {
    await supabase.from("resultados_componente").insert({
      eps_id: body.epsId,
      periodo_id: periodoId,
      componente: body.componente,
      valor_pct: body.porcentaje,
    });
  }

  // Filas normalizadas (tope de seguridad)
  let registrosInsertados = 0;
  if (body.registros?.length) {
    const filas = body.registros.slice(0, MAX_REGISTROS).map((r) => ({
      carga_id: carga.id,
      eps_id: body.epsId,
      periodo_id: periodoId,
      tipo_documento: body.tipo,
      hoja: r.hoja,
      datos: r.datos,
    }));
    const { error: errReg, count } = await supabase
      .from("registros")
      .insert(filas, { count: "exact" });
    if (!errReg) registrosInsertados = count ?? filas.length;
  }

  return NextResponse.json({
    ok: true,
    cargaId: carga.id,
    registrosInsertados,
    componenteGuardado: Boolean(body.porcentaje !== null && body.componente),
  });
}
