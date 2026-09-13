import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";
import { setBlogPostHidden } from "@/lib/blog/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  if (!isValidSessionToken(store.get(DASHBOARD_COOKIE)?.value)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.hidden !== "boolean") {
    return NextResponse.json({ error: "Falta hidden: boolean" }, { status: 400 });
  }

  const { id } = await params;
  const post = await setBlogPostHidden(id, body.hidden);
  if (!post) return NextResponse.json({ error: "No se encontró el post" }, { status: 404 });
  return NextResponse.json({ post });
}
