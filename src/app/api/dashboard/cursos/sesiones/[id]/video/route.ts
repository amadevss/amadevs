import { NextRequest, NextResponse } from "next/server";
import { hasDashboardSession } from "@/lib/cursos/server";
import { clearSessionVideo, setSessionVideo } from "@/lib/cursos/queries";
import { isUuid } from "@/lib/cursos/sql";
import { deleteMedia, headObject, MediaNotConfiguredError } from "@/lib/media/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
type Ctx = { params: Promise<{ id: string }> };

/** Registra el video que el navegador ya subió y borra el anterior. */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  if (!isUuid(id)) return bad("Sesión no encontrada", 404);
  const body = await req.json().catch(() => null);
  const key = String(body?.key ?? "");
  if (!key.startsWith("videos/") || !key.includes(`/${id}/`)) return bad("Archivo inválido");
  const duration = Math.round(Number(body?.duration));
  try {
    const meta = await headObject(key);
    if (!meta) return bad("El video no terminó de subirse", 409);
    const old = await setSessionVideo(id, {
      key,
      filename: String(body?.filename ?? "").trim().slice(0, 200) || key.split("/").pop() || "video",
      size: meta.size,
      duration: Number.isFinite(duration) && duration > 0 ? duration : null,
    });
    if (old && old !== key) await deleteMedia([old]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof MediaNotConfiguredError) return bad(err.message, 503);
    console.error("[dashboard/cursos] video", err);
    return bad("No se pudo registrar el video", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  if (!isUuid(id)) return bad("Sesión no encontrada", 404);
  const old = await clearSessionVideo(id);
  await deleteMedia([old]);
  return NextResponse.json({ ok: true });
}
