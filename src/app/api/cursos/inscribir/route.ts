import { NextRequest, NextResponse } from "next/server";
import { getVisibleCourse } from "@/lib/cursos/queries";
import { enroll, getCurrentStudent } from "@/lib/cursos/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Alumno con sesión se inscribe a otro curso con su enlace. */
export async function POST(req: NextRequest) {
  const student = await getCurrentStudent();
  if (!student) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const course = await getVisibleCourse(String(body?.courseSlug ?? ""));
  if (!course) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
  await enroll(course.id, student.id);
  return NextResponse.json({ ok: true });
}
