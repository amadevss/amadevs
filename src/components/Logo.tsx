"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/** Logo con contenedor redondeado y degradación a monograma si la imagen falla. */
export default function Logo({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false);
  const initial = alt.trim().charAt(0).toUpperCase() || "•";

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-white ${className ?? "h-12 w-12"}`}
    >
      {failed ? (
        <span className="font-display text-sm font-bold text-primary-ink">{initial}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
