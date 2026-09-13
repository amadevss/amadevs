import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";
import { deleteBlogPost, normalizeBlogPostInput, updateBlogPost } from "@/lib/blog/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

async function hasSession(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(DASHBOARD_COOKIE)?.value);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasSession())) return bad("No autorizado", 401);

  const body = await req.json().catch(() => null);
  if (!body) return bad("JSON inválido");

  const parsed = normalizeBlogPostInput(body);
  if (!parsed.ok) return bad(parsed.error);

  const { id } = await params;
  try {
    const post = await updateBlogPost(id, parsed.value);
    if (!post) return bad("No se encontró el post", 404);
    return NextResponse.json({ post });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "23505") return bad("Ya existe un post con ese slug", 409);
    console.error("[dashboard/blog] updateBlogPost", err);
    return bad("No se pudo actualizar el post", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasSession())) return bad("No autorizado", 401);

  const { id } = await params;
  const ok = await deleteBlogPost(id);
  if (!ok) return bad("No se encontró el post", 404);
  return NextResponse.json({ ok: true });
}
