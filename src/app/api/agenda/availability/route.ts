import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/agenda/availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const service = searchParams.get("service");

  if (!date || !service) {
    return NextResponse.json(
      { error: "Faltan parámetros: date (YYYY-MM-DD) y service (slug)" },
      { status: 400 },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date debe ser YYYY-MM-DD" }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(date, service);
    return NextResponse.json({ date, service, slots });
  } catch (err) {
    console.error("[agenda/availability]", err);
    return NextResponse.json({ error: "Error consultando disponibilidad" }, { status: 500 });
  }
}
