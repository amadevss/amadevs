import { NextRequest, NextResponse } from "next/server";
import { deleteBlobs, hasDashboardSession } from "@/lib/cursos/server";
import { deleteStudent } from "@/lib/cursos/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Elimina la cuenta del alumno con sus entregas y archivos. No se puede deshacer. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasDashboardSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const pathnames = await deleteStudent(id);
  if (!pathnames) return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 });
  await deleteBlobs(pathnames);
  return NextResponse.json({ ok: true });
}
