"use client";

import { useState } from "react";

/**
 * Barras verticales de una sola serie (sin leyenda: el título la nombra).
 * Barras delgadas, extremo redondeado de 4px anclado a la base, 2px de separación,
 * tooltip al pasar el cursor o enfocar, y tabla equivalente para lectores de pantalla.
 */
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const FORMATS = {
  day: (k: string) => `${Number(k.slice(6, 8))} ${MONTHS[Number(k.slice(4, 6)) - 1]}`,
  plain: (k: string) => k,
};

export function Bars({
  data,
  label,
  kind = "plain",
  tickEvery = 1,
}: {
  data: { label: string; value: number }[];
  label: string;
  /** "day" convierte AAAAMMDD en "3 nov". Se pasa como texto porque viene de un Server Component. */
  kind?: keyof typeof FORMATS;
  tickEvery?: number;
}) {
  const format = FORMATS[kind];
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <div className="relative">
        <div className="flex h-40 items-end gap-[2px]" role="img" aria-label={`${label}. Máximo ${max}.`} onMouseLeave={() => setHover(null)}>
          {data.map((d, i) => (
            <button
              key={d.label}
              type="button"
              className="group relative flex h-full flex-1 items-end focus:outline-none"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${format(d.label)}: ${d.value}`}
            >
              <span
                className={`block w-full rounded-t-[4px] transition-colors ${hover === i ? "bg-ink" : "bg-brand-strong/85"}`}
                style={{ height: d.value ? `${Math.max(2, (d.value / max) * 100)}%` : "2px", opacity: d.value ? 1 : 0.25 }}
              />
            </button>
          ))}
        </div>
        {hover !== null && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-sm text-white shadow"
            style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
          >
            {format(data[hover].label)} · <span className="num font-semibold">{data[hover].value}</span>
          </div>
        )}
        <div className="mt-2 flex gap-[2px] border-t border-line pt-1.5 text-[12px] text-ink-2">
          {data.map((d, i) => (
            <span key={d.label} className="flex-1 text-center num">
              {i % tickEvery === 0 ? format(d.label).split(" ")[0] : ""}
            </span>
          ))}
        </div>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-ink-2 hover:text-ink">Ver como tabla</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="border-b border-line text-ink-2"><th className="py-1 font-medium">{label}</th><th className="py-1 text-right font-medium">Visitas</th></tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b border-line/60"><td className="py-1">{format(d.label)}</td><td className="num py-1 text-right">{d.value}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Barras horizontales con etiqueta directa y valor en tinta (no en el color de la barra). */
export function HBars({ rows, empty = "Sin datos en este rango." }: { rows: { label: string; value: number }[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((a, r) => a + r.value, 0);
  if (!total) return <p className="text-[15px] text-ink-2">{empty}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${r.value}`}>
          <div className="flex items-baseline justify-between gap-3 text-[15px]">
            <span>{r.label}</span>
            <span className="num text-ink">
              {r.value} <span className="text-ink-2">· {Math.round((r.value / total) * 100)}%</span>
            </span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-paper">
            <div className="h-2 rounded-full bg-brand-strong/85" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
