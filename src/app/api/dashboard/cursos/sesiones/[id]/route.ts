import { NextRequest, NextResponse } from "next/server";
import { deleteBlobs, hasDashboardSession } from "@/lib/cursos/server";
import { deleteSession, listBlobPathnames, listVideoKeys, normalizeSessionInput, updateSession } from "@/lib/cursos/queries";
import { deleteMedia } from "@/lib/media/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === "23505";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const parsed = normalizeSessionInput((await req.json().catch(() => ({}))) ?? {});
  if (!parsed.ok) return bad(parsed.error);
  const { id } = await params;
  try {
    const session = await updateSession(id, parsed.value);
    if (!session) return bad("Sesión no encontrada", 404);
    return NextResponse.json({ session });
  } catch (err) {
    if (isUniqueViolation(err)) return bad("Ya existe una sesión con ese número", 409);
    console.error("[dashboard/cursos] update session", err);
    return bad("No se pudo actualizar la sesión", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  const [pathnames, videos] = await Promise.all([listBlobPathnames({ sessionId: id }), listVideoKeys({ sessionId: id })]);
  if (!(await deleteSession(id))) return bad("Sesión no encontrada", 404);
  await Promise.all([deleteBlobs(pathnames), deleteMedia(videos)]);
  return NextResponse.json({ ok: true });
}
