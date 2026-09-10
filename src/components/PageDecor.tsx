"use client";

import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "motion/react";

/**
 * Capa ambiental fija con manchas de color que se desplazan según el scroll.
 * Va en un contenedor `fixed` sin `overflow-hidden`, así los degradados nunca
 * se recortan: simplemente se desvanecen fuera del viewport.
 */
export default function PageDecor() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const p = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.4 });

  const y1 = useTransform(p, [0, 1], reduce ? ["0vh", "0vh"] : ["6vh", "-40vh"]);
  const y2 = useTransform(p, [0, 1], reduce ? ["0vh", "0vh"] : ["-4vh", "32vh"]);
  const y3 = useTransform(p, [0, 1], reduce ? ["0vh", "0vh"] : ["4vh", "-24vh"]);
  const x1 = useTransform(p, [0, 1], reduce ? ["0vw", "0vw"] : ["-2vw", "6vw"]);
  const x2 = useTransform(p, [0, 1], reduce ? ["0vw", "0vw"] : ["3vw", "-5vw"]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <motion.div
        style={{ y: y1, x: x1 }}
        className="absolute left-[6%] top-[10%] h-[46vh] w-[46vh] rounded-full blur-[90px]"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.30),transparent_65%)]" />
      </motion.div>
      <motion.div
        style={{ y: y2, x: x2 }}
        className="absolute right-[4%] top-[34%] h-[52vh] w-[52vh] rounded-full blur-[100px]"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(58,160,255,0.24),transparent_65%)]" />
      </motion.div>
      <motion.div
        style={{ y: y3 }}
        className="absolute bottom-[6%] left-[30%] h-[40vh] w-[40vh] rounded-full blur-[90px]"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(240,145,59,0.22),transparent_65%)]" />
      </motion.div>
    </div>
  );
}
