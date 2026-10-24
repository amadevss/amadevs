import { NextRequest, NextResponse } from "next/server";

/**
 * Subdominios que sirven una sección del sitio en la raíz:
 *   cursos.bryanoliveros.com/<id>/<n>  → /cursos/<id>/<n>
 *   profe.bryanoliveros.com/           → /profe
 * Las rutas del sitio principal (blog, agenda, dashboard…) redirigen al dominio principal.
 */
const SUBDOMAIN_SECTIONS = ["cursos", "profe"] as const;
const MAIN_SITE_PATHS = ["/blog", "/agenda", "/dashboard", "/recibo"];
const PROD_DOMAIN = "bryanoliveros.com";
const DASHBOARD_PATH_HEADER = "x-dashboard-path";

const underPath = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const { pathname, search } = req.nextUrl;
  const section = SUBDOMAIN_SECTIONS.find((s) => host.startsWith(`${s}.`));

  if (!section) {
    // En el dominio de producción cada sección vive solo en su subdominio (para
    // cursos, así la sesión del alumno es siempre la misma). Previews y local no cambian.
    const isProdMain = host === PROD_DOMAIN || host === `www.${PROD_DOMAIN}`;
    const prodSection = isProdMain && SUBDOMAIN_SECTIONS.find((s) => underPath(pathname, `/${s}`));
    if (prodSection) {
      const rest = pathname.slice(`/${prodSection}`.length) || "/";
      return NextResponse.redirect(`https://${prodSection}.${PROD_DOMAIN}${rest}${search}`, 308);
    }
    // El dashboard necesita la ruta pedida para volver a ella tras el login.
    if (underPath(pathname, "/dashboard")) {
      const headers = new Headers(req.headers);
      headers.set(DASHBOARD_PATH_HEADER, `${pathname}${search}`);
      return NextResponse.next({ request: { headers } });
    }
    return NextResponse.next();
  }

  const base = host.slice(`${section}.`.length);
  // Directo a www para evitar un segundo redirect.
  const mainHost = base === PROD_DOMAIN ? `www.${PROD_DOMAIN}` : base;
  // https como en producción; http solo al probar en local (profe.localhost).
  const protocol = base.startsWith("localhost") ? "http:" : "https:";

  if (MAIN_SITE_PATHS.some((p) => underPath(pathname, p))) {
    return NextResponse.redirect(`${protocol}//${mainHost}${pathname}${search}`);
  }

  // La otra sección (p. ej. /cursos desde profe.) → al dominio principal, que la reenvía.
  const other = SUBDOMAIN_SECTIONS.find((s) => s !== section && underPath(pathname, `/${s}`));
  if (other) {
    return NextResponse.redirect(`${protocol}//${mainHost}${pathname}${search}`);
  }

  // /<sección>/... en su subdominio → quita el prefijo para dejar una sola URL.
  if (underPath(pathname, `/${section}`)) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(`/${section}`.length) || "/";
    return NextResponse.redirect(url);
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${section}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Todo menos API, assets de Next y archivos con extensión.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
