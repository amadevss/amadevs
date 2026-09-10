"use client";

import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  motion,
} from "motion/react";
import { useEffect, useRef } from "react";

type Props = {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Texto fijo en lugar de un número animado. */
  text?: string;
};

export default function Counter({ value, prefix = "", suffix = "", text }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();

  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => `${prefix}${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (text) return;
    if (!inView) return;
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 1.4, ease: [0.16, 0.84, 0.44, 1] });
    // Red de seguridad: si rAF viene throttleado (pestaña en segundo plano),
    // fija el valor final para no quedar congelado a medias.
    const safety = setTimeout(() => mv.set(value), 1800);
    return () => {
      controls.stop();
      clearTimeout(safety);
    };
  }, [inView, reduce, value, mv, text]);

  if (text) {
    return <span ref={ref}>{text}</span>;
  }

  return <motion.span ref={ref}>{rounded}</motion.span>;
}
