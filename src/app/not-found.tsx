import type { Metadata } from "next";
import Link from "next/link";
import AppBrand from "@/components/ui/AppBrand";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="app-shell flex flex-col">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <AppBrand href="/" />
        <ThemeToggle />
      </header>
      <main className="mx-auto grid w-full max-w-md flex-1 place-content-center px-4 pb-24 text-center">
        <p className="text-gradient font-display text-7xl font-bold tracking-tight sm:text-8xl">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Esta página no existe</h1>
        <p className="mt-2 text-sm text-muted">
          Puede que el enlace esté mal escrito o que la página se haya movido.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-white"
            style={{ background: "var(--grad)" }}
          >
            Ir al inicio
          </Link>
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center rounded-full border border-border-strong bg-surface px-5 text-sm font-semibold"
          >
            Ver el blog
          </Link>
        </div>
      </main>
    </div>
  );
}
