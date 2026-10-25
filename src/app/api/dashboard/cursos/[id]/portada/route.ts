import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { deleteBlobs, hasDashboardSession } from "@/lib/cursos/server";
import { setCourseCover } from "@/lib/cursos/queries";
import { coverFolder } from "@/lib/cursos/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
type Ctx = { params: Promise<{ id: string }> };

/** Guarda la portada que el navegador ya subió a Blob y borra la anterior. */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const pathname = String(body?.pathname ?? "");
  if (!pathname.startsWith(coverFolder(id))) return bad("Archivo inválido");
  try {
    const meta = await head(pathname);
    if (!meta.contentType.startsWith("image/")) return bad("La portada debe ser una imagen");
    const old = await setCourseCover(id, pathname);
    if (old && old !== pathname) await deleteBlobs([old]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[dashboard/cursos] portada", err);
    return bad("No se pudo guardar la portada", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await hasDashboardSession())) return bad("No autorizado", 401);
  const { id } = await params;
  const old = await setCourseCover(id, null);
  if (old) await deleteBlobs([old]);
  return NextResponse.json({ ok: true });
}
