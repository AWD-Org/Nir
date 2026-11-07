"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, Download, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Confirm } from "@/components/ui/confirm";
import { TAGS } from "@/lib/domain/constants";
import { IMPORT_TEMPLATE, parseMenuCsv, sameCategory } from "@/lib/domain/menu-import";
import { formatPrice } from "@/lib/domain/money";
import { importMenu } from "@/app/console/actions";
import { importMyMenu } from "@/app/admin/actions";

const TAG_LABEL = Object.fromEntries(TAGS.map((t) => [t.id, t.label]));

/** Cargar la carta de un negocio pegando o subiendo un CSV, con vista previa y errores por línea. */
export function MenuImport({
  tenantId,
  currentItems,
  target = "console",
  onDone,
}: {
  tenantId?: string;
  currentItems: number;
  /** console: AMOXTLI® carga la carta de un negocio. admin: el dueño (o soporte viendo como él) carga la suya. */
  target?: "console" | "admin";
  onDone?: () => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"append" | "replace">(currentItems ? "append" : "replace");
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const parsed = useMemo(() => (text.trim() ? parseMenuCsv(text) : null), [text]);

  const grouped = useMemo(() => {
    if (!parsed) return [];
    return parsed.categories.map((c) => ({ name: c, items: parsed.items.filter((i) => sameCategory(i.category, c)) }));
  }, [parsed]);

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob(["﻿" + IMPORT_TEMPLATE], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "nir-plantilla-carta.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  function load() {
    start(async () => {
      const r = target === "admin" ? await importMyMenu(text, mode) : await importMenu(tenantId!, text, mode);
      if (!r.ok) return void toast.error(r.error);
      const d = r.data!;
      toast.success(`Carta cargada: ${d.imported} productos. Ahora tiene ${d.items} productos en ${d.categories} categorías.`);
      setText("");
      if (onDone) onDone();
      else router.refresh();
    });
  }

  const ready = parsed && parsed.items.length > 0 && parsed.errors.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
          <FileUp className="h-4 w-4" /> Subir archivo CSV
        </button>
        <button type="button" className="btn-ghost" onClick={downloadTemplate}>
          <Download className="h-4 w-4" /> Descargar plantilla
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt,text/csv,text/plain"
          className="sr-only"
          tabIndex={-1}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setText(await f.text());
            e.target.value = "";
          }}
        />
      </div>

      <div>
        <label htmlFor="menu-csv" className="label">O pega aquí el contenido</label>
        <textarea
          id="menu-csv"
          className="field num min-h-36 resize-y text-[13px] leading-relaxed"
          placeholder={IMPORT_TEMPLATE}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
        <p className="hint">Columnas: categoria, producto, descripcion, precio, variantes (Copa:90|Botella:1200), etiquetas (picante|vegetariano), disponible (si/no).</p>
      </div>

      {parsed && (
        <div className="anim-rise space-y-3">
          <p className="text-[15px]">
            <span className="num font-semibold">{parsed.items.length}</span> productos en <span className="num font-semibold">{parsed.categories.length}</span> categorías
            {parsed.errors.length > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-bad">{parsed.errors.length} errores</span>
              </>
            )}
          </p>

          {parsed.errors.length > 0 && (
            <ul className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-bad/20 bg-bad-tint p-3 text-sm text-bad">
              {parsed.errors.map((e, i) => (
                <li key={i} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <span className="num">Línea {e.line}:</span> {e.message}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {grouped.length > 0 && (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-line">
              {grouped.map((g) => (
                <section key={g.name}>
                  <h4 className="sticky top-0 border-b border-line bg-paper px-3 py-2 text-sm font-semibold">
                    {g.name} <span className="num font-normal text-ink-2">· {g.items.length}</span>
                  </h4>
                  <ul className="divide-y divide-line">
                    {g.items.map((i, n) => (
                      <li key={n} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                        <span className="min-w-0">
                          <span className={`font-medium ${i.available ? "" : "text-ink-3 line-through"}`}>{i.name}</span>
                          {i.description && <span className="block truncate text-ink-2">{i.description}</span>}
                          {i.tags.length > 0 && <span className="block text-ink-2">{i.tags.map((t) => TAG_LABEL[t]).join(" · ")}</span>}
                        </span>
                        <span className="num shrink-0 text-right">
                          {i.variants.length ? i.variants.map((v) => `${v.name} ${formatPrice(v.priceCents)}`).join(" · ") : formatPrice(i.priceCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <fieldset className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
            <legend className="sr-only">Qué hacer con la carta actual</legend>
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" className="h-4 w-4 accent-[#D60451]" checked={mode === "append"} onChange={() => setMode("append")} />
              Agregar a la carta actual <span className="num text-ink-2">({currentItems} productos)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" className="h-4 w-4 accent-[#D60451]" checked={mode === "replace"} onChange={() => setMode("replace")} />
              Reemplazar la carta completa
            </label>
          </fieldset>

          <button className="btn-dark" disabled={!ready || pending} onClick={() => (mode === "replace" && currentItems > 0 ? setConfirm(true) : load())}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Cargar {parsed.items.length} productos
          </button>
        </div>
      )}

      <Confirm
        open={confirm}
        onOpenChange={setConfirm}
        title="¿Reemplazar la carta completa?"
        description={`Se borran los ${currentItems} productos actuales (con sus fotos asignadas) y queda solo lo del archivo. La página se publica al instante.`}
        confirmLabel="Reemplazar carta"
        onConfirm={load}
      />
    </div>
  );
}
