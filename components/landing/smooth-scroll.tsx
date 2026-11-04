"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/** Scroll suave con inercia (Lenis). No se activa con "reducir movimiento". */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, anchors: { offset: -64 }, lerp: 0.11 });
    return () => lenis.destroy();
  }, []);
  return null;
}
