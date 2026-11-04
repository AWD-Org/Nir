"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { PublicView } from "@/components/public/public-view";
import { Phone } from "@/components/ui/phone";
import type { TemplateId } from "@/lib/domain/types";
import { demoPage } from "@/lib/demo";
import { TEMPLATE_LIST } from "@/lib/themes";

const EASE = [0.22, 1, 0.36, 1] as const;
// Un ciclo del motion graphic: la tarjeta se acerca, toca, salen las ondas y se retira.
const CYCLE = { duration: 4.2, repeat: Infinity, repeatDelay: 1.6, ease: EASE };

/**
 * Elemento firma de la landing: la página real de Nir, interactiva, con cambio de plantilla,
 * y el gesto de acercar la tarjeta NFC al celular como motion graphic.
 */
export function DemoPhone() {
  const [tpl, setTpl] = useState<TemplateId>("noche");
  return (
    <div className="relative">
      {/* Ondas de cercanía (motivo de marca), respirando muy lento */}
      <motion.svg
        className="pointer-events-none absolute left-1/2 top-[42%] -z-0 h-[760px] w-[760px] text-brand"
        style={{ x: "-50%", y: "-50%" }}
        viewBox="0 0 760 760"
        aria-hidden
        fill="none"
        animate={{ scale: [1, 1.035, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        {[150, 230, 310, 380].map((r, i) => (
          <circle key={r} cx="380" cy="380" r={r} stroke="currentColor" strokeOpacity={0.14 - i * 0.03} strokeWidth="1.5" />
        ))}
      </motion.svg>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 40, rotate: 2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
      >
        <div className="relative mx-auto w-[300px]">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
            <Phone>
              <PublicView key={tpl} page={demoPage(tpl)} mode="preview" />
            </Phone>
          </motion.div>

          {/* Punto de contacto: ondas al tocar */}
          <div className="pointer-events-none absolute bottom-[86px] left-[18px] z-30" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute -left-10 -top-10 h-20 w-20 rounded-full border-2 border-brand"
                animate={{ scale: [0.2, 0.2, 2.2, 2.2], opacity: [0, 0.8, 0, 0] }}
                transition={{ ...CYCLE, times: [0, 0.32, 0.72, 1], delay: 0.6 + i * 0.16 }}
              />
            ))}
          </div>

          {/* Tarjeta Nir de mesa */}
          <motion.div
            className="pointer-events-none absolute -left-20 bottom-12 z-40 hidden h-[86px] w-[136px] flex-col justify-between rounded-xl bg-ink p-3 text-white shadow-[0_18px_40px_-12px_rgba(18,18,20,0.55)] sm:flex"
            aria-hidden
            initial={{ x: -70, y: 50, rotate: -16, opacity: 0 }}
            animate={{ x: [-70, 34, 34, -70], y: [50, -6, -6, 50], rotate: [-16, -8, -8, -16], opacity: [0, 1, 1, 0] }}
            transition={{ ...CYCLE, times: [0, 0.3, 0.7, 1], delay: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-white/70">Cantina El Ejemplo</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M9 7a7 7 0 0 1 0 10M13 4a11 11 0 0 1 0 16" />
              </svg>
            </div>
            <div>
              <p className="text-[18px] font-semibold leading-none">Mesa 4</p>
              <p className="mt-1 text-[10px] text-white/60">Acerca tu celular</p>
            </div>
          </motion.div>
        </div>

        <div className="mt-6 flex justify-center gap-1.5" role="radiogroup" aria-label="Plantilla del ejemplo">
          {TEMPLATE_LIST.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={tpl === t.id}
              onClick={() => setTpl(t.id)}
              className="relative min-h-10 rounded-full border border-line-2 bg-surface px-4 text-sm font-medium text-ink-2 transition-colors hover:text-ink aria-checked:text-white"
            >
              {tpl === t.id && (
                <motion.span layoutId="tpl-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
              )}
              <span className="relative">{t.name}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-sm text-ink-2">Negocio de ejemplo. Tócalo como si fueras comensal.</p>
      </motion.div>
    </div>
  );
}
