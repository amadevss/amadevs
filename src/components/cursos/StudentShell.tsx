"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Icon, { type IconName } from "@/components/ui/icons";
import AppBrand from "@/components/ui/AppBrand";
import ThemeToggle from "@/components/ThemeToggle";

type Item = { href: string; match: (p: string) => boolean; label: string; icon: IconName };

const topBarStyle = { backgroundColor: "color-mix(in srgb, var(--bg) 88%, transparent)", backdropFilter: "blur(10px)" };

/** En cursos.<dominio>, "Ver sitio" apunta al dominio principal. */
function useMainSiteHref() {
  const [href, setHref] = useState("/");
  useEffect(() => {
    const host = window.location.host;
    if (host.startsWith("cursos.")) setHref(`${window.location.protocol}//${host.slice("cursos.".length)}/`);
  }, []);
  return href;
}

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
  const siteHref = useMainSiteHref();

  // Ruta sin el prefijo /cursos, para comparar igual en ambos dominios.
  const path = pathname.replace(/^\/cursos(?=\/|$)/, "") || "/";
  const home = base || "/";
  const isSettings = (p: string) => p === "/ajustes" || p.startsWith("/ajustes/");
  const items: Item[] = [
    { href: home, match: (p) => p === "/", label: "Inicio", icon: "home" },
    // Cursos incluye la lista y cualquier curso o sesión abierta.
    { href: `${base}/mis-cursos`, match: (p) => p !== "/" && !isSettings(p), label: "Cursos", icon: "book" },
    { href: `${base}/ajustes`, match: isSettings, label: "Ajustes", icon: "settings" },
  ];

  async function logout() {
    setLeaving(true);
    await fetch("/api/cursos/auth/salir", { method: "POST" }).catch(() => null);
    router.push(`${base}/entrar`);
    router.refresh();
  }

  // Sin sesión (entrar, registro o un curso abierto por enlace): barra mínima.
  if (!firstName) {
    const onAuth = path === "/entrar" || path === "/registro";
    return (
      <div className="min-h-dvh">
        <header className="sticky top-0 z-30 border-b border-border" style={topBarStyle}>
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
            <AppBrand href={home} label="Cursos" />
            <div className="flex shrink-0 items-center gap-2">
              {!onAuth ? (
                <Link
                  href={`${base}/entrar`}
                  className="inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-semibold text-white"
                  style={{ background: "var(--grad)" }}
                >
                  Entrar
                </Link>
              ) : null}
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className={`mx-auto max-w-3xl px-4 pb-12 sm:px-6 sm:pb-16 ${onAuth ? "pt-12 sm:pt-20" : "pt-6"}`}>
          {children}
        </main>
      </div>
    );
  }

  const current = items.find((it) => it.match(path));

  return (
    <div className="min-h-dvh">
      {/* Barra lateral (computadora) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <AppBrand href={home} label="Cursos" />
        </div>
        <div className="mx-3 mb-2 flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary-ink">
            {firstName[0]?.toUpperCase()}
          </span>
          <span className="truncate text-sm font-medium">Hola, {firstName}</span>
        </div>
        <nav aria-label="Cursos" className="grid flex-1 content-start grid-cols-1 gap-1 px-3 py-2">
          {items.map((it) => {
            const active = it.match(path);
            return (
              <Link
                key={it.label}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                  active ? "bg-primary-soft text-primary-ink" : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <Icon name={it.icon} className="h-[18px] w-[18px]" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="grid grid-cols-1 gap-1 border-t border-border px-3 py-3">
          <a
            href={siteHref}
            className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg"
          >
            <Icon name="external" className="h-[18px] w-[18px]" />
            Ver sitio
          </a>
          <button
            type="button"
            onClick={logout}
            disabled={leaving}
            className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-muted transition hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-50 dark:hover:text-rose-400"
          >
            <Icon name="logout" className="h-[18px] w-[18px]" />
            {leaving ? "Saliendo…" : "Cerrar sesión"}
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        {/* Barra superior */}
        <header className="sticky top-0 z-30 border-b border-border" style={topBarStyle}>
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-16 lg:px-8">
            <div className="min-w-0 lg:hidden">
              <AppBrand href={home} label="Cursos" />
            </div>
            <p className="hidden min-w-0 truncate font-display text-lg font-semibold tracking-tight lg:block">
              {current?.label ?? "Cursos"}
            </p>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-16 lg:pt-8">{children}</main>
      </div>

      {/* Barra inferior (celular y tablet) */}
      <nav
        aria-label="Cursos"
        className="fixed inset-x-0 bottom-0 z-[60] border-t border-border-strong pb-[env(safe-area-inset-bottom)] lg:hidden"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-4">
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
            <span className="grid h-7 w-12 place-items-center rounded-full">
              <Icon name="logout" className="h-5 w-5" />
            </span>
            {leaving ? "Saliendo…" : "Salir"}
          </button>
        </div>
      </nav>
    </div>
  );
}
