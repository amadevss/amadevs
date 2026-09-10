"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, type PointerEvent } from "react";
import RotatingRoles from "../motion/RotatingRoles";
import { profile, projects } from "@/lib/content";

const stats = [
  { emoji: "📅", k: "+8", v: "años" },
  { emoji: "🚀", k: `+${projects.length}`, v: "proyectos" },
  { emoji: "🎤", k: "+12", v: "charlas" },
];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // 3D de la tarjeta ligado al scroll.
  const yCard = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -90]);
  const rotYCard = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 24]);
  const rotXCard = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -12]);
  const scaleCard = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.86]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 60]);

  // Parallax por puntero.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const pxSpring = useSpring(mx, { stiffness: 120, damping: 18 });
  const pySpring = useSpring(my, { stiffness: 120, damping: 18 });

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (reduce || e.pointerType === "touch") return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    my.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  }
  function onPointerLeave() {
    mx.set(0);
    my.set(0);
  }

  const cardTiltY = useTransform(pxSpring, [-1, 1], [-12, 12]);
  const cardTiltX = useTransform(pySpring, [-1, 1], [10, -10]);
  const glowX = useTransform(pxSpring, [-1, 1], [-24, 24]);
  const glowYNeg = useTransform(glowY, (v) => -v);

  const cardRotateY = useTransform([rotYCard, cardTiltY], (v: number[]) => v[0] + v[1]);
  const cardRotateX = useTransform([rotXCard, cardTiltX], (v: number[]) => v[0] + v[1]);

  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative pt-10 pb-10 sm:pt-14 sm:pb-16"
    >
      <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Texto */}
        <div className="[perspective:1200px]">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="eyebrow"
          >
            📍 {profile.location} · <span className="font-mono">@{profile.handle}</span>
          </motion.p>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 24, rotateX: -14 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 0.84, 0.44, 1], delay: 0.05 }}
            className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ transformPerspective: 1200 }}
          >
            {profile.name}
          </motion.h1>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-3 text-2xl font-semibold sm:text-3xl"
          >
            <RotatingRoles items={profile.roles} />
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted"
          >
            {profile.tagline}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a href="#contacto" className="btn btn-primary">
              💬 Hablemos
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a href="#proyectos" className="btn btn-ghost">
              🚀 Ver proyectos
            </a>
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-6 flex items-center gap-2 text-sm text-subtle"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            ✈️ {profile.availability}
          </motion.p>
        </div>

        {/* Retrato con 3D ligado al scroll y al puntero */}
        <div className="relative mx-auto w-full max-w-sm [perspective:1100px]">
          {/* Resplandores de acento (dentro de la columna, nunca se recortan) */}
          <motion.div
            aria-hidden
            style={{ y: glowY, x: glowX }}
            className="absolute -bottom-6 -left-6 -z-10 h-36 w-36 rounded-full blur-3xl"
          >
            <div
              className="h-full w-full rounded-full"
              style={{ background: "radial-gradient(circle,rgba(139,92,246,0.55),transparent 70%)" }}
            />
          </motion.div>
          <motion.div
            aria-hidden
            style={{ y: glowYNeg }}
            className="absolute -right-6 -top-6 -z-10 h-28 w-28 rounded-full blur-3xl"
          >
            <div
              className="h-full w-full rounded-full"
              style={{ background: "radial-gradient(circle,rgba(240,145,59,0.55),transparent 70%)" }}
            />
          </motion.div>

          <motion.div style={{ y: yCard }} className="relative">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.16, 0.84, 0.44, 1] }}
              className="surface-card relative overflow-hidden p-4"
              style={{
                rotateY: cardRotateY,
                rotateX: cardRotateX,
                scale: scaleCard,
                transformStyle: "preserve-3d",
              }}
            >
              <div className="absolute inset-x-0 top-0 z-10 h-1" style={{ background: "var(--grad)" }} />

              <div
                className="relative w-full overflow-hidden rounded-2xl"
                style={{ transform: "translateZ(40px)" }}
              >
                <div className="rounded-2xl p-[3px]" style={{ background: "var(--grad)" }}>
                  <div className="relative overflow-hidden rounded-[calc(1rem-3px)] bg-black">
                    <Image
                      src="/profile.png"
                      alt={`Retrato de ${profile.name}`}
                      width={540}
                      height={675}
                      priority
                      className="aspect-[4/5] w-full object-cover object-top"
                    />
                    {/* Badge sobre la foto, arriba */}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
