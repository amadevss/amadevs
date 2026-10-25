import { NextRequest, NextResponse } from "next/server";
import { deleteBlobs, hasDashboardSession } from "@/lib/cursos/server";
import { deleteCourse, listBlobPathnames, listVideoKeys, normalizeCourseInput, setCourseCover, updateCourse } from "@/lib/cursos/queries";
import { deleteMedia } from "@/lib/media/s3";
import { refreshStripeProduct } from "@/lib/cursos/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === "23505";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const parsed = normalizeCourseInput((await req.json().catch(() => ({}))) ?? {});
  if (!parsed.ok) return bad(parsed.error);
  const { id } = await params;
  try {
    const course = await updateCourse(id, parsed.value);
    if (!course) return bad("Curso no encontrado", 404);
    await refreshStripeProduct(course);
    return NextResponse.json({ course });
  } catch (err) {
    if (isUniqueViolation(err)) return bad("Ya existe un curso con ese id", 409);
    console.error("[dashboard/cursos] update", err);
    return bad("No se pudo actualizar el curso", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  const [pathnames, videos, cover] = await Promise.all([
    listBlobPathnames({ courseId: id }),
    listVideoKeys({ courseId: id }),
    setCourseCover(id, null),
  ]);
  if (!(await deleteCourse(id))) return bad("Curso no encontrado", 404);
  await Promise.all([deleteBlobs(cover ? [...pathnames, cover] : pathnames), deleteMedia(videos)]);
  return NextResponse.json({ ok: true });
}
