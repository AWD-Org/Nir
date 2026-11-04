"use client";

import { animate, motion, MotionConfig, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Respeta "reducir movimiento": sin desplazamientos, solo opacidad. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Aparece al entrar en pantalla (una sola vez). */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </M>
  );
}

/** Título que sube palabra por palabra detrás de una máscara. */
export function WordsReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: delay + i * 0.06 }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Cifra que cuenta desde cero al aparecer. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString("es-MX"));
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, { duration: Math.min(1.2, 0.4 + value / 400), ease: EASE });
    return () => c.stop();
  }, [inView, value, mv]);
  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}
