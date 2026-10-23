"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import Icon, { type IconName } from "@/components/ui/icons";

/**
 * Navegación del área de alumnos. En el subdominio las rutas van en la raíz
 * (base = ""); en el dominio principal y previews, bajo /cursos.
 */
export default function StudentShell({
  firstName,
  base,
  children,
}: {
  firstName: string | null;
  base: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  // Ruta sin el prefijo /cursos, para comparar igual en ambos dominios.
  const path = pathname.replace(/^\/cursos(?=\/|$)/, "") || "/";
  const home = base || "/";
  const items: { href: string; match: (p: string) => boolean; label: string; icon: IconName }[] = [
    {
      href: home,
      match: (p) => p !== "/perfil" && !p.startsWith("/perfil/"),
      label: "Mis cursos",
      icon: "book",
    },
    { href: `${base}/perfil`, match: (p) => p === "/perfil" || p.startsWith("/perfil/"), label: "Perfil", icon: "user" },
  ];

  async function logout() {
    setLeaving(true);
    await fetch("/api/cursos/auth/salir", { method: "POST" }).catch(() => null);
    router.push(`${base}/entrar`);
    router.refresh();
  }

  if (!firstName) {
    return <div className="mx-auto max-w-3xl pb-12 pt-4 sm:pb-16 sm:pt-6">{children}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl pb-28 pt-4 sm:pb-16 sm:pt-6">
      {/* Barra superior (tablet y computadora) */}
      <nav
        aria-label="Cursos"
        className="mb-6 hidden items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-3 py-2 text-sm sm:flex"
      >
        <span className="flex min-w-0 items-center gap-2 px-1">
          <span className="grid grid-cols-1 h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary-ink">
            {firstName[0]?.toUpperCase()}
          </span>
          <span className="truncate font-medium">Hola, {firstName}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {items.map((it) => {
            const active = it.match(path);
            return (
              <Link
                key={it.label}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 transition ${
                  active ? "bg-primary-soft font-medium text-primary-ink" : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <Icon name={it.icon} className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={logout}
            disabled={leaving}
            className="inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-muted transition hover:bg-surface-2 hover:text-fg disabled:opacity-50"
          >
            <Icon name="logout" className="h-4 w-4" />
            {leaving ? "Saliendo…" : "Salir"}
          </button>
        </div>
      </nav>

      {children}

      {/* Barra inferior (celular) */}
      <nav
        aria-label="Cursos"
        className="fixed inset-x-0 bottom-0 z-[60] border-t border-border-strong pb-[env(safe-area-inset-bottom)] sm:hidden"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="grid grid-cols-3">
          {items.map((it) => {
            const active = it.match(path);
            return (
              <Link
                key={it.label}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  active ? "text-primary-ink" : "text-subtle"
                }`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full ${active ? "bg-primary-soft" : ""}`}>
                  <Icon name={it.icon} className="h-5 w-5" />
                </span>
                {it.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={logout}
            disabled={leaving}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-subtle disabled:opacity-50"
          >
            <span className="grid grid-cols-1 h-7 w-12 place-items-center rounded-full">
              <Icon name="logout" className="h-5 w-5" />
            </span>
            {leaving ? "Saliendo…" : "Salir"}
          </button>
        </div>
      </nav>
    </div>
  );
}
