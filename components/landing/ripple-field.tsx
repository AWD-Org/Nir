"use client";

import { useRef, useState } from "react";

/** Detalle de deleite: el cursor emite ondas NFC sobre el cierre. */
export function RippleField({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [rings, setRings] = useState<{ id: number; x: number; y: number }[]>([]);
  const last = useRef(0);
  const id = useRef(0);
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const now = performance.now();
        if (now - last.current < 140) return;
        last.current = now;
        const r = e.currentTarget.getBoundingClientRect();
        const ring = { id: id.current++, x: e.clientX - r.left, y: e.clientY - r.top };
        setRings((rs) => [...rs.slice(-10), ring]);
        setTimeout(() => setRings((rs) => rs.filter((x) => x.id !== ring.id)), 1600);
      }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {rings.map((r) => (
          <span key={r.id} className="nir-ripple absolute h-10 w-10 rounded-full border border-[#FA1F6F]" style={{ left: r.x - 20, top: r.y - 20 }} />
        ))}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
