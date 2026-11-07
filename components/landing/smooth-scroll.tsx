"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/** Scroll suave con inercia (Lenis) en escritorio. No se activa en pantallas táctiles ni con "reducir movimiento". */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // En celulares y tabletas el scroll nativo con inercia es más fluido; Lenis solo para mouse y trackpad.
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const lenis = new Lenis({ autoRaf: true, anchors: { offset: -64 }, lerp: 0.11 });
    return () => lenis.destroy();
  }, []);
  return null;
}
