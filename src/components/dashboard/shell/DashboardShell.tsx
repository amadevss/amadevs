"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Icon, { type IconName } from "@/components/ui/icons";

type NavItem = { href: string; label: string; icon: IconName; exact?: boolean };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: "home", exact: true },
  { href: "/dashboard/reservas", label: "Reservas", icon: "list" },
  { href: "/dashboard/calendario", label: "Calendario", icon: "calendar" },
  { href: "/dashboard/pagos", label: "Pagos", icon: "card" },
  { href: "/dashboard/cursos", label: "Cursos", icon: "book" },
  { href: "/dashboard/alumnos", label: "Alumnos", icon: "users" },
  { href: "/dashboard/blog", label: "Blog", icon: "pen" },
];

// En celular caben 4 accesos + "Más".
const MOBILE_MAIN = ["/dashboard", "/dashboard/reservas", "/dashboard/cursos", "/dashboard/alumnos"];

const isActive = (pathname: string, item: NavItem) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => setMoreOpen(false), [pathname]);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/dashboard/logout", { method: "POST" }).catch(() => null);
    router.replace("/dashboard/login");
    router.refresh();
  }

  const mainItems = NAV.filter((n) => MOBILE_MAIN.includes(n.href));
  const moreItems = NAV.filter((n) => !MOBILE_MAIN.includes(n.href));
  const moreActive = moreItems.some((n) => isActive(pathname, n));

  return (
    <div className="pb-28 pt-2 lg:grid lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-8 lg:pb-16 lg:pt-6">
      {/* Barra lateral (computadora) */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 grid gap-1">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-subtle">Dashboard</p>
          {NAV.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                  active ? "bg-primary-soft text-primary-ink" : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
          <div className="my-3 h-px bg-border" />
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-muted transition hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-50 dark:hover:text-rose-400"
          >
            <Icon name="logout" className="h-[18px] w-[18px]" />
            {loggingOut ? "Saliendo…" : "Cerrar sesión"}
          </button>
        </div>
      </aside>

      <div className="min-w-0">{children}</div>

      {/* Barra inferior (celular) */}
      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-[60] border-t border-border-strong pb-[env(safe-area-inset-bottom)] lg:hidden"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {mainItems.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                  active ? "text-primary-ink" : "text-subtle"
                }`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active ? "bg-primary-soft" : ""}`}>
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              moreActive || moreOpen ? "text-primary-ink" : "text-subtle"
            }`}
          >
            <span className={`grid h-7 w-12 place-items-center rounded-full ${moreActive || moreOpen ? "bg-primary-soft" : ""}`}>
              <Icon name="more" className="h-6 w-6" />
            </span>
            Más
          </button>
        </div>
      </nav>

      {/* Menú "Más" (celular) */}
      {moreOpen ? (
        <div className="fixed inset-0 z-[55] lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="dialog-backdrop absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="dialog-in absolute inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] grid gap-1 rounded-t-3xl border border-border-strong p-3"
            style={{ backgroundColor: "var(--bg)" }}
          >
            {moreItems.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium ${
                    active ? "bg-primary-soft text-primary-ink" : "text-fg hover:bg-surface-2"
                  }`}
                >
                  <Icon name={item.icon} className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <div className="mx-2 my-1 h-px bg-border" />
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="flex min-h-12 items-center gap-3 rounded-2xl px-4 text-left text-sm font-medium text-rose-600 dark:text-rose-400"
            >
              <Icon name="logout" className="h-5 w-5" />
              {loggingOut ? "Saliendo…" : "Cerrar sesión"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
