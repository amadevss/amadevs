import type { ReactNode } from "react";
import { requireDashboard } from "@/lib/dashboard/auth";
import { STRIPE_MODE } from "@/lib/cursos/payments";
import { Badge, PageHeader } from "@/components/ui/kit";
import RouteTabs from "@/components/ui/RouteTabs";

export default async function VentasLayout({ children }: { children: ReactNode }) {
  await requireDashboard();
  return (
    <>
      <PageHeader
        title="Ventas de cursos"
        badge={
          <Badge tone={STRIPE_MODE === "live" ? "ok" : "warn"} dot>
            Stripe {STRIPE_MODE === "live" ? "real" : "prueba"}
          </Badge>
        }
        description="Compras, reembolsos, cupones y la conexión con Stripe."
      />
      <RouteTabs
        label="Ventas"
        tabs={[
          { href: "/dashboard/ventas", label: "Compras", exact: true },
          { href: "/dashboard/ventas/cupones", label: "Cupones" },
          { href: "/dashboard/ventas/stripe", label: "Stripe" },
        ]}
      />
      {children}
    </>
  );
}
