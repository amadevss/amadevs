import type { Metadata } from "next";
import { requireDashboard } from "@/lib/dashboard/auth";
import { BUSINESS_TIMEZONE } from "@/lib/agenda/config";
import { listBookingsForDashboard } from "@/lib/agenda/queries";
import { ButtonLink, PageHeader } from "@/components/ui/kit";
import RefreshButton from "@/components/ui/RefreshButton";
import { parseBookingFilter } from "@/lib/dashboard/bookings";
import BookingsView from "@/components/dashboard/BookingsView";

export const metadata: Metadata = { title: "Reservas" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ estado?: string }> };

export default async function ReservasPage({ searchParams }: Props) {
  const { estado } = await searchParams;
  await requireDashboard(`/dashboard/reservas${estado ? `?estado=${estado}` : ""}`);
  const filter = parseBookingFilter(estado);
  const bookings = await listBookingsForDashboard();

  return (
    <>
      <PageHeader
        title="Reservas"
        description="Sesiones agendadas en línea o registradas a mano."
        actions={
          <>
            <RefreshButton />
            <ButtonLink href="/dashboard/reservas/nueva" icon="plus">
              Reserva manual
            </ButtonLink>
          </>
        }
      />
      <BookingsView bookings={bookings} filter={filter} businessTimezone={BUSINESS_TIMEZONE} />
    </>
  );
}
