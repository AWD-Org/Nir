"use client";

import { motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { NirCard } from "./nir-card";

/** La tarjeta física en 3D: se inclina con el cursor y se voltea para mostrar el QR. */
export function Card3D() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const reduce = useReducedMotion();
  const [back, setBack] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [14, -14]), { stiffness: 160, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-18, 18]), { stiffness: 160, damping: 18 });
  const flip = useSpring(0, { stiffness: 90, damping: 16 });
  const rotY = useTransform([ry, flip], ([a, f]) => (a as number) + (f as number));
  const shine = useTransform(mx, (v) => `linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.55) ${(v + 0.5) * 100}%, transparent 80%)`);
  const shadowScale = useTransform(rx, [-14, 14], [0.9, 1.1]);

  useEffect(() => flip.set(back ? 180 : 0), [back, flip]);
  // Se voltea sola una vez cuando entra en pantalla, para mostrar que tiene reverso.
  useEffect(() => {
    if (!inView || reduce) return;
    const a = setTimeout(() => setBack(true), 1400);
    const b = setTimeout(() => setBack(false), 3600);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [inView, reduce]);

  return (
    <div
      ref={ref}
      className="relative flex flex-col items-center [perspective:1400px]"
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <motion.div className="relative w-[min(86vw,520px)] [transform-style:preserve-3d]" style={{ rotateX: rx, rotateY: rotY }}>
        <div className="[backface-visibility:hidden]">
          <NirCard side="front" table={12} />
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[6%/9.5%] mix-blend-soft-light"
            style={{ background: shine }}
            aria-hidden
          />
        </div>
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <NirCard side="back" table={12} />
        </div>
      </motion.div>
      <motion.div className="mt-10 h-6 w-[60%] rounded-[50%] bg-black/60 blur-xl" style={{ scaleX: shadowScale }} aria-hidden />
      <button
        onClick={() => setBack((b) => !b)}
        className="mt-4 rounded-full border border-[#F4F1EA]/20 px-4 py-2 text-[14px] text-[#F4F1EA]/80 transition-colors hover:border-[#F4F1EA]/50 hover:text-[#F4F1EA]"
      >
        {back ? "Ver el frente" : "Ver el reverso"}
      </button>
    </div>
  );
}
