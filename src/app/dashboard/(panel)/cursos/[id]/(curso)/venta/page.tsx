import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadCourse } from "@/lib/dashboard/cursos";
import { listPurchases, STRIPE_MODE } from "@/lib/cursos/payments";
import { formatMoney } from "@/lib/agenda/format";
import { ButtonLink, EmptyState, StatCard } from "@/components/ui/kit";
import SaleForm from "@/components/dashboard/cursos/SaleForm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await loadCourse((await params).id);
  return { title: course ? `Venta · ${course.title}` : "Venta" };
}

export default async function VentaPage({ params }: Props) {
  const course = await loadCourse((await params).id);
  if (!course) notFound();
  if (course.kind !== "publico") {
    return (
      <EmptyState icon="lock" title="Los cursos privados no se venden">
        Cambia el curso a Público (en Editar) para ponerle precio y mostrarlo en el catálogo.
      </EmptyState>
    );
  }
  const purchases = await listPurchases({ courseId: course.id });
  const paid = purchases.filter((p) => p.status === "paid" || p.status === "partially_refunded");
  const income = paid.reduce((n, p) => n + p.amount_cents - p.refunded_cents, 0);

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Ventas" icon="card" value={paid.length} hint={`${purchases.length} intentos de pago`} />
        <StatCard
          label="Ingresos"
          icon="chart"
          tone="ok"
          value={formatMoney(income, course.currency)}
          hint={`Stripe en modo ${STRIPE_MODE === "live" ? "real" : "prueba"}`}
        />
      </div>
      <SaleForm course={course} mode={STRIPE_MODE} />
      <ButtonLink href={`/dashboard/ventas?curso=${course.id}`} variant="ghost" icon="list" className="justify-self-start">
        Ver las compras de este curso
      </ButtonLink>
    </div>
  );
}
