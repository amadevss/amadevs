"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Desplazamiento vertical en px a lo largo del recorrido. Negativo = sube. */
  speed?: number;
  /** Rotación extra (grados) ligada al scroll. */
  rotate?: number;
  /** Escala inicial → final. */
  scaleFrom?: number;
};

/**
 * Mueve su contenido en función del scroll mientras el elemento cruza el viewport.
 * Da un parallax continuo y perceptible.
 */
export default function Parallax({
  children,
  className,
  speed = -80,
  rotate = 0,
  scaleFrom,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-speed, speed]);
  const r = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-rotate, rotate]);
  const scale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reduce || scaleFrom == null ? [1, 1, 1] : [scaleFrom, 1, scaleFrom],
  );

  return (
    <motion.div ref={ref} className={className} style={{ y, rotate: r, scale }}>
      {children}
    </motion.div>
  );
}
