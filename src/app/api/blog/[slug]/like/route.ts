import { NextRequest, NextResponse } from "next/server";
import { setLike } from "@/lib/blog/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);

  if (typeof body?.liked !== "boolean") {
    return NextResponse.json({ error: "Falta liked: boolean" }, { status: 400 });
  }

  try {
    const stat = await setLike(slug, body.liked);
    return NextResponse.json(stat);
  } catch (err) {
    console.error("[api/blog/like]", err);
    return NextResponse.json({ error: "Error registrando el like" }, { status: 500 });
  }
}
