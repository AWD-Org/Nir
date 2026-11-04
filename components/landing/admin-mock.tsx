"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const BASE = [
  { name: "Guacamole con totopos", price: 95, on: true },
  { name: "Tostadas de tinga", price: 110, on: false },
  { name: "Mezcal espadín", price: 90, on: true },
  { name: "Agua de jamaica", price: 45, on: true },
];

// Guion del motion graphic: lo que hace un dueño entre servicio y servicio.
const SCRIPT: { row: number; change: "toggle" | "price"; price?: number; toast: string }[] = [
  { row: 1, change: "toggle", toast: "Disponible" },
  { row: 0, change: "price", price: 98, toast: "Precio guardado" },
  { row: 2, change: "toggle", toast: "Marcado como agotado" },
  { row: 1, change: "toggle", toast: "Marcado como agotado" },
  { row: 0, change: "price", price: 95, toast: "Precio guardado" },
  { row: 2, change: "toggle", toast: "Disponible" },
];

/** Fila real del admin animándose sola: precios y agotados cambiando en vivo. */
export function AdminMock() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [rows, setRows] = useState(BASE);
  const [step, setStep] = useState(-1);
  const [flash, setFlash] = useState<number | null>(null);

  useEffect(() => {
    if (!inView || reduce) return;
    const t = setInterval(() => setStep((s) => s + 1), 2200);
    return () => clearInterval(t);
  }, [inView, reduce]);

  useEffect(() => {
    if (step < 0) return;
    const a = SCRIPT[step % SCRIPT.length];
    setRows((r) => r.map((x, i) => (i !== a.row ? x : a.change === "toggle" ? { ...x, on: !x.on } : { ...x, price: a.price! })));
    setFlash(a.row);
    const t = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(t);
  }, [step]);

  const current = step >= 0 ? SCRIPT[step % SCRIPT.length] : null;

  return (
    <div ref={ref} className="relative" aria-hidden>
      <div className="panel overflow-hidden shadow-[0_24px_60px_-28px_rgba(18,18,20,0.35)]">
        <div className="flex items-center justify-between border-b border-line bg-paper/60 px-4 py-3">
          <span className="font-semibold">Botanas y mezcales</span>
          <span className="num text-sm text-ink-2">4</span>
        </div>
        <ul className="divide-y divide-line">
          {rows.map((r, i) => (
            <li key={r.name} className={`flex items-center gap-3 px-4 py-3 transition-colors duration-700 ${flash === i ? "bg-brand-tint" : ""}`}>
              <span className="h-10 w-10 shrink-0 rounded-md bg-paper" />
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[15px] font-medium transition-colors ${r.on ? "" : "text-ink-3 line-through"}`}>{r.name}</span>
                <span className="block text-sm text-ink-2">{r.on ? "Disponible" : "Agotado"}</span>
              </span>
              <span className="num relative flex h-10 w-20 items-center justify-end overflow-hidden rounded-md border border-line-2 px-2.5 text-[15px]">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={r.price}
                    initial={{ y: 18, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -18, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    ${r.price}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${r.on ? "bg-ok" : "bg-line-2"}`}>
                <motion.span
                  className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm"
                  animate={{ left: r.on ? 22 : 2 }}
                  transition={{ type: "spring", stiffness: 520, damping: 32 }}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
      <AnimatePresence>
        {current && (
          <motion.div
            key={step}
            className="absolute -bottom-5 left-1/2 rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-white shadow-lg"
            style={{ x: "-50%" }}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
          >
            {current.toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
