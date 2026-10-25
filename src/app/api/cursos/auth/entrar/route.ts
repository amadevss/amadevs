import { NextRequest, NextResponse } from "next/server";
import { canSelfEnroll, getVisibleCourse } from "@/lib/cursos/queries";
import { checkStudentLogin, enroll, startStudentSession } from "@/lib/cursos/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Login con correo y contraseña; si viene courseSlug, inscribe al curso. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const result = await checkStudentLogin(String(body.email ?? ""), String(body.password ?? ""));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });

  await startStudentSession(result.student.id);
  const course = body.courseSlug ? await getVisibleCourse(String(body.courseSlug)) : null;
  if (course && canSelfEnroll(course)) await enroll(course.id, result.student.id);
  return NextResponse.json({ ok: true });
}
