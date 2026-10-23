"use client";

import { EmptyState } from "@/components/ui/kit";

export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon="alert"
      title="Algo salió mal al cargar esta sección"
      action={
        <button type="button" className="btn btn-primary min-h-11" onClick={reset}>
          Reintentar
        </button>
      }
    >
      Puede ser un problema de conexión. Intenta de nuevo; si sigue fallando, recarga la página.
    </EmptyState>
  );
}
