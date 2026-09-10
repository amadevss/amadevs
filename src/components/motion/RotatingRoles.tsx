"use client";

import { useEffect, useState } from "react";

/**
 * Rota los roles con una transición CSS. El `key` cambiante remonta el
 * `<span>` y reproduce la animación de entrada; sin AnimatePresence.
 */
export default function RotatingRoles({ items }: { items: string[] }) {
  const [i, setI] = useState(0);
  const longest = items.reduce((a, b) => (a.length >= b.length ? a : b), "");

  useEffect(() => {
    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const id = setInterval(() => setI((v) => (v + 1) % items.length), 2600);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <span className="rotating-roles">
      {/* Reserva de ancho y alto: el más largo, invisible */}
      <span className="rotating-roles__ghost font-display font-semibold" aria-hidden>
        {longest}
      </span>
      <span key={i} className="rotating-roles__item text-gradient font-display font-semibold">
        {items[i]}
      </span>
    </span>
  );
}
