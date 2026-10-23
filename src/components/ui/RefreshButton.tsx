"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Icon from "./icons";

/** Vuelve a pedir los datos de la página sin recargarla. */
export default function RefreshButton({ label = "Actualizar" }: { label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-ghost min-h-11"
      onClick={() => start(() => router.refresh())}
      disabled={pending}
      aria-label={label}
    >
      <Icon name="refresh" className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">{pending ? "Actualizando…" : label}</span>
    </button>
  );
}
