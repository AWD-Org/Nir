"use client";

import { useState } from "react";
import { PublicView } from "@/components/public/public-view";
import { Phone } from "@/components/ui/phone";
import type { TemplateId } from "@/lib/domain/types";
import { demoPage } from "@/lib/demo";
import { TEMPLATE_LIST } from "@/lib/themes";

/** Elemento firma de la landing: la página real de Nir, interactiva, con cambio de plantilla. */
export function DemoPhone() {
  const [tpl, setTpl] = useState<TemplateId>("noche");
  return (
    <div className="relative">
      <svg className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 text-brand" viewBox="0 0 760 760" aria-hidden fill="none">
        {[150, 230, 310, 380].map((r, i) => (
          <circle key={r} cx="380" cy="380" r={r} stroke="currentColor" strokeOpacity={0.14 - i * 0.03} strokeWidth="1.5" />
        ))}
      </svg>
      <div className="relative z-10">
        <Phone>
          <PublicView key={tpl} page={demoPage(tpl)} mode="preview" />
        </Phone>
        <div className="mt-5 flex justify-center gap-1.5" role="radiogroup" aria-label="Plantilla del ejemplo">
          {TEMPLATE_LIST.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={tpl === t.id}
              onClick={() => setTpl(t.id)}
              className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-colors ${tpl === t.id ? "border-ink bg-ink text-white" : "border-line-2 bg-surface text-ink-2 hover:text-ink"}`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-sm text-ink-2">Negocio de ejemplo. Tócalo como si fueras comensal.</p>
      </div>
    </div>
  );
}
