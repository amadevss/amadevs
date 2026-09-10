import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Compat con la API anterior; el tilt por puntero se retiró por rendimiento. */
  max?: number;
  lift?: number;
};

/**
 * Antes inclinaba la tarjeta siguiendo el puntero con varios springs de Framer
 * Motion. Ahora es sólo un contenedor: la elevación al pasar el ratón la hace
 * CSS (`.tilt-card:hover`), en el compositor y sin JS.
 */
export default function TiltCard({ children, className }: Props) {
  return <div className={className ? `tilt-card ${className}` : "tilt-card"}>{children}</div>;
}
