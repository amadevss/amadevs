import { NextRequest, NextResponse } from "next/server";

/**
 * cursos.bryanoliveros.com → sirve la sección /cursos en la raíz:
 *   cursos.bryanoliveros.com/            → /cursos
 *   cursos.bryanoliveros.com/<id>/<n>    → /cursos/<id>/<n>
 * Las rutas del sitio principal (blog, agenda, dashboard…) redirigen al dominio principal.
 */
const MAIN_SITE_PATHS = ["/blog", "/agenda", "/dashboard", "/recibo"];

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (!host.startsWith("cursos.")) return NextResponse.next();

  const { pathname, search } = req.nextUrl;

  if (MAIN_SITE_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const mainHost = host.slice("cursos.".length);
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
