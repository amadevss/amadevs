import type { Metadata } from "next";
import { listPurchases, salesSummary } from "@/lib/cursos/payments";
import { isUuid } from "@/lib/cursos/sql";
import { formatMoney } from "@/lib/agenda/format";
import { ErrorNote, StatCard } from "@/components/ui/kit";
import SalesList from "@/components/dashboard/ventas/SalesList";

export const metadata: Metadata = { title: "Ventas" };
export const dynamic = "force-dynamic";

const STATUSES = ["paid", "pending", "refunded", "disputed"];

export default async function VentasPage({ searchParams }: { searchParams: Promise<{ estado?: string; curso?: string }> }) {
  const { estado = "", curso } = await searchParams;
  const status = STATUSES.includes(estado) ? estado : "";
  try {
    const [purchases, summary] = await Promise.all([
      listPurchases({ status: status || undefined, courseId: curso && isUuid(curso) ? curso : undefined }),
      salesSummary(),
    ]);
    const currencies = Object.keys(summary).length ? Object.keys(summary) : ["mxn"];
    const main = currencies[0];
    const s = summary[main] ?? { paid_count: 0, gross_cents: 0, refunded_cents: 0, pending_count: 0 };
    return (
      <div className="grid grid-cols-1 gap-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Ventas" icon="card" value={s.paid_count} />
          <StatCard label="Ingresos" icon="chart" tone="ok" value={formatMoney(s.gross_cents - s.refunded_cents, main)} hint="ya sin reembolsos" />
          <StatCard label="Reembolsado" icon="refresh" tone="info" value={formatMoney(s.refunded_cents, main)} />
          <StatCard label="Pendientes" icon="clock" tone="warn" value={s.pending_count} hint="OXXO o pago sin terminar" />
        </div>
        <SalesList purchases={purchases} status={status} />
      </div>
    );
  } catch (err) {
    console.error("[dashboard/ventas]", err);
    return <ErrorNote>No se pudieron cargar las ventas. Intenta recargar la página.</ErrorNote>;
  }
}
