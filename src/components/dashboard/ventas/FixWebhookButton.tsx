"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFeedback } from "@/components/ui/feedback";

export default function FixWebhookButton({ endpointId, missing }: { endpointId: string; missing: number }) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-primary min-h-10"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await fetch("/api/dashboard/stripe/webhook", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpointId }),
        });
        const j = await r.json().catch(() => ({}));
        setBusy(false);
        if (!r.ok) return toast.error(j.error || "No se pudo actualizar el webhook");
        toast.success(`Se agregaron ${j.added} eventos al webhook`);
        router.refresh();
      }}
    >
      {busy ? "Agregando…" : `Agregar ${missing} eventos faltantes`}
    </button>
  );
}
