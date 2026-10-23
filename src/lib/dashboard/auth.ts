import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DASHBOARD_COOKIE, isValidSessionToken } from "@/lib/dashboardAuth";

/**
 * Exige sesión de dashboard. Cada página la llama (no solo el layout), porque
 * al navegar entre rutas del panel el layout no se vuelve a ejecutar.
 */
export async function requireDashboard(nextPath = "/dashboard"): Promise<void> {
  const store = await cookies();
  if (!isValidSessionToken(store.get(DASHBOARD_COOKIE)?.value)) {
    redirect(`/dashboard/login?next=${encodeURIComponent(nextPath)}`);
  }
}
