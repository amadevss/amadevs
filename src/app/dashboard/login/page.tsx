import type { Metadata } from "next";
import LoginForm from "@/components/dashboard/LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function DashboardLoginPage() {
  return (
    <div className="mx-auto max-w-sm py-16 sm:py-24">
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">Iniciar sesión</h1>
      <p className="mt-2 text-sm text-muted">
        Acceso privado para administrar las reservaciones.
      </p>
      <div className="surface-card mt-6 p-6">
        <LoginForm />
      </div>
    </div>
  );
}
