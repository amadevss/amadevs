import type { Metadata } from "next";
import { requireDashboard } from "@/lib/dashboard/auth";
import { BUSINESS_TIMEZONE } from "@/lib/agenda/config";
import { getActiveServices, listBlackoutsForDashboard, listBookingsForDashboard } from "@/lib/agenda/queries";
import { ButtonLink, PageHeader } from "@/components/ui/kit";
import CalendarClient from "@/components/dashboard/CalendarClient";

export const metadata: Metadata = { title: "Calendario" };
export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  await requireDashboard();
  const [bookings, blackouts, services] = await Promise.all([
    listBookingsForDashboard(),
    listBlackoutsForDashboard(),
    getActiveServices(),
  ]);

  return (
    <>
      <PageHeader
        title="Calendario"
        description="Elige un día para ver sus reservas, bloquear horas o agendar en un hueco libre."
        actions={
          <ButtonLink href="/dashboard/reservas/nueva?desde=calendario" icon="plus">
            Reserva manual
          </ButtonLink>
        }
      />
      <CalendarClient
        bookings={bookings}
        initialBlackouts={blackouts}
        services={services}
        businessTimezone={BUSINESS_TIMEZONE}
      />
    </>
  );
}
