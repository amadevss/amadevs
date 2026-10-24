import { NextRequest, NextResponse } from "next/server";
import { getVisibleCourse, isPaid } from "@/lib/cursos/queries";
import { startCoursePurchase } from "@/lib/cursos/payments";
import { getCurrentStudent, isEnrolled } from "@/lib/cursos/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

/** Abre el pago de Stripe para un curso público de pago. */
export async function POST(req: NextRequest) {
  const student = await getCurrentStudent();
  if (!student) return bad("Inicia sesión para comprar", 401);
  const body = await req.json().catch(() => ({}));
  const course = await getVisibleCourse(String(body?.courseSlug ?? ""));
  if (!course || !isPaid(course)) return bad("Curso no encontrado", 404);
  if (await isEnrolled(course.id, student.id)) return bad("Ya tienes acceso a este curso", 409);

  // Al terminar, Stripe regresa a la página del curso en el mismo dominio.
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const base = host.startsWith("cursos.") ? "" : "/cursos";
  const returnUrl = `${proto}://${host}${base}/${course.slug}`;

  try {
    return NextResponse.json({ checkoutUrl: await startCoursePurchase(course, student, returnUrl) });
  } catch (err) {
    console.error("[cursos/comprar]", err);
    return bad("No se pudo iniciar el pago. Intenta de nuevo.", 502);
  }
}
