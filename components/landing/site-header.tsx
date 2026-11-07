"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";

export function SiteHeader({ kitUrl }: { kitUrl: string }) {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setSolid(v > 40);
    setHidden(v > 600 && v > prev + 4);
    if (v < prev - 4) setHidden(false);
  });
  return (
    <motion.header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${solid ? "bg-[#0D0D0F]/95 md:bg-[#0D0D0F]/80 md:backdrop-blur-md" : ""}`}
      animate={{ y: hidden ? -80 : 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-8 px-5 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2 text-[#F4F1EA]" aria-label="Nir, inicio">
          <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden fill="none">
            <rect width="32" height="32" rx="8" fill="#FA1F6F" />
            <circle cx="11" cy="16" r="2.6" fill="#141416" />
            <path d="M16 10.5a7.8 7.8 0 0 1 0 11M20.5 7a12.6 12.6 0 0 1 0 18" stroke="#141416" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
          <span className="text-[20px] font-semibold tracking-tight">nir</span>
        </Link>
        <nav className="hidden gap-7 text-[15px] text-[#F4F1EA]/65 md:flex" aria-label="Principal">
          <a href="#la-tarjeta" className="transition-colors hover:text-[#F4F1EA]">La tarjeta</a>
          <a href="#plantillas" className="transition-colors hover:text-[#F4F1EA]">Plantillas</a>
          <a href="#instalacion" className="transition-colors hover:text-[#F4F1EA]">Instalación</a>
          <a href="#preguntas" className="transition-colors hover:text-[#F4F1EA]">Preguntas</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/entrar" className="rounded-full px-4 py-2 text-[15px] text-[#F4F1EA]/80 transition-colors hover:text-[#F4F1EA]">
            Entrar
          </Link>
          <a href={kitUrl} target="_blank" rel="noopener" className="rounded-full bg-[#F4F1EA] px-4 py-2 text-[15px] font-semibold text-[#141416] transition-transform hover:scale-[1.03]">
            Pide tu kit
          </a>
        </div>
      </div>
    </motion.header>
  );
}
