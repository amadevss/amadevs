import { NextRequest, NextResponse } from "next/server";
import { hasDashboardSession } from "@/lib/cursos/server";
import { unenroll } from "@/lib/cursos/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Da de baja al alumno del curso (su cuenta y entregas se conservan). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; studentId: string }> },
) {
  if (!(await hasDashboardSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id, studentId } = await params;
  if (!(await unenroll(id, studentId))) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
