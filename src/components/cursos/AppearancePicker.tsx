"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const OPTIONS = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Automático" },
] as const;

/** Selector de tema: claro, oscuro o el del dispositivo. */
export default function AppearancePicker() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? (theme ?? "system") : null;

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-2 sm:max-w-md">
      {OPTIONS.map((o) => {
        const active = current === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(o.value)}
            className={`min-h-11 rounded-xl border px-3 text-sm font-medium transition ${
              active
                ? "border-primary bg-primary-soft text-primary-ink"
                : "border-border text-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
