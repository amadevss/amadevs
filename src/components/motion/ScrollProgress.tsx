"use client";

import { useEffect } from "react";

/**
 * Barra de progreso de scroll.
 *
 * Donde el navegador soporta `animation-timeline: scroll()` (Chrome, Firefox)
 * la anima el compositor sin una sola línea de JS. En el resto (Safari) cae a
 * un listener de scroll pasivo, rebajado con rAF, que sólo actualiza una
 * custom property.
 */
export default function ScrollProgress() {
  useEffect(() => {
    const supportsScrollTimeline =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("animation-timeline: scroll()");
    if (supportsScrollTimeline) return;

    const root = document.documentElement;
    let raf = 0;

    const update = () => {
      raf = 0;
      const max = root.scrollHeight - root.clientHeight;
      const p = max > 0 ? root.scrollTop / max : 0;
      root.style.setProperty("--scroll-progress", p.toFixed(4));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div aria-hidden className="scroll-progress" />;
}
