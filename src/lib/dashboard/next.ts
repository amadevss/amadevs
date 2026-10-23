/** Destino seguro tras iniciar sesión: solo rutas internas del dashboard. */
export function safeDashboardNext(next: string | null | undefined): string {
  if (!next || !/^\/dashboard(\/|\?|$)/.test(next) || next.startsWith("/dashboard/login")) return "/dashboard";
  return next;
}
