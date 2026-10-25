import type { Metadata } from "next";
import { headers } from "next/headers";
import { getStripeStatus } from "@/lib/cursos/coupons";
import { REQUIRED_WEBHOOK_EVENTS } from "@/lib/cursos/payments";
import { Badge, ErrorNote, Section } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";
import FixWebhookButton from "@/components/dashboard/ventas/FixWebhookButton";

export const metadata: Metadata = { title: "Stripe" };
export const dynamic = "force-dynamic";

const PROD_ORIGINS = ["https://bryanoliveros.com", "https://www.bryanoliveros.com"];

function Row({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span
        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
          ok ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
        }`}
      >
        <Icon name={ok ? "check" : "x"} className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {hint ? <span className="block text-xs text-subtle">{hint}</span> : null}
      </span>
    </li>
  );
}

export default async function StripePage() {
  const host = (await headers()).get("host") ?? "";
  const origins = [...PROD_ORIGINS, `https://${host}`];
  let status;
  try {
    status = await getStripeStatus(origins);
  } catch (err) {
    console.error("[dashboard/stripe]", err);
    return (
      <ErrorNote>
        No se pudo conectar con Stripe. Revisa que las claves STRIPE_SECRET_KEY_TEST / STRIPE_SECRET_KEY_LIVE estén en Vercel.
      </ErrorNote>
    );
  }
  const { account, endpoints, mode } = status;
  const ours = endpoints.filter((e) => e.ours);

  return (
    <div className="grid grid-cols-1 gap-5">
      <Section
        title="Cuenta"
        action={
          <Badge tone={mode === "live" ? "ok" : "warn"} dot>
            Modo {mode === "live" ? "real" : "prueba"}
          </Badge>
        }
      >
        <p className="text-sm text-muted">
          {account.name ?? "Cuenta de Stripe"}
          {account.email ? ` · ${account.email}` : ""}
          {account.country ? ` · ${account.country}` : ""}
          {account.default_currency ? ` · ${account.default_currency.toUpperCase()}` : ""}
        </p>
        <ul className="mt-2 divide-y divide-border">
          <Row ok={account.details_submitted} label="Datos de la cuenta completos" hint="Identidad y datos del negocio en Stripe." />
          <Row ok={account.charges_enabled} label="Puede recibir pagos" />
          <Row ok={account.payouts_enabled} label="Puede depositar a tu banco" />
        </ul>
        {mode === "test" ? (
          <p className="mt-3 text-xs text-subtle">
            En modo prueba usa la tarjeta 4242 4242 4242 4242, cualquier fecha futura y cualquier CVC. No se cobra dinero real.
          </p>
        ) : null}
      </Section>

      <Section title="Webhook (avisos de Stripe a la plataforma)">
        <p className="text-sm text-muted">
          Stripe avisa por aquí cuando un pago se confirma, se reembolsa o entra en disputa. Sin estos avisos las compras con
          OXXO y los reembolsos hechos desde Stripe no se reflejan.
        </p>
        {ours.length === 0 ? (
          <div className="mt-3">
            <ErrorNote>
              No encontramos un webhook apuntando a {origins.map((o) => `${o}/api/stripe/webhook`).join(" o ")} en modo{" "}
              {mode === "live" ? "real" : "prueba"}. Créalo en Stripe → Desarrolladores → Webhooks con esa URL y guarda su
              secreto en Vercel como STRIPE_WEBHOOK_SECRET.
            </ErrorNote>
          </div>
        ) : null}
        <ul className="mt-3 grid grid-cols-1 gap-3">
          {endpoints.map((e) => (
            <li key={e.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="break-all font-mono text-xs">{e.url}</p>
                <span className="flex gap-1.5">
                  {e.ours ? <Badge tone="primary">Esta plataforma</Badge> : null}
                  <Badge tone={e.status === "enabled" ? "ok" : "muted"}>{e.status === "enabled" ? "Activo" : "Desactivado"}</Badge>
                </span>
              </div>
              {e.missing.length === 0 ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                  <Icon name="check" className="h-3.5 w-3.5" />
                  Recibe todos los eventos necesarios.
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <p className="text-xs text-amber-700 dark:text-amber-400">Le faltan: {e.missing.join(", ")}</p>
                  {e.ours ? <FixWebhookButton endpointId={e.id} missing={e.missing.length} /> : null}
                </div>
              )}
            </li>
          ))}
        </ul>
        <details className="mt-3 text-xs text-subtle">
          <summary className="cursor-pointer">Eventos que usa la plataforma</summary>
          <p className="mt-1 font-mono">{REQUIRED_WEBHOOK_EVENTS.join(", ")}</p>
        </details>
      </Section>

      <Section title="Lo que se configura en Stripe">
        <p className="text-sm text-muted">
          Stripe no permite cambiar esto desde otra plataforma: cuenta bancaria para depósitos, datos fiscales del negocio,
          verificación de identidad, logo y colores de los recibos, y activar métodos como OXXO o meses sin intereses en tu
          cuenta.
        </p>
        <a
          href={`https://dashboard.stripe.com/${mode === "test" ? "test/" : ""}settings`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost mt-3 min-h-10"
        >
          <Icon name="external" className="h-4 w-4" />
          Abrir configuración de Stripe
        </a>
      </Section>
    </div>
  );
}
