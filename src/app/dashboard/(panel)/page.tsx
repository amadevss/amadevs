import type { Metadata } from "next";
import Link from "next/link";
import { DateTime } from "luxon";
import { requireDashboard } from "@/lib/dashboard/auth";
import { BUSINESS_TIMEZONE } from "@/lib/agenda/config";
import { listBookingsForDashboard, listPaymentsForDashboard } from "@/lib/agenda/queries";
import { formatDateTime, formatMoney, STATUS_LABEL, STATUS_TONE } from "@/lib/agenda/format";
import { countStudents, listCoursesOverview, listPendingReviews } from "@/lib/cursos/queries";
import { formatDateTime as formatShort } from "@/lib/cursos/shared";
import { Badge, ButtonLink, EmptyState, PageHeader, Section, StatCard } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

export const metadata: Metadata = { title: "Inicio" };
export const dynamic = "force-dynamic";

const LIVE = new Set(["pending_payment", "confirmed"]);

export default async function DashboardHome() {
  await requireDashboard("/dashboard");

  const [bookings, payments, reviews, students, courses] = await Promise.all([
    listBookingsForDashboard(),
    listPaymentsForDashboard(),
    listPendingReviews(5),
    countStudents(),
    listCoursesOverview(),
  ]);

  const now = DateTime.now().setZone(BUSINESS_TIMEZONE);
  const todayEnd = now.endOf("day").toMillis();
  const weekEnd = now.plus({ days: 7 }).toMillis();
  const monthStart = now.startOf("month").toMillis();

  const upcoming = bookings
    .filter((b) => LIVE.has(b.status) && new Date(b.starts_at).getTime() >= Date.now())
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const today = upcoming.filter((b) => new Date(b.starts_at).getTime() <= todayEnd).length;
  const week = upcoming.filter((b) => new Date(b.starts_at).getTime() <= weekEnd).length;
  const pendingPayment = bookings.filter((b) => b.status === "pending_payment").length;

  const monthPayments = payments.filter(
    (p) => p.status === "succeeded" && new Date(p.created_at).getTime() >= monthStart,
  );
  const monthTotal = monthPayments.reduce((sum, p) => sum + p.amount_cents, 0);
  const currency = monthPayments[0]?.currency ?? "mxn";

  const greeting = now.hour < 12 ? "Buenos días" : now.hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <>
      <PageHeader
        title={greeting}
        description={now.setLocale("es").toFormat("cccc d 'de' LLLL")}
        actions={
          <>
            <ButtonLink href="/dashboard/reservas/nueva" icon="plus" variant="ghost">
              Reserva
            </ButtonLink>
            <ButtonLink href="/dashboard/cursos/nuevo" icon="plus">
              Curso
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Reservas"
          icon="calendar"
          value={today}
          hint={`hoy · ${week} en 7 días`}
          href="/dashboard/reservas"
        />
        <StatCard
          label="Pago pendiente"
          icon="clock"
          tone={pendingPayment > 0 ? "warn" : "muted"}
          value={pendingPayment}
          hint="reservas esperando pago"
          href="/dashboard/reservas?estado=espera"
        />
        <StatCard
          label="Cobrado"
          icon="card"
          tone="ok"
          value={formatMoney(monthTotal, currency)}
          hint={`este mes · ${monthPayments.length} pagos`}
          href="/dashboard/pagos"
        />
        <StatCard
          label="Por calificar"
          icon="grade"
          tone={reviews.total > 0 ? "warn" : "muted"}
          value={reviews.total}
          hint={`${students.total} alumnos · +${students.lastWeek} esta semana`}
          href="/dashboard/cursos"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Section
          title="Próximas reservas"
          action={
            <Link href="/dashboard/reservas" className="text-sm font-medium text-primary-ink hover:underline">
              Ver todas
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <EmptyState icon="calendar" title="Sin reservas próximas">
              Cuando alguien agende, aparecerá aquí.
            </EmptyState>
          ) : (
            <ul className="-mx-2 grid">
              {upcoming.slice(0, 5).map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-center leading-none">
                    <span className="font-display text-sm font-bold">
                      {DateTime.fromJSDate(new Date(b.starts_at)).setZone(BUSINESS_TIMEZONE).toFormat("d")}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{b.customer_name}</span>
                    <span className="block truncate text-xs text-subtle">
                      {b.service_name} · {formatDateTime(b.starts_at, BUSINESS_TIMEZONE)}
                    </span>
                  </span>
                  <Badge tone={STATUS_TONE[b.status] === "warn" ? "warn" : "ok"}>{STATUS_LABEL[b.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Entregas por calificar">
          {reviews.items.length === 0 ? (
            <EmptyState icon="check" title="Todo al día">
              No hay entregas pendientes de calificar.
            </EmptyState>
          ) : (
            <ul className="-mx-2 grid">
              {reviews.items.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/cursos/${r.course_id}/sesiones/${r.session_id}/entregas`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-surface-2"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      <Icon name="file" className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{r.student_name}</span>
                      <span className="block truncate text-xs text-subtle">
                        {r.course_title} · Sesión {r.session_position} · {formatShort(r.updated_at)}
                      </span>
                    </span>
                    <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-subtle" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section
        className="mt-5"
        title="Cursos"
        action={
          <Link href="/dashboard/cursos" className="text-sm font-medium text-primary-ink hover:underline">
            Administrar
          </Link>
        }
      >
        {courses.length === 0 ? (
          <EmptyState
            icon="book"
            title="Aún no tienes cursos"
            action={
              <ButtonLink href="/dashboard/cursos/nuevo" icon="plus">
                Crear mi primer curso
              </ButtonLink>
            }
          >
            Crea un curso, agrega sesiones y comparte el enlace con tus alumnos.
          </EmptyState>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {courses.slice(0, 4).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/cursos/${c.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 transition hover:border-primary/40 hover:bg-surface-2"
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
                    style={{ background: "var(--grad)" }}
                  >
                    <Icon name="book" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{c.title}</span>
                    <span className="block text-xs text-subtle">
                      {c.student_count} alumnos · {c.session_count} sesiones
                    </span>
                  </span>
                  {c.ungraded_count > 0 ? <Badge tone="warn">{c.ungraded_count}</Badge> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
