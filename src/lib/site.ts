/**
 * URL absoluta del sitio. Prioridad:
 *   1. NEXT_PUBLIC_SITE_URL (definida en .env / Vercel)
 *   2. VERCEL_URL (deploys preview)
 *   3. localhost:3000
 */
export function siteUrl(path = "/"): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return new URL(path, base).toString();
}
