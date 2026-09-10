import type { Metadata } from "next";
import BookingWizard from "@/components/agenda/BookingWizard";
import GroupQuoteCard from "@/components/agenda/GroupQuoteCard";
import { BUSINESS_TIMEZONE } from "@/lib/agenda/config";
import { getActiveServices, getActiveWeekdays } from "@/lib/agenda/queries";

export const metadata: Metadata = {
  title: "Agenda una sesión",
  description:
    "Reserva una sesión de consultoría 1:1 con Bryan Oliveros Pérez y paga en línea de forma segura. También conferencias y talleres para grupos, a cotización.",
  alternates: { canonical: "/agenda" },
};

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const [services, activeWeekdays] = await Promise.all([
    getActiveServices(),
    getActiveWeekdays(),
  ]);

  return (
    <div className="py-12 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow">Agenda</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Reserva una sesión
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Elige el tipo de sesión, un horario disponible y paga en línea. Recibes un
          comprobante con folio para consultarlo cuando quieras en{" "}
          <span className="font-mono">/recibo</span>.
        </p>
      </header>

      {services.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted">
          Por ahora no hay sesiones disponibles para reservar.
        </p>
      ) : (
        <BookingWizard
          services={services}
          activeWeekdays={activeWeekdays}
          businessTimezone={BUSINESS_TIMEZONE}
        />
      )}

      <div className="mt-14">
        <GroupQuoteCard />
      </div>
    </div>
  );
}
