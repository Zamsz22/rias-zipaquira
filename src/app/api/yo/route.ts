import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth";

// Devuelve quién está en sesión (o null). El menú lo usa para mostrar Acceso / Admin / Salir.
export async function GET() {
  return NextResponse.json({ usuario: await usuarioActual() });
}
