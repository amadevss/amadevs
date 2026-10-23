import type { Metadata } from "next";
import { DateTime } from "luxon";
import { requireDashboard } from "@/lib/dashboard/auth";
import { BUSINESS_TIMEZONE } from "@/lib/agenda/config";
import { listPaymentsForDashboard } from "@/lib/agenda/queries";
import { formatMoney } from "@/lib/agenda/format";
import { PageHeader, StatCard } from "@/components/ui/kit";
import RefreshButton from "@/components/ui/RefreshButton";
import PaymentsView from "@/components/dashboard/PaymentsView";

export const metadata: Metadata = { title: "Pagos" };
export const dynamic = "force-dynamic";

export default async function PagosPage() {
  await requireDashboard("/dashboard/pagos");
  const payments = await listPaymentsForDashboard();

  const monthStart = DateTime.now().setZone(BUSINESS_TIMEZONE).startOf("month").toMillis();
  const ok = payments.filter((p) => p.status === "succeeded");
  const month = ok.filter((p) => new Date(p.created_at).getTime() >= monthStart);
  const refunded = payments.filter((p) => p.status === "refunded");
  const currency = payments[0]?.currency ?? "mxn";
  const sum = (list: typeof payments) => list.reduce((s, p) => s + p.amount_cents, 0);

  return (
    <>
      <PageHeader
        title="Pagos"
        description="Cargos y reembolsos que Stripe confirmó a la app mediante el webhook."
        actions={<RefreshButton />}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Este mes" icon="card" tone="ok" value={formatMoney(sum(month), currency)} hint={`${month.length} pagos`} />
        <StatCard label="Total cobrado" icon="chart" value={formatMoney(sum(ok), currency)} hint={`${ok.length} pagos`} />
        <StatCard
          label="Reembolsos"
          icon="refresh"
          tone={refunded.length ? "bad" : "muted"}
          value={refunded.length}
          hint={refunded.length ? formatMoney(sum(refunded), currency) : "ninguno"}
        />
      </div>
      <PaymentsView payments={payments} businessTimezone={BUSINESS_TIMEZONE} />
    </>
  );
}
