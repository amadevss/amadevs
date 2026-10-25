import type { Metadata } from "next";
import { listPromotions } from "@/lib/cursos/coupons";
import { sql } from "@/lib/cursos/sql";
import { ErrorNote } from "@/components/ui/kit";
import PromotionsPanel from "@/components/dashboard/ventas/PromotionsPanel";

export const metadata: Metadata = { title: "Cupones" };
export const dynamic = "force-dynamic";

export default async function CuponesPage() {
  try {
    const [promos, courses] = await Promise.all([
      listPromotions(),
      sql<{ id: string; title: string }>`
        select id, title from course where kind = 'publico' and price_cents > 0 order by title`,
    ]);
    return <PromotionsPanel promos={promos} courses={courses.rows} />;
  } catch (err) {
    console.error("[dashboard/cupones]", err);
    return <ErrorNote>No se pudo conectar con Stripe para leer los cupones. Revisa la pestaña Stripe.</ErrorNote>;
  }
}
