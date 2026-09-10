"use client";

import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Grados de inclinación en el eje X al entrar / salir del viewport. */
  strength?: number;
};

/**
 * Inclina el elemento en 3D según su posición en el viewport: entra "acostado"
 * hacia atrás, se endereza al centro y vuelve a inclinarse al salir. El efecto
 * de scroll 3D se aprecia de forma continua, no solo en la entrada.
 */
export default function ScrollTilt({ children, className, strength = 14 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center", "end start"],
  });

  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.5, 1], reduce ? [0, 0, 0] : [strength, 0, -strength]),
    { stiffness: 120, damping: 26, mass: 0.4 },
  );
  const y = useSpring(
    useTransform(scrollYProgress, [0, 0.5, 1], reduce ? [0, 0, 0] : [22, 0, -10]),
    { stiffness: 120, damping: 26, mass: 0.4 },
  );

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={className} style={{ perspective: 1100 }}>
      <motion.div style={{ rotateX, y, transformStyle: "preserve-3d" }}>{children}</motion.div>
    </div>
  );
}
