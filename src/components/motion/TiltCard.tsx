"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { type PointerEvent, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Grados máximos de inclinación. */
  max?: number;
  /** Elevación (px) en translateZ al pasar el puntero. */
  lift?: number;
};

export default function TiltCard({ children, className, max = 9, lift = 32 }: Props) {
  const reduce = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 220, damping: 22 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 220, damping: 22 });
  const z = useSpring(0, { stiffness: 220, damping: 22 });

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType === "touch") return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function onEnter() {
    if (!reduce) z.set(lift);
  }

  function onLeave() {
    px.set(0.5);
    py.set(0.5);
    z.set(0);
  }

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      style={{
        rotateX: rx,
        rotateY: ry,
        z,
        transformPerspective: 900,
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </motion.div>
  );
}
