import type { ReactNode } from "react";
import AppBrand from "@/components/ui/AppBrand";
import ThemeToggle from "@/components/ThemeToggle";

/** Pantalla de acceso del dashboard: sin el navbar de la landing. */
export default function DashboardLoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <AppBrand href="/" label="Dashboard" />
        <ThemeToggle />
      </header>
      <main className="px-4 sm:px-6">{children}</main>
    </div>
  );
}
