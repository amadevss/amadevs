import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";
import { createBlogPost, listAllBlogPostsForDashboard, normalizeBlogPostInput } from "@/lib/blog/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

async function hasSession(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(DASHBOARD_COOKIE)?.value);
}

export async function GET() {
  if (!(await hasSession())) return bad("No autorizado", 401);
  const posts = await listAllBlogPostsForDashboard();
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  if (!(await hasSession())) return bad("No autorizado", 401);

  const body = await req.json().catch(() => null);
  if (!body) return bad("JSON inválido");

  const parsed = normalizeBlogPostInput(body);
  if (!parsed.ok) return bad(parsed.error);

  try {
    const post = await createBlogPost(parsed.value);
    return NextResponse.json({ post });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "23505") return bad("Ya existe un post con ese slug", 409);
    console.error("[dashboard/blog] createBlogPost", err);
    return bad("No se pudo crear el post", 500);
  }
}
