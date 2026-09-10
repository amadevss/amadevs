"use client";

import { useEffect, useRef } from "react";

/**
 * Reveal on scroll sin Framer Motion.
 *
 * Un único IntersectionObserver compartido para toda la página (en vez de uno
 * por elemento). Cuando el nodo entra en viewport se le marca
 * `data-revealed="true"` y el resto lo hace CSS con una transición.
 *
 * - `prefers-reduced-motion` o sin IntersectionObserver → se muestra al instante.
 * - Elemento ya visible al cargar → anima tras el primer paint.
 * - Elemento por encima del viewport (recarga con scroll) → se muestra sin animar.
 */

let sharedObserver: IntersectionObserver | null = null;
const callbacks = new Map<Element, () => void>();

function getSharedObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const cb = callbacks.get(entry.target);
          if (cb) {
            cb();
            callbacks.delete(entry.target);
            sharedObserver?.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
  }
  return sharedObserver;
}

export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => {
      el.dataset.revealed = "true";
    };

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    const rect = el.getBoundingClientRect();

    // Ya pasó por encima del viewport: mostrar sin animar.
    if (rect.bottom < 0) {
      reveal();
      return;
    }

    // Visible al cargar: pintar el estado inicial y luego animar.
    if (rect.top < window.innerHeight) {
      const id = requestAnimationFrame(() => requestAnimationFrame(reveal));
      return () => cancelAnimationFrame(id);
    }

    // Por debajo del pliegue: esperar al scroll.
    const observer = getSharedObserver();
    callbacks.set(el, reveal);
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      callbacks.delete(el);
    };
  }, []);

  return ref;
}
