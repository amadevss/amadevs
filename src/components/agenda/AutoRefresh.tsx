"use client";

import { useEffect, useState } from "react";

/**
 * Recarga la página unas cuantas veces mientras la reserva sigue en
 * "pago pendiente" (el webhook de Stripe puede tardar 1-2 s tras volver
 * del checkout). Se detiene sola para no quedar en bucle.
 */
export default function AutoRefresh({ max = 3, seconds = 4 }: { max?: number; seconds?: number }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const key = `agenda-refresh:${window.location.pathname}`;
    const count = Number(sessionStorage.getItem(key) ?? "0");
    if (count >= max) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => {
      sessionStorage.setItem(key, String(count + 1));
      window.location.reload();
    }, seconds * 1000);
    return () => clearTimeout(t);
  }, [max, seconds]);

  if (done) return null;
  return (
    <span className="inline-flex items-center gap-2 text-xs text-subtle">
      <span className="h-1.5 w-1.5 animate-ping rounded-full bg-amber-500" />
      Comprobando el pago…
    </span>
  );
}
