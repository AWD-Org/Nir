"use client";

import { motion } from "motion/react";

const ROWS = [
  { title: "Precios y agotados", detail: "desde la lista, sin abrir el producto" },
  { title: "Fotos de tus platillos", detail: "se comprimen solas en el celular" },
  { title: "Diseño de tu página", detail: "3 plantillas y tus colores" },
  { title: "Visitas por mesa", detail: "por día, hora y medio de llegada" },
  { title: "Reseñas en Google", detail: "el mismo botón para todos" },
];

/** Lo que controla el dueño, en filas editoriales que entran con su línea. */
export function ControlRows() {
  return (
    <ul className="mt-14 border-t border-[#F4F1EA]/12">
      {ROWS.map((r, i) => (
        <motion.li
          key={r.title}
          className="group relative flex flex-col gap-1 border-b border-[#F4F1EA]/12 py-6 md:flex-row md:items-baseline md:justify-between"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
        >
          <span className="absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0 bg-[#FA1F6F] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" aria-hidden />
          <span className="text-[clamp(26px,3.6vw,48px)] font-semibold leading-tight tracking-[-0.02em] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2">
            {r.title}
          </span>
          <span className="text-[16px] text-[#F4F1EA]/55 md:text-right">{r.detail}</span>
        </motion.li>
      ))}
    </ul>
  );
}
