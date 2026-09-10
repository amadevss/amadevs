"use client";

import { createElement, type CSSProperties, type ReactNode } from "react";
import { useReveal } from "@/lib/useReveal";

type Tag = "div" | "section" | "article" | "li" | "ul" | "header" | "span" | "p";

type Props = {
  children: ReactNode;
  className?: string;
  /** Retraso en segundos (para stagger manual). */
  delay?: number;
  /** Desplazamiento inicial en Y (px). */
  y?: number;
  as?: Tag;
  /**
   * Compat con la API anterior. El reveal siempre es de una sola vez y el
   * "tilt" 3D se retiró por rendimiento; se aceptan pero se ignoran.
   */
  once?: boolean;
  tilt?: number;
};

export default function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = "div",
}: Props) {
  const ref = useReveal<HTMLElement>();

  return createElement(
    as,
    {
      ref,
      className: className ? `reveal ${className}` : "reveal",
      style: {
        "--reveal-delay": `${delay}s`,
        "--reveal-y": `${y}px`,
      } as CSSProperties,
    },
    children,
  );
}
