"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export default function RotatingRoles({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const longest = items.reduce((a, b) => (a.length >= b.length ? a : b));

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((v) => (v + 1) % items.length), 2600);
    return () => clearInterval(id);
  }, [items.length, reduce]);

  if (reduce) {
    return <span className="text-gradient font-display">{items.join(" · ")}</span>;
  }

  return (
    <span className="relative inline-grid overflow-hidden py-[0.12em] align-bottom leading-[1.25] [perspective:600px]">
      {/* Reserva de ancho y alto: el más largo, invisible */}
      <span className="invisible col-start-1 row-start-1 font-display font-semibold leading-[1.25]" aria-hidden>
        {longest}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={items[i]}
          className="text-gradient col-start-1 row-start-1 font-display font-semibold leading-[1.25]"
          initial={{ y: "0.55em", opacity: 0, rotateX: -42 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          exit={{ y: "-0.55em", opacity: 0, rotateX: 42 }}
          transition={{ duration: 0.45, ease: [0.16, 0.84, 0.44, 1] }}
        >
          {items[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
