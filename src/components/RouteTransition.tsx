"use client";

import { unstable_ViewTransition as ViewTransition } from "react";
import { useEffect, useState } from "react";

/**
 * Envuelve el contenido de ruta en <ViewTransition> sólo en dispositivos con
 * puntero fino (escritorio / ratón).
 *
 * En táctil —iPhone sobre todo— la View Transitions API captura un snapshot
 * de toda la página en cada navegación; en iOS Safari eso hace que el cambio
 * de ruta "tarde demasiado". Ahí se renderiza el contenido tal cual y la
 * navegación es inmediata.
 *
 * Arranca en `true` (coincide con SSR y con escritorio, el caso que más
 * cuida la animación) y sólo baja a `false` tras confirmar puntero grueso,
 * así el árbol de escritorio nunca se vuelve a montar.
 */
export default function RouteTransition({ children }: { children: React.ReactNode }) {
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const sync = () => setAnimate(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!animate) return <>{children}</>;
  return <ViewTransition>{children}</ViewTransition>;
}
