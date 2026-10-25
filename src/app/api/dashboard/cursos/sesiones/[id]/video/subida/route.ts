import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { hasDashboardSession } from "@/lib/cursos/server";
import { isUuid, sql } from "@/lib/cursos/sql";
import { MAX_VIDEO_BYTES, safeFilename } from "@/lib/cursos/shared";
import { MediaNotConfiguredError, presignUpload } from "@/lib/media/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
type Ctx = { params: Promise<{ id: string }> };

/** Da una URL firmada para que el navegador suba el video directo al almacenamiento. */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  if (!isUuid(id)) return bad("Sesión no encontrada", 404);
  const body = await req.json().catch(() => null);
  const filename = String(body?.filename ?? "").trim();
  const contentType = String(body?.contentType ?? "");
  const size = Number(body?.size ?? 0);
  if (!filename) return bad("Falta el nombre del archivo");
  if (!contentType.startsWith("video/")) return bad("El archivo debe ser un video");
  if (!Number.isFinite(size) || size <= 0) return bad("Archivo vacío");
  if (size > MAX_VIDEO_BYTES) return bad("El video pesa más de 5 GB");

  const { rows } = await sql<{ course_id: string }>`select course_id from course_session where id = ${id}`;
  if (!rows[0]) return bad("Sesión no encontrada", 404);

  const key = `videos/${rows[0].course_id}/${id}/${randomBytes(6).toString("hex")}-${safeFilename(filename)}`;
  try {
    return NextResponse.json({ key, uploadUrl: await presignUpload(key) });
  } catch (err) {
    if (err instanceof MediaNotConfiguredError) return bad(err.message, 503);
    console.error("[dashboard/cursos] video subida", err);
    return bad("No se pudo preparar la subida", 500);
  }
}
