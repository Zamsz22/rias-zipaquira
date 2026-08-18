import { NextResponse } from "next/server";
import { correoAutorizado } from "@/lib/auth";

// Revisa si un correo puede recibir el PIN: solo los que el administrador autorizó.
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Correo inválido." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, autorizado: await correoAutorizado(email) });
}
