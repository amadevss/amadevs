import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";
import { safeDashboardNext } from "@/lib/dashboard/next";
import LoginForm from "@/components/dashboard/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeDashboardNext(next);
  const store = await cookies();
  if (isValidSessionToken(store.get(DASHBOARD_COOKIE)?.value)) redirect(safeNext);

  return (
    <div className="mx-auto max-w-sm py-16 sm:py-24">
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">Iniciar sesión</h1>
      <p className="mt-2 text-sm text-muted">Acceso privado para administrar reservas, cursos y el blog.</p>
      <div className="surface-card mt-6 p-6">
        <LoginForm />
      </div>
    </div>
  );
}
