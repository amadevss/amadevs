"use client";

import { useState } from "react";

export default function PayNowButton({ reference }: { reference: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/agenda/bookings/${reference}/pay`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo iniciar el pago");
      window.location.href = j.checkoutUrl;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="print-hide">
      <button type="button" className="btn btn-primary" onClick={pay} disabled={loading}>
        {loading ? "Abriendo el pago…" : "Pagar ahora"}
      </button>
      {error ? (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
    </div>
  );
}
