import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";
import { createBlogPost, isValidSlug, listAllBlogPostsForDashboard, slugify } from "@/lib/blog/posts";

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

interface BlogPostInput {
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  tags?: string;
}

export async function POST(req: NextRequest) {
  if (!(await hasSession())) return bad("No autorizado", 401);

  let body: BlogPostInput;
  try {
    body = (await req.json()) as BlogPostInput;
  } catch {
    return bad("JSON inválido");
  }

  const title = body.title?.trim();
  const content = body.content?.trim();
  if (!title) return bad("Falta el título");
  if (!content) return bad("Falta el contenido");

  const slug = body.slug?.trim() ? slugify(body.slug) : slugify(title);
  if (!slug || !isValidSlug(slug)) return bad("Slug inválido");

  const tags = (body.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  try {
    const post = await createBlogPost({
      slug,
      title,
      description: body.description?.trim() ?? "",
      content,
      tags,
    });
    return NextResponse.json({ post });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "23505") return bad("Ya existe un post con ese slug", 409);
    console.error("[dashboard/blog] createBlogPost", err);
    return bad("No se pudo crear el post", 500);
  }
}
