"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

/** Párrafo que se enciende palabra por palabra al hacer scroll (opacidad mínima 0.55 para contraste). */
export function ScrollWords({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </Word>
      ))}
    </p>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.3, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      {children}{" "}
    </motion.span>
  );
}
