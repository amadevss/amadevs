import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";
import { BUSINESS_TIMEZONE } from "@/lib/agenda/config";
import {
  getActiveServices,
  listBlackoutsForDashboard,
  listBookingsForDashboard,
  listPaymentsForDashboard,
} from "@/lib/agenda/queries";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const store = await cookies();
  if (!isValidSessionToken(store.get(DASHBOARD_COOKIE)?.value)) {
    redirect("/dashboard/login?next=/dashboard");
  }

  const [bookings, services, payments, blackouts] = await Promise.all([
    listBookingsForDashboard(),
    getActiveServices(),
    listPaymentsForDashboard(),
    listBlackoutsForDashboard(),
  ]);

  return (
    <div className="py-12 sm:py-16">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Reservaciones
        </h1>
      </header>

      <DashboardClient
        initialBookings={bookings}
        initialPayments={payments}
        initialBlackouts={blackouts}
        services={services}
        businessTimezone={BUSINESS_TIMEZONE}
      />
    </div>
  );
}
