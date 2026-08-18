import { NextResponse } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { getEpsTodas } from "@/lib/data";

export async function GET() {
  const lista = await getEpsTodas();
  return NextResponse.json({ ok: true, eps: lista });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\x00-\x7f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function POST(req: Request) {
  if (!supabaseConfigurado) {
    return NextResponse.json(
      { ok: false, error: "Supabase no está configurado. Agrega las claves en .env.local." },
      { status: 503 },
    );
  }
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "No se pudo crear el cliente." }, { status: 503 });
  }

  let body: { eps?: string; ips?: string; regimen?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const nombreEps = (body.eps ?? "").trim();
  const nombreIps = (body.ips ?? "").trim();
  if (!nombreEps || !nombreIps) {
    return NextResponse.json({ ok: false, error: "Falta el nombre de la EPS o de la IPS." }, { status: 400 });
  }

  const id = slugify(nombreEps) || `eps-${Date.now()}`;

  // ¿Ya existe? Las EPS sin Excel cargados están ocultas del dashboard, así que el usuario
  // no las ve y vuelve a "crearla". En vez de fallar con "ya existe", la REUTILIZAMOS:
  // nos aseguramos de que tenga IPS y la abrimos. Así nunca bloquea por una EPS invisible.
  const { data: existente } = await supabase.from("eps").select("id").eq("id", id).maybeSingle();
  if (existente) {
    const { data: ips } = await supabase.from("ips").select("id").eq("eps_id", id).limit(1);
    if (!ips || ips.length === 0) await supabase.from("ips").insert({ eps_id: id, nombre: nombreIps });
    return NextResponse.json({ ok: true, id, yaExistia: true });
  }

  const { error: errEps } = await supabase
    .from("eps")
    .insert({ id, nombre: nombreEps, regimen: Boolean(body.regimen) });
  if (errEps) {
    return NextResponse.json({ ok: false, error: errEps.message }, { status: 500 });
  }

  const { error: errIps } = await supabase.from("ips").insert({ eps_id: id, nombre: nombreIps });
  if (errIps) {
    return NextResponse.json({ ok: false, error: errIps.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id });
}
