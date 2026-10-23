"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useFeedback } from "@/components/ui/feedback";
import Icon from "@/components/ui/icons";

/**
 * Botón "Eliminar" con confirmación: hace DELETE a `url`, avisa y luego
 * navega a `redirectTo` o refresca la página.
 */
export default function DeleteButton({
  url,
  title,
  message,
  confirmLabel = "Eliminar",
  success,
  redirectTo,
  label = "Eliminar",
  variant = "subtle",
}: {
  url: string;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  success: string;
  redirectTo?: string;
  label?: string;
  variant?: "subtle" | "button";
}) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!(await confirm({ title, message, confirmLabel, danger: true }))) return;
    setBusy(true);
    try {
      const r = await fetch(url, { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No se pudo eliminar");
      toast.success(success);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className={
        variant === "button"
          ? "btn btn-ghost min-h-11 text-rose-600 dark:text-rose-400"
          : "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-40 dark:text-rose-400"
      }
    >
      <Icon name="trash" className="h-4 w-4" />
      {busy ? "Eliminando…" : label}
    </button>
  );
}
