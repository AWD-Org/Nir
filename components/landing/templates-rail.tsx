"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PublicView } from "@/components/public/public-view";
import { Phone } from "@/components/ui/phone";
import { demoPage } from "@/lib/demo";
import { TEMPLATE_LIST } from "@/lib/themes";

/** Carril horizontal de plantillas que avanza con el scroll vertical (escritorio). */
export function TemplatesRail() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.05, 0.95], ["0%", "-52%"]);
  // El carril solo avanza con el scroll vertical en escritorio. En celular se desliza con el dedo
  // y no debe moverse solo (antes se recorría y dejaba los teléfonos cortados).
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <section ref={ref} className="relative lg:h-[260vh]" aria-labelledby="tpl-title">
      <div className="lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-start lg:overflow-hidden lg:pt-24">
        <div className="mx-auto w-full max-w-[1280px] px-5 pt-24 md:px-10 lg:pt-4">
          <h2 id="tpl-title" className="max-w-[22ch] text-[clamp(34px,4vw,56px)] font-semibold leading-[0.98] tracking-[-0.03em]">
            Se ve como tu negocio, no como una app.
          </h2>
          <p className="mt-4 max-w-[48ch] text-[17px] leading-relaxed text-[#F4F1EA]/65">
            Tres plantillas y tus colores. Si una combinación no se lee bien, Nir no te deja guardarla.
          </p>
        </div>
        <motion.div
          className="mt-10 flex snap-x snap-mandatory gap-8 overflow-x-auto px-5 pb-10 [scrollbar-width:none] md:px-10 lg:w-max lg:snap-none lg:overflow-visible lg:pl-[max(40px,calc((100vw-1280px)/2+40px))]"
          style={desktop ? { x } : undefined}
        >
          {TEMPLATE_LIST.map((t) => (
            <div key={t.id} className="flex shrink-0 snap-center items-end gap-8">
              <Phone interactive={false} className="shrink-0 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)] lg:-mb-20 lg:origin-top lg:scale-[0.86]">
                <PublicView page={demoPage(t.id)} mode="preview" />
              </Phone>
              <div className="hidden w-[260px] pb-6 lg:block">
                <h3 className="text-[34px] font-semibold tracking-tight">{t.name}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-[#F4F1EA]/65">{t.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
