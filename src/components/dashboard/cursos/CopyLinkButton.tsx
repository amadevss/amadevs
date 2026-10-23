"use client";

import { useState } from "react";
import { useFeedback } from "@/components/ui/feedback";
import Icon from "@/components/ui/icons";

export default function CopyLinkButton({ url, label = "Copiar enlace", compact = false }: { url: string; label?: string; compact?: boolean }) {
  const { toast } = useFeedback();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Enlace copiado. Compártelo con tus alumnos.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("No se pudo copiar. Mantén presionado el enlace para copiarlo.");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={
        compact
          ? "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-primary-ink transition hover:bg-primary-soft"
          : "btn btn-ghost min-h-11"
      }
    >
      <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
      {copied ? "Copiado" : label}
    </button>
  );
}
