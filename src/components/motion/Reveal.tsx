"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Retraso en segundos (para stagger manual). */
  delay?: number;
  /** Desplazamiento inicial en Y. */
  y?: number;
  /** Inclinación 3D inicial en grados (rotateX). */
  tilt?: number;
  as?: "div" | "section" | "article" | "li" | "ul" | "header" | "span";
  once?: boolean;
};

export default function Reveal({
  children,
  className,
  delay = 0,
  y = 44,
  tilt = 16,
  as = "div",
  once = true,
}: Props) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  const variants: Variants = reduce
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.3 } },
      }
    : {
        hidden: { opacity: 0, y, rotateX: -tilt, scale: 0.94 },
        show: {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          transition: { duration: 0.7, delay, ease: [0.16, 0.84, 0.44, 1] },
        },
      };

  return (
    <MotionTag
      className={className}
      style={reduce ? undefined : { transformPerspective: 900 }}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.15, margin: "0px 0px -12% 0px" }}
    >
      {children}
    </MotionTag>
  );
}
