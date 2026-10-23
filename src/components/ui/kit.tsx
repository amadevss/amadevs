import Link from "next/link";
import type { ReactNode } from "react";
import Icon, { type IconName } from "./icons";

/** Piezas visuales compartidas por el dashboard y el área de alumnos (sin hooks). */

/* ───────────── Insignias ───────────── */

export type Tone = "ok" | "warn" | "bad" | "info" | "primary" | "muted";

export const TONE_BADGE: Record<Tone, string> = {
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  bad: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  primary: "border-primary/30 bg-primary-soft text-primary-ink",
  muted: "border-border bg-surface-2 text-subtle",
};

export function Badge({ tone = "muted", children, dot = false }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_BADGE[tone]}`}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export function VisibilityBadge({ hidden }: { hidden: boolean }) {
  return hidden ? <Badge tone="muted">Oculto</Badge> : <Badge tone="ok" dot>Publicado</Badge>;
}

/* ───────────── Encabezado de página ───────────── */

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Ruta" className="mb-3 flex min-w-0 items-center gap-1 overflow-x-auto text-sm text-subtle">
      {items.map((c, i) => (
        <span key={i} className="flex shrink-0 items-center gap-1">
          {i > 0 ? <Icon name="chevronRight" className="h-3.5 w-3.5 opacity-60" /> : null}
          {c.href ? (
            <Link href={c.href} className="max-w-[12rem] truncate rounded-md px-1 py-1 transition hover:text-fg">
              {c.label}
            </Link>
          ) : (
            <span className="max-w-[14rem] truncate px-1 py-1 font-medium text-muted">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  crumbs = [],
  actions,
  badge,
}: {
  title: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <header className="mb-6">
      <Breadcrumbs items={crumbs} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            {badge}
          </div>
          {description ? <div className="mt-1.5 text-sm text-muted">{description}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

/* ───────────── Tarjetas y métricas ───────────── */

export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: IconName;
  href?: string;
  tone?: Tone;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-subtle">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-full border ${TONE_BADGE[tone]}`}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-subtle">{hint}</p> : null}
    </>
  );
  const cls = "surface-card block p-4 sm:p-5";
  return href ? (
    <Link href={href} className={`${cls} transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Section({
  title,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface-card p-4 sm:p-6 ${className}`}>
      {title || action ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title ? <h2 className="font-display text-base font-bold sm:text-lg">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: "var(--grad)" }} />
    </div>
  );
}

/* ───────────── Estados vacíos y de carga ───────────── */

export function EmptyState({
  icon = "inbox",
  title,
  children,
  action,
}: {
  icon?: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-strong px-6 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary-ink">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="mt-3 font-display text-base font-bold">{title}</p>
      {children ? <div className="mt-1 max-w-sm text-sm text-muted">{children}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />;
}

/** Esqueleto genérico de página: encabezado, métricas y lista. */
export function PageSkeleton({ stats = false, rows = 4 }: { stats?: boolean; rows?: number }) {
  return (
    <div className="grid gap-5" role="status" aria-label="Cargando">
      <div className="grid gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
      </div>
      {stats ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : null}
      <div className="grid gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}

/* ───────────── Botones como enlace ───────────── */

export function ButtonLink({
  href,
  children,
  icon,
  variant = "primary",
  className = "",
  external = false,
}: {
  href: string;
  children: ReactNode;
  icon?: IconName;
  variant?: "primary" | "ghost";
  className?: string;
  external?: boolean;
}) {
  const cls = `btn ${variant === "primary" ? "btn-primary" : "btn-ghost"} min-h-11 ${className}`;
  const inner = (
    <>
      {icon ? <Icon name={icon} className="h-4 w-4" /> : null}
      {children}
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export const FIELD_LABEL = "text-xs font-semibold uppercase tracking-wide text-subtle";

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-400">
      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
