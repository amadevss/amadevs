import { NextRequest, NextResponse } from "next/server";
import { hasDashboardSession } from "@/lib/cursos/server";
import { setStudentPassword, validatePassword } from "@/lib/cursos/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** El profesor restablece la contraseña de un alumno. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasDashboardSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const password = String(body?.password ?? "");
  const error = validatePassword(password);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const { id } = await params;
  if (!(await setStudentPassword(id, password))) {
    return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
