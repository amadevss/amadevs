import type { Metadata } from "next";
import { requireDashboard } from "@/lib/dashboard/auth";
import { getActiveServices } from "@/lib/agenda/queries";
import { EmptyState, PageHeader } from "@/components/ui/kit";
import NewBookingClient from "@/components/dashboard/NewBookingClient";

export const metadata: Metadata = { title: "Nueva reserva" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ fecha?: string; hora?: string; servicio?: string; desde?: string }> };

export default async function NuevaReservaPage({ searchParams }: Props) {
  const { fecha, hora, servicio, desde } = await searchParams;
  await requireDashboard("/dashboard/reservas/nueva");
  const services = await getActiveServices();
  const fromCalendar = desde === "calendario";
  const back = fromCalendar ? { label: "Calendario", href: "/dashboard/calendario" } : { label: "Reservas", href: "/dashboard/reservas" };

  return (
    <>
      <PageHeader
        title="Nueva reserva manual"
        description="Queda confirmada al guardarla; no pasa por el cobro en línea."
        crumbs={[back, { label: "Nueva" }]}
      />
      {services.length === 0 ? (
        <EmptyState icon="alert" title="No hay servicios activos">
          Activa al menos un servicio para poder registrar reservas.
        </EmptyState>
      ) : (
        <NewBookingClient
          services={services}
          backHref={back.href}
          prefill={{ date: fecha, time: hora, serviceSlug: servicio }}
        />
      )}
    </>
  );
}
