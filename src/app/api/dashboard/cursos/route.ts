import { NextRequest, NextResponse } from "next/server";
import { hasDashboardSession } from "@/lib/cursos/server";
import { createCourse, listCoursesForDashboard, normalizeCourseInput } from "@/lib/cursos/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === "23505";

export async function GET() {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  return NextResponse.json({ courses: await listCoursesForDashboard() });
}

export async function POST(req: NextRequest) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const parsed = normalizeCourseInput((await req.json().catch(() => ({}))) ?? {});
  if (!parsed.ok) return bad(parsed.error);
  try {
    const course = await createCourse(parsed.value);
    return NextResponse.json({ course });
  } catch (err) {
    if (isUniqueViolation(err)) return bad("Ya existe un curso con ese id", 409);
    console.error("[dashboard/cursos] create", err);
    return bad("No se pudo crear el curso", 500);
  }
}
