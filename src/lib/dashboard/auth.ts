import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";
import { safeDashboardNext } from "./next";

/**
 * Exige sesión de dashboard. La llaman el layout y cada página, porque al
 * navegar entre rutas del panel el layout no se vuelve a ejecutar. Sin sesión,
 * manda al login con la ruta pedida (la pone el middleware) para volver a ella.
 */
export async function requireDashboard(): Promise<void> {
  const store = await cookies();
  if (isValidSessionToken(store.get(DASHBOARD_COOKIE)?.value)) return;
  const requested = safeDashboardNext((await headers()).get("x-dashboard-path"));
  redirect(`/dashboard/login?next=${encodeURIComponent(requested)}`);
}
