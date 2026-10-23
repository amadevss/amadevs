"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type RouteTab = { href: string; label: string; count?: number | null; exact?: boolean };

/**
 * Pestañas que son rutas: la activa sale de la URL, así funcionan
 * "atrás", recargar y compartir el enlace.
 */
export default function RouteTabs({ tabs, label }: { tabs: RouteTab[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex w-max min-w-full gap-1 border-b border-border">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`relative -mb-px inline-flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition ${
                active ? "border-primary text-fg" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {t.label}
              {t.count != null ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                    active ? "bg-primary-soft text-primary-ink" : "bg-surface-2 text-subtle"
                  }`}
                >
                  {t.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
