import type { ReactNode } from "react";
import { profile } from "@/lib/content";
import {
  formatDateTime,
  formatMoney,
  STATUS_LABEL,
  STATUS_TONE,
  TONE_CLASS,
} from "@/lib/agenda/format";
import type { BookingWithService } from "@/lib/agenda/types";
import PrintButton from "./PrintButton";
import AutoRefresh from "./AutoRefresh";
import PayNowButton from "./PayNowButton";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-subtle">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

export default function ReceiptView({
  booking,
  justReturnedFromStripe = false,
}: {
  booking: BookingWithService;
  justReturnedFromStripe?: boolean;
}) {
  const tone = STATUS_TONE[booking.status];
  const isPending = booking.status === "pending_payment";

  return (
    <div className="mx-auto max-w-xl">
      <div className="print-hide mb-4 flex items-center justify-between gap-3">
        <a href="/agenda" className="text-sm text-muted transition hover:text-fg">
          ← Agenda
        </a>
        <PrintButton />
      </div>

      <article id="recibo" className="surface-card overflow-hidden">
        <div className="h-1" style={{ background: "var(--grad)" }} />
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-bold">{profile.name}</p>
              <p className="text-sm text-subtle">Comprobante de reserva</p>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${TONE_CLASS[tone]}`}
            >
              {STATUS_LABEL[booking.status]}
            </span>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Folio">
              <span className="font-mono text-base">{booking.reference}</span>
            </Field>
            <Field label="Sesión">{booking.service_name}</Field>
            <Field label="Fecha y hora">
              {formatDateTime(booking.starts_at, booking.customer_timezone)}
              <span className="mt-0.5 block text-xs text-subtle">
                Zona horaria: {booking.customer_timezone}
              </span>
            </Field>
            <Field label="Importe">
              {booking.amount_cents === 0
                ? "Gratis"
                : formatMoney(booking.amount_cents, booking.currency)}
            </Field>
            <Field label="A nombre de">{booking.customer_name}</Field>
            <Field label="Correo">{booking.customer_email}</Field>
            {booking.customer_company ? (
              <Field label="Empresa">{booking.customer_company}</Field>
            ) : null}
            {booking.paid_at ? (
              <Field label="Pago recibido">
                {formatDateTime(booking.paid_at, booking.customer_timezone)}
              </Field>
            ) : null}
          </dl>

          {booking.customer_note ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Nota</p>
              <p className="mt-1 whitespace-pre-line text-sm text-muted">
                {booking.customer_note}
              </p>
            </div>
          ) : null}

          {booking.meeting_url ? (
            <a
              href={booking.meeting_url}
              className="btn btn-primary print-hide mt-6"
              target="_blank"
              rel="noopener noreferrer"
            >
              Entrar a la videollamada
            </a>
          ) : null}

          {booking.stripe_receipt_url ? (
            <p className="print-hide mt-6 text-sm">
              <a
                className="text-primary hover:underline"
                href={booking.stripe_receipt_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Descargar recibo de pago →
              </a>
            </p>
          ) : null}

          <div className="mt-8 border-t border-border pt-4 text-xs text-subtle">
            {booking.status === "confirmed" ? (
              <p>
                Reserva confirmada. Te escribiré al correo indicado con los detalles de la
                sesión.
              </p>
            ) : isPending ? (
              <div className="grid gap-3">
                <p className="flex flex-wrap items-center gap-2">
                  Esta reserva sigue pendiente de pago.
                  {justReturnedFromStripe ? <AutoRefresh /> : null}
                </p>
                <PayNowButton reference={booking.reference} />
              </div>
            ) : booking.status === "expired" ? (
              <p>
                El horario apartado venció sin registrarse el pago.{" "}
                <a className="text-primary hover:underline" href="/agenda">
                  Reserva de nuevo
                </a>
                .
              </p>
            ) : null}
            <p className="mt-2">
              Guarda tu folio <span className="font-mono">{booking.reference}</span>. Puedes
              consultar esta reserva en <span className="font-mono">/recibo</span> con tu
              folio y correo. Contacto: {profile.email}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
