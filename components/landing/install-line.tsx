"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const STEPS = [
  { when: "Primera visita", time: "40 min", body: "Creamos tu cuenta contigo, cargamos tus primeros productos y tu página queda activa." },
  { when: "En 48 horas", time: "1 por mesa", body: "Llevamos e instalamos las tarjetas, ya grabadas y bloqueadas con la dirección de tu negocio." },
  { when: "Desde ese día", time: "tu celular", body: "Tú editas la carta cuando quieras. Si se pierde una tarjeta, la desactivamos y te hacemos otra." },
];

/** Instalación como una línea que se dibuja con el scroll. */
export function InstallLine({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const light = tone === "light";
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <div ref={ref} className="relative mt-16">
      <div className={`absolute left-0 right-0 top-[7px] hidden h-px md:block ${light ? "bg-[#141416]/15" : "bg-[#F4F1EA]/12"}`} aria-hidden />
      <motion.div className={`absolute left-0 right-0 top-[7px] hidden h-px origin-left md:block ${light ? "bg-[#D60451]" : "bg-[#FA1F6F]"}`} style={{ scaleX }} aria-hidden />
      <ol className="grid gap-12 md:grid-cols-3 md:gap-10">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.when}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.15 }}
            className="relative pl-7 md:pl-0 md:pt-10"
          >
            <span className={`absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 md:top-0 ${light ? "border-[#D60451] bg-[#F4F1EA]" : "border-[#FA1F6F] bg-[#0D0D0F]"}`} aria-hidden />
            <div className={`flex items-baseline justify-between gap-4 border-b pb-3 ${light ? "border-[#141416]/12" : "border-[#F4F1EA]/10"}`}>
              <h3 className="text-[22px] font-semibold tracking-tight">{s.when}</h3>
              <span className={`font-mono text-[14px] ${light ? "text-[#D60451]" : "text-[#FA1F6F]"}`}>{s.time}</span>
            </div>
            <p className={`mt-3 text-[16px] leading-relaxed ${light ? "text-[#141416]/70" : "text-[#F4F1EA]/65"}`}>{s.body}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
