import { NextRequest, NextResponse } from "next/server";

/**
 * cursos.bryanoliveros.com → sirve la sección /cursos en la raíz:
 *   cursos.bryanoliveros.com/            → /cursos
 *   cursos.bryanoliveros.com/<id>/<n>    → /cursos/<id>/<n>
 * Las rutas del sitio principal (blog, agenda, dashboard…) redirigen al dominio principal.
 */
const MAIN_SITE_PATHS = ["/blog", "/agenda", "/dashboard", "/recibo"];
const PROD_DOMAIN = "bryanoliveros.com";

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const { pathname, search } = req.nextUrl;

  if (!host.startsWith("cursos.")) {
    // En el dominio de producción los cursos viven solo en el subdominio, para
    // que la sesión del alumno sea siempre la misma. Previews y local no cambian.
    const isProdMain = host === PROD_DOMAIN || host === `www.${PROD_DOMAIN}`;
    if (isProdMain && (pathname === "/cursos" || pathname.startsWith("/cursos/"))) {
      const rest = pathname.slice("/cursos".length) || "/";
      return NextResponse.redirect(`https://cursos.${PROD_DOMAIN}${rest}${search}`, 308);
    }
    return NextResponse.next();
  }

  if (MAIN_SITE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const base = host.slice("cursos.".length);
    // Directo a www para evitar un segundo redirect.
    const mainHost = base === PROD_DOMAIN ? `www.${PROD_DOMAIN}` : base;
    return NextResponse.redirect(`https://${mainHost}${pathname}${search}`);
  }

  // /cursos/... en el subdominio → quita el prefijo para dejar una sola URL.
  if (pathname === "/cursos" || pathname.startsWith("/cursos/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice("/cursos".length) || "/";
    return NextResponse.redirect(url);
  }

  const url = req.nextUrl.clone();
  url.pathname = `/cursos${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Todo menos API, assets de Next y archivos con extensión.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
