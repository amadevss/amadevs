import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getBookingByReferenceAndEmail } from "@/lib/agenda/queries";

export const metadata: Metadata = {
  title: "Consultar reserva",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function lookup(formData: FormData) {
  "use server";
  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  const email = String(formData.get("email") ?? "").trim();
  if (!reference || !email) redirect("/recibo?e=1");

  const booking = await getBookingByReferenceAndEmail(reference, email);
  if (!booking) redirect("/recibo?e=1");
  redirect(`/recibo/${booking.reference}`);
}

export default async function ReciboLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <p className="eyebrow">Reservas</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          Consultar reserva
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Ingresa el folio y el correo con el que reservaste.
        </p>

        <form action={lookup} className="surface-card mt-6 space-y-4 p-6">
          {e ? (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
              No encontramos una reserva con esos datos.
            </p>
          ) : null}
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Folio
            </span>
            <input
              name="reference"
              required
              placeholder="CNS-XXXXXXX"
              className="agenda-input mt-1 font-mono uppercase"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
              Correo
            </span>
            <input name="email" type="email" required className="agenda-input mt-1" />
          </label>
          <button className="btn btn-primary w-full">Ver reserva</button>
        </form>
      </div>
    </div>
  );
}
