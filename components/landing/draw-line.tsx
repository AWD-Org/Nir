"use client";

import { motion } from "motion/react";

/** Línea de recorrido que se dibuja al entrar en pantalla: toque → carta → reseña. */
export function DrawLine({ className = "" }: { className?: string }) {
  return (
    <div className={`relative hidden h-6 md:block ${className}`} aria-hidden>
      <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
      <motion.div
        className="absolute left-0 top-1/2 h-[2px] w-full origin-left bg-brand-strong"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
      {[1 / 6, 3 / 6, 5 / 6].map((x, i) => (
        <motion.span
          key={x}
          className="absolute top-1/2 h-3 w-3 rounded-full border-2 border-brand-strong bg-surface"
          style={{ left: `${x * 100}%`, x: "-50%", y: "-50%" }}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ type: "spring", stiffness: 500, damping: 22, delay: 0.35 + i * 0.45 }}
        />
      ))}
    </div>
  );
}
