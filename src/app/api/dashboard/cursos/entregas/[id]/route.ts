import { NextRequest, NextResponse } from "next/server";
import { deleteBlobs, hasDashboardSession } from "@/lib/cursos/server";
import { deleteSubmission, updateSubmissionReview } from "@/lib/cursos/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
type Ctx = { params: Promise<{ id: string }> };

/** Guarda calificación y comentario del profesor. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const grade = String(body?.grade ?? "").trim().slice(0, 40) || null;
  const feedback = String(body?.feedback ?? "").trim().slice(0, 5000) || null;
  if (!(await updateSubmissionReview(id, grade, feedback))) return bad("Entrega no encontrada", 404);
  return NextResponse.json({ ok: true, grade, feedback });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  const pathnames = await deleteSubmission(id);
  if (!pathnames) return bad("Entrega no encontrada", 404);
  await deleteBlobs(pathnames);
  return NextResponse.json({ ok: true });
}
