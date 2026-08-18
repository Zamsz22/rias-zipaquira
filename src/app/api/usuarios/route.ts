import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { usuarioActual } from "@/lib/auth";

async function exigirAdmin() {
  const u = await usuarioActual();
  return u?.rol === "admin" ? u : null;
}

// Lista de usuarios autorizados (solo admin).
export async function GET() {
  if (!(await exigirAdmin())) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ ok: true, usuarios: [] });
  const { data } = await db.from("usuarios_autorizados").select("email, rol, activo, nombre, created_at").order("created_at");
  return NextResponse.json({ ok: true, usuarios: data ?? [] });
}

// Agrega o actualiza un usuario (solo admin).
export async function POST(req: Request) {
  if (!(await exigirAdmin())) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ ok: false, error: "Sin cliente." }, { status: 503 });

  let b: { email?: string; rol?: string; nombre?: string; activo?: boolean };
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 }); }
  const email = (b.email ?? "").trim().toLowerCase();
  if (!email.includes("@")) return NextResponse.json({ ok: false, error: "Correo inválido." }, { status: 400 });
  const rol = b.rol === "admin" ? "admin" : "editor";

  const { error } = await db.from("usuarios_autorizados").upsert(
    { email, rol, nombre: b.nombre ?? null, activo: b.activo ?? true },
    { onConflict: "email" },
  );
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Quita el acceso a un usuario (solo admin; no puede quitarse a sí mismo).
export async function DELETE(req: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  const email = (new URL(req.url).searchParams.get("email") ?? "").trim().toLowerCase();
  if (email === admin.email.toLowerCase()) return NextResponse.json({ ok: false, error: "No puedes quitarte a ti mismo." }, { status: 400 });
  const db = createAdminClient();
  if (!db) return NextResponse.json({ ok: false, error: "Sin cliente." }, { status: 503 });
  const { error } = await db.from("usuarios_autorizados").delete().eq("email", email);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
