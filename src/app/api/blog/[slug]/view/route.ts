import { NextRequest, NextResponse } from "next/server";
import { incrementView } from "@/lib/blog/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const stat = await incrementView(slug);
    return NextResponse.json(stat);
  } catch (err) {
    console.error("[api/blog/view]", err);
    return NextResponse.json({ error: "Error registrando la vista" }, { status: 500 });
  }
}
