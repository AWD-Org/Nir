"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Copy, Eye, EyeOff, FileUp, GripVertical, Loader2, Pencil, Plus, Smartphone, Star, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { PublicView } from "@/components/public/public-view";
import { Confirm } from "@/components/ui/confirm";
import { Phone } from "@/components/ui/phone";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { LIMITS, SUGGESTED_CATEGORIES, TAGS } from "@/lib/domain/constants";
import { centsToInput, formatPrice, parsePrice } from "@/lib/domain/money";
import { buildPublicPage } from "@/lib/domain/publish";
import type { MenuCategory, MenuDraft, MenuItem, Tenant } from "@/lib/domain/types";
import {
  addCategories,
  deleteCategory,
  deleteItem,
  duplicateItem,
  reorderCategories,
  reorderItems,
  saveCategory,
  saveItem,
  setAvailable,
  setFeatured,
  setPrice,
} from "@/app/admin/actions";
import { ImagePicker } from "./image-picker";
import { MenuImport } from "@/components/console/menu-import";

type Result = { ok: true; data?: unknown } | { ok: false; error: string };

export function MenuEditor({ tenant, initial, readOnly }: { tenant: Tenant; initial: MenuDraft; readOnly: boolean }) {
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState<{ id: string | null; categoryId: string } | null>(null);
  const [catDialog, setCatDialog] = useState<{ id: string | null; name: string; visible: boolean } | null>(null);
  const [confirmCat, setConfirmCat] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const cats = useMemo(
    () => Object.entries(draft.categories).sort(([, a], [, b]) => a.order - b.order),
    [draft.categories],
  );
  const itemsOf = (cid: string) =>
    Object.entries(draft.items)
      .filter(([, i]) => i.categoryId === cid)
      .sort(([, a], [, b]) => a.order - b.order);
  const count = Object.keys(draft.items).length;
  const preview = useMemo(() => buildPublicPage(tenant, draft), [tenant, draft]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function act(p: Promise<Result>, ok?: string) {
    const r = await p;
    if (!r.ok) toast.error(r.error);
    else if (ok) toast.success(ok);
    return r;
  }

  function onDragEnd(e: DragEndEvent) {
    const a = String(e.active.id);
    const o = e.over ? String(e.over.id) : null;
    if (!o || a === o) return;
    if (a.startsWith("cat:") && o.startsWith("cat:")) {
      const ids = cats.map(([id]) => id);
      const next = arrayMove(ids, ids.indexOf(a.slice(4)), ids.indexOf(o.slice(4)));
      setDraft((d) => ({ ...d, categories: Object.fromEntries(next.map((id, i) => [id, { ...d.categories[id], order: i }])) }));
      act(reorderCategories(next));
    }
    if (a.startsWith("item:") && o.startsWith("item:")) {
      const ia = draft.items[a.slice(5)];
      const io = draft.items[o.slice(5)];
      if (!ia || !io || ia.categoryId !== io.categoryId) return;
      const ids = itemsOf(ia.categoryId).map(([id]) => id);
      const next = arrayMove(ids, ids.indexOf(a.slice(5)), ids.indexOf(o.slice(5)));
      setDraft((d) => {
        const items = { ...d.items };
        next.forEach((id, i) => (items[id] = { ...items[id], order: i }));
        return { ...d, items };
      });
      act(reorderItems(next));
    }
  }

  const patchItem = (id: string, patch: Partial<MenuItem>) =>
    setDraft((d) => ({ ...d, items: { ...d.items, [id]: { ...d.items[id], ...patch } } }));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight">Carta</h1>
            <p className="mt-1 text-[15px] text-ink-2">
              <span className="num">{count}</span> de <span className="num">{LIMITS.items}</span> productos · los cambios se publican al guardar
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary lg:hidden" onClick={() => setShowPreview(true)}>
              <Smartphone className="h-4 w-4" /> Ver como comensal
            </button>
            {!readOnly && (
              <button className="btn-secondary" onClick={() => setShowImport(true)}>
                <FileUp className="h-4 w-4" /> Cargar desde archivo
              </button>
            )}
            {!readOnly && cats.length > 0 && (
              <button className="btn-secondary" onClick={() => setCatDialog({ id: null, name: "", visible: true })}>
                <Plus className="h-4 w-4" /> Categoría
              </button>
            )}
          </div>
        </div>

        {cats.length === 0 ? (
          <EmptyMenu readOnly={readOnly} onAdd={async (names) => {
            const r = await act(addCategories(names), "Categorías agregadas");
            if (r.ok && r.data) setDraft((d) => ({ ...d, categories: { ...d.categories, ...(r.data as Record<string, MenuCategory>) } }));
          }} onCustom={() => setCatDialog({ id: null, name: "", visible: true })} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={cats.map(([id]) => `cat:${id}`)} strategy={verticalListSortingStrategy}>
              <div className="mt-6 space-y-5">
                {cats.map(([cid, cat], ci) => (
                  <CategoryBlock
                    key={cid}
                    index={ci}
                    id={cid}
                    cat={cat}
                    readOnly={readOnly}
                    items={itemsOf(cid)}
                    onEditCat={() => setCatDialog({ id: cid, name: cat.name, visible: cat.visible })}
                    onToggleVisible={async () => {
                      setDraft((d) => ({ ...d, categories: { ...d.categories, [cid]: { ...cat, visible: !cat.visible } } }));
                      await act(saveCategory(cid, { name: cat.name, visible: !cat.visible }), cat.visible ? "Categoría oculta" : "Categoría visible");
                    }}
                    onDeleteCat={() => setConfirmCat(cid)}
                    onAddItem={() => setEditing({ id: null, categoryId: cid })}
                    onEditItem={(id) => setEditing({ id, categoryId: cid })}
                    onAvailable={async (id, v) => {
                      patchItem(id, { available: v });
                      const r = await act(setAvailable(id, v), v ? "Disponible" : "Marcado como agotado");
                      if (!r.ok) patchItem(id, { available: !v });
                    }}
                    onFeatured={async (id, v) => {
                      if (v && Object.values(draft.items).filter((i) => i.featured).length >= LIMITS.featured) {
                        toast.error(`Puedes tener hasta ${LIMITS.featured} favoritos de la casa. Quita uno para agregar otro.`);
                        return;
                      }
                      patchItem(id, { featured: v });
                      const r = await act(setFeatured(id, v), v ? "Agregado a favoritos de la casa" : "Quitado de favoritos");
                      if (!r.ok) patchItem(id, { featured: !v });
                    }}
                    onPrice={async (id, cents) => {
                      const prev = draft.items[id].priceCents;
                      patchItem(id, { priceCents: cents });
                      const r = await act(setPrice(id, cents), "Precio guardado");
                      if (!r.ok) patchItem(id, { priceCents: prev });
                      return r.ok;
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <p className="mb-3 text-center text-sm text-ink-2">Así lo ve el comensal</p>
          <Phone>
            <PublicView key={preview.theme.templateId} page={preview} mode="preview" />
          </Phone>
        </div>
      </aside>

      <Sheet
        open={showImport}
        onOpenChange={setShowImport}
        title="Cargar carta desde archivo"
        description="Pega o sube un CSV. Antes de cargar ves cómo queda y qué líneas tienen errores."
      >
        <MenuImport target="admin" currentItems={count} onDone={() => location.reload()} />
      </Sheet>

      <Sheet open={showPreview} onOpenChange={setShowPreview} title="Así lo ve el comensal">
        <div className="-mx-5 -my-5 h-[78dvh] overflow-y-auto [&_.min-h-dvh]:min-h-full">
          <PublicView page={preview} mode="preview" />
        </div>
      </Sheet>

      {editing && (
        <ItemSheet
          key={editing.id ?? `new-${editing.categoryId}`}
          id={editing.id}
          categoryId={editing.categoryId}
          draft={draft}
          readOnly={readOnly}
          onClose={() => setEditing(null)}
          onSaved={(id, item) => {
            setDraft((d) => {
              const exists = !!d.items[id];
              const order = exists && d.items[id].categoryId === item.categoryId ? d.items[id].order : Math.max(-1, ...Object.values(d.items).filter((i) => i.categoryId === item.categoryId).map((i) => i.order)) + 1;
              return { ...d, items: { ...d.items, [id]: { ...item, order } }, itemCount: exists ? d.itemCount : d.itemCount + 1 };
            });
            setEditing(null);
          }}
          onDeleted={(id) => {
            setDraft((d) => {
              const items = { ...d.items };
              delete items[id];
              return { ...d, items, itemCount: d.itemCount - 1 };
            });
            setEditing(null);
          }}
          onDuplicated={(id, item) => {
            setDraft((d) => ({ ...d, items: { ...d.items, [id]: item }, itemCount: d.itemCount + 1 }));
            setEditing({ id, categoryId: item.categoryId });
          }}
        />
      )}

      {catDialog && (
        <CategorySheet
          value={catDialog}
          onClose={() => setCatDialog(null)}
          onSaved={(id, c) => {
            setDraft((d) => {
              const order = d.categories[id]?.order ?? Math.max(-1, ...Object.values(d.categories).map((x) => x.order)) + 1;
              return { ...d, categories: { ...d.categories, [id]: { ...c, order } } };
            });
            setCatDialog(null);
          }}
        />
      )}

      <Confirm
        open={!!confirmCat}
        onOpenChange={(v) => !v && setConfirmCat(null)}
        title="¿Eliminar esta categoría?"
        description={
          confirmCat
            ? `Se eliminan también sus ${itemsOf(confirmCat).length} productos. Si solo quieres esconderla por un tiempo, usa el ojo para ocultarla.`
            : ""
        }
        confirmLabel="Eliminar categoría"
        onConfirm={async () => {
          const cid = confirmCat!;
          setConfirmCat(null);
          const r = await act(deleteCategory(cid), "Categoría eliminada");
          if (r.ok)
            setDraft((d) => {
              const categories = { ...d.categories };
              delete categories[cid];
              const items = Object.fromEntries(Object.entries(d.items).filter(([, i]) => i.categoryId !== cid));
              return { ...d, categories, items, itemCount: Object.keys(items).length };
            });
        }}
      />
    </div>
  );
}

/* ---------- Estado vacío ---------- */

function EmptyMenu({ readOnly, onAdd, onCustom }: { readOnly: boolean; onAdd: (n: string[]) => Promise<void>; onCustom: () => void }) {
  const [picked, setPicked] = useState<string[]>(["Entradas", "Platos fuertes", "Bebidas", "Postres"]);
  const [pending, start] = useTransition();
  return (
    <div className="panel mt-6 p-6">
      <h2 className="text-lg font-semibold">Empieza por las categorías</h2>
      <p className="mt-1 text-ink-2">Elige las que usas; después las renombras u ordenas como quieras.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED_CATEGORIES.map((n) => {
          const on = picked.includes(n);
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              disabled={readOnly}
              onClick={() => setPicked((p) => (on ? p.filter((x) => x !== n) : [...p, n]))}
              className={`min-h-10 rounded-full border px-4 text-[15px] transition-colors ${on ? "border-ink bg-ink text-white" : "border-line-2 bg-surface hover:border-ink"}`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <button className="btn-primary" disabled={readOnly || !picked.length || pending} onClick={() => start(() => onAdd(picked))}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Agregar {picked.length} categorías
        </button>
        <button className="btn-ghost" disabled={readOnly} onClick={onCustom}>Escribir otra</button>
      </div>
    </div>
  );
}

/* ---------- Categoría con sus productos ---------- */

function CategoryBlock({
  index,
  id,
  cat,
  items,
  readOnly,
  onEditCat,
  onToggleVisible,
  onDeleteCat,
  onAddItem,
  onEditItem,
  onAvailable,
  onFeatured,
  onPrice,
}: {
  index: number;
  id: string;
  cat: MenuCategory;
  items: [string, MenuItem][];
  readOnly: boolean;
  onEditCat: () => void;
  onToggleVisible: () => void;
  onDeleteCat: () => void;
  onAddItem: () => void;
  onEditItem: (id: string) => void;
  onAvailable: (id: string, v: boolean) => void;
  onFeatured: (id: string, v: boolean) => void;
  onPrice: (id: string, cents: number) => Promise<boolean>;
}) {
  const s = useSortable({ id: `cat:${id}`, disabled: readOnly });
  return (
    <section
      ref={s.setNodeRef}
      style={{ transform: CSS.Translate.toString(s.transform), transition: s.transition, "--i": Math.min(index, 6) } as React.CSSProperties}
      className={`panel anim-rise overflow-hidden ${s.isDragging ? "relative z-10 shadow-lg" : ""}`}
      aria-label={cat.name}
    >
      <header className="flex items-center gap-1 border-b border-line bg-paper/60 px-2 py-2">
        {!readOnly && (
          <button className="flex h-10 w-8 cursor-grab touch-none items-center justify-center text-ink-3 hover:text-ink" aria-label={`Mover categoría ${cat.name}`} {...s.attributes} {...s.listeners}>
            <GripVertical className="h-5 w-5" />
          </button>
        )}
        <h2 className={`flex-1 truncate px-1 text-[17px] font-semibold ${cat.visible ? "" : "text-ink-3"}`}>
          {cat.name}
          {!cat.visible && <span className="ml-2 text-sm font-normal">· oculta</span>}
        </h2>
        <span className="num px-2 text-sm text-ink-2">{items.length}</span>
        {!readOnly && (
          <>
            <button className="btn-ghost h-10 min-h-10 w-10 px-0" onClick={onToggleVisible} aria-label={cat.visible ? `Ocultar ${cat.name}` : `Mostrar ${cat.name}`} title={cat.visible ? "Ocultar" : "Mostrar"}>
              {cat.visible ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
            </button>
            <button className="btn-ghost h-10 min-h-10 w-10 px-0" onClick={onEditCat} aria-label={`Renombrar ${cat.name}`} title="Renombrar">
              <Pencil className="h-[18px] w-[18px]" />
            </button>
            <button className="btn-ghost h-10 min-h-10 w-10 px-0 hover:text-bad" onClick={onDeleteCat} aria-label={`Eliminar ${cat.name}`} title="Eliminar">
              <Trash2 className="h-[18px] w-[18px]" />
            </button>
          </>
        )}
      </header>

      <SortableContext items={items.map(([iid]) => `item:${iid}`)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-line">
          {items.map(([iid, item], n) => (
            <ItemRow key={iid} index={n} id={iid} item={item} readOnly={readOnly} onEdit={() => onEditItem(iid)} onAvailable={(v) => onAvailable(iid, v)} onFeatured={(v) => onFeatured(iid, v)} onPrice={(c) => onPrice(iid, c)} />
          ))}
        </ul>
      </SortableContext>
      {items.length === 0 && <p className="px-4 py-4 text-[15px] text-ink-2">Sin productos todavía.</p>}
      {!readOnly && (
        <button onClick={onAddItem} className="flex min-h-12 w-full items-center gap-2 border-t border-line px-4 text-[15px] font-medium text-brand-strong hover:bg-brand-tint">
          <Plus className="h-4 w-4" /> Agregar producto
        </button>
      )}
    </section>
  );
}

function ItemRow({
  index,
  id,
  item,
  readOnly,
  onEdit,
  onAvailable,
  onFeatured,
  onPrice,
}: {
  index: number;
  id: string;
  item: MenuItem;
  readOnly: boolean;
  onEdit: () => void;
  onAvailable: (v: boolean) => void;
  onFeatured: (v: boolean) => void;
  onPrice: (cents: number) => Promise<boolean>;
}) {
  const s = useSortable({ id: `item:${id}`, disabled: readOnly });
  return (
    <li
      ref={s.setNodeRef}
      style={{ transform: CSS.Translate.toString(s.transform), transition: s.transition, "--i": Math.min(index, 8) } as React.CSSProperties}
      className={`anim-rise flex items-center gap-2 bg-surface px-2 py-2 transition-[background-color] sm:gap-3 ${s.isDragging ? "relative z-10 shadow-lg" : ""}`}
    >
      {!readOnly && (
        <button className="flex h-10 w-7 shrink-0 cursor-grab touch-none items-center justify-center text-ink-3 hover:text-ink" aria-label={`Mover ${item.name}`} {...s.attributes} {...s.listeners}>
          <GripVertical className="h-[18px] w-[18px]" />
        </button>
      )}
      <button onClick={onEdit} className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-1 text-left hover:bg-paper/70">
        {item.imageId ? (
          <img src={`/img/${item.imageId}/thumb`} alt="" className={`h-11 w-11 shrink-0 rounded-md object-cover ${item.available ? "" : "grayscale"}`} />
        ) : (
          <span className="hidden h-11 w-11 shrink-0 rounded-md bg-paper sm:block" aria-hidden />
        )}
        <span className="min-w-0">
          <span className={`block truncate text-[15px] font-medium ${item.available ? "" : "text-ink-3 line-through"}`}>{item.name}</span>
          <span className="block truncate text-sm text-ink-2">
            {!item.available ? "Agotado" : item.variants.length ? item.variants.map((v) => `${v.name} ${formatPrice(v.priceCents)}`).join(" · ") : item.description || "Sin descripción"}
          </span>
        </span>
      </button>
      {item.variants.length === 0 ? (
        <PriceInput cents={item.priceCents} disabled={readOnly} name={item.name} onSave={onPrice} />
      ) : (
        <span className="num hidden w-24 text-right text-sm text-ink-2 sm:block">{item.variants.length} precios</span>
      )}
      <button
        type="button"
        onClick={() => onFeatured(!item.featured)}
        disabled={readOnly}
        aria-pressed={!!item.featured}
        aria-label={item.featured ? `Quitar ${item.name} de favoritos de la casa` : `Marcar ${item.name} como favorito de la casa`}
        title={item.featured ? "Favorito de la casa" : "Marcar como favorito de la casa"}
        className={`flex h-10 w-9 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-50 ${item.featured ? "text-[#D99A06]" : "text-ink-3 hover:text-ink"}`}
      >
        <Star className={`h-[18px] w-[18px] ${item.featured ? "anim-pop fill-current" : ""}`} />
      </button>
      <Switch checked={item.available} onCheckedChange={onAvailable} disabled={readOnly} label={`${item.name} disponible`} />
    </li>
  );
}

function PriceInput({ cents, disabled, name, onSave }: { cents: number; disabled: boolean; name: string; onSave: (c: number) => Promise<boolean> }) {
  const [value, setValue] = useState(centsToInput(cents));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const last = useRef(cents);

  async function commit() {
    const parsed = parsePrice(value);
    if (parsed === null) {
      setState("error");
      toast.error("Escribe un precio válido, por ejemplo 85 o 85.50.");
      setValue(centsToInput(last.current));
      return;
    }
    if (parsed === last.current) return;
    setState("saving");
    const ok = await onSave(parsed);
    if (ok) {
      last.current = parsed;
      setValue(centsToInput(parsed));
      setState("saved");
      setTimeout(() => setState("idle"), 1600);
    } else {
      setValue(centsToInput(last.current));
      setState("error");
    }
  }

  return (
    <div className="relative w-[88px] shrink-0 sm:w-24">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-ink-3">$</span>
      <input
        inputMode="decimal"
        aria-label={`Precio de ${name}`}
        disabled={disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className={`num h-10 w-full rounded-md border bg-surface pl-6 pr-7 text-right text-[15px] focus:outline-none focus:ring-2 focus:ring-ink/10 ${state === "error" ? "border-bad" : "border-line-2 focus:border-ink"}`}
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" aria-hidden>
        {state === "saving" && <Loader2 className="h-4 w-4 animate-spin text-ink-3" />}
        {state === "saved" && <Check className="anim-pop h-4 w-4 text-ok" />}
      </span>
    </div>
  );
}

/* ---------- Hoja de producto ---------- */

function ItemSheet({
  id,
  categoryId,
  draft,
  readOnly,
  onClose,
  onSaved,
  onDeleted,
  onDuplicated,
}: {
  id: string | null;
  categoryId: string;
  draft: MenuDraft;
  readOnly: boolean;
  onClose: () => void;
  onSaved: (id: string, item: MenuItem) => void;
  onDeleted: (id: string) => void;
  onDuplicated: (id: string, item: MenuItem) => void;
}) {
  const existing = id ? draft.items[id] : null;
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    description: existing?.description ?? "",
    categoryId: existing?.categoryId ?? categoryId,
    price: existing ? centsToInput(existing.priceCents) : "",
    variants: (existing?.variants ?? []).map((v) => ({ name: v.name, price: centsToInput(v.priceCents) })),
    tags: existing?.tags ?? [],
    imageId: existing?.imageId ?? null,
    available: existing?.available ?? true,
    featured: existing?.featured ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const cats = Object.entries(draft.categories).sort(([, a], [, b]) => a.order - b.order);

  function toInput() {
    const variants = form.variants.filter((v) => v.name.trim() || v.price.trim());
    const parsedVariants = variants.map((v) => ({ name: v.name.trim(), priceCents: parsePrice(v.price) }));
    if (parsedVariants.some((v) => v.priceCents === null || !v.name)) return { error: "Cada variante necesita nombre y precio." };
    const priceCents = parsedVariants.length ? parsedVariants[0].priceCents! : parsePrice(form.price);
    if (priceCents === null) return { error: "Escribe un precio válido, por ejemplo 85 o 85.50." };
    return {
      input: {
        categoryId: form.categoryId,
        name: form.name.trim(),
        description: form.description.trim(),
        priceCents,
        variants: parsedVariants as { name: string; priceCents: number }[],
        tags: form.tags,
        imageId: form.imageId,
        available: form.available,
        featured: form.featured,
      },
    };
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const r = toInput();
    if ("error" in r) return setError(r.error!);
    if (!r.input.name) return setError("Escribe el nombre del producto.");
    start(async () => {
      const res = await saveItem(id, r.input);
      if (!res.ok) return setError(res.error);
      toast.success(id ? "Producto guardado" : "Producto agregado");
      onSaved(res.data!.id, { ...r.input, order: existing?.order ?? 0 });
    });
  }

  return (
    <>
      <Sheet
        open
        onOpenChange={(v) => !v && onClose()}
        title={id ? "Editar producto" : "Nuevo producto"}
        footer={
          !readOnly && (
            <div className="flex items-center gap-2">
              {id && (
                <>
                  <button type="button" className="btn-ghost px-3 hover:text-bad" onClick={() => setConfirm(true)} aria-label="Eliminar producto">
                    <Trash2 className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-3"
                    aria-label="Duplicar producto"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const r = await duplicateItem(id);
                        if (!r.ok) return void toast.error(r.error);
                        const copy = { ...draft.items[id], name: `${draft.items[id].name} (copia)`.slice(0, 80) };
                        toast.success("Producto duplicado");
                        onDuplicated((r.data as { id: string }).id, copy);
                      })
                    }
                  >
                    <Copy className="h-[18px] w-[18px]" />
                  </button>
                </>
              )}
              <button form="item-form" className="btn-primary ml-auto min-w-36" disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {id ? "Guardar cambios" : "Agregar producto"}
              </button>
            </div>
          )
        }
      >
        <form id="item-form" onSubmit={submit} className="space-y-5">
          <fieldset disabled={readOnly} className="space-y-5">
            <div>
              <label htmlFor="i-name" className="label">Nombre</label>
              <input id="i-name" className="field" maxLength={80} value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus={!id} />
            </div>
            <div>
              <label htmlFor="i-desc" className="label">Descripción <span className="font-normal text-ink-2">(opcional)</span></label>
              <textarea id="i-desc" className="field min-h-20 resize-y" maxLength={280} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="i-cat" className="label">Categoría</label>
                <select id="i-cat" className="field" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                  {cats.map(([cid, c]) => (
                    <option key={cid} value={cid}>{c.name}</option>
                  ))}
                </select>
              </div>
              {form.variants.length === 0 && (
                <div>
                  <label htmlFor="i-price" className="label">Precio</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">$</span>
                    <input id="i-price" inputMode="decimal" className="field num pl-7" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="label mb-0">Variantes de precio</span>
                {form.variants.length < LIMITS.variants && (
                  <button
                    type="button"
                    className="text-sm font-medium text-brand-strong hover:underline"
                    onClick={() =>
                      set("variants", form.variants.length ? [...form.variants, { name: "", price: "" }] : [{ name: "Chico", price: form.price }, { name: "Grande", price: "" }])
                    }
                  >
                    + Agregar variante
                  </button>
                )}
              </div>
              <p className="hint mt-0.5">Por ejemplo chico y grande, o copa y botella. Se muestran todas.</p>
              {form.variants.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {form.variants.map((v, i) => (
                    <li key={i} className="flex gap-2">
                      <input aria-label={`Nombre de la variante ${i + 1}`} className="field flex-1" placeholder="Nombre" value={v.name} maxLength={30} onChange={(e) => set("variants", form.variants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                      <div className="relative w-28">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">$</span>
                        <input aria-label={`Precio de la variante ${i + 1}`} inputMode="decimal" className="field num pl-7" value={v.price} onChange={(e) => set("variants", form.variants.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
                      </div>
                      <button type="button" className="btn-ghost w-11 px-0" aria-label={`Quitar variante ${i + 1}`} onClick={() => set("variants", form.variants.filter((_, j) => j !== i))}>
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <span className="label">Etiquetas</span>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((t) => {
                  const on = form.tags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set("tags", on ? form.tags.filter((x) => x !== t.id) : [...form.tags, t.id])}
                      className={`min-h-9 rounded-full border px-3 text-sm ${on ? "border-ink bg-ink text-white" : "border-line-2 hover:border-ink"}`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <ImagePicker kind="item" label="Foto (opcional)" imageId={form.imageId} onChange={(imgId) => set("imageId", imgId)} onRemove={() => set("imageId", null)} disabled={readOnly} />

            <div className="flex items-center justify-between rounded-lg border border-line p-3">
              <div>
                <p className="font-medium">Disponible</p>
                <p className="text-sm text-ink-2">Apágalo cuando se acabe; se ve como agotado.</p>
              </div>
              <Switch checked={form.available} onCheckedChange={(v) => set("available", v)} label="Disponible" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-line p-3">
              <div>
                <p className="font-medium">Favorito de la casa</p>
                <p className="text-sm text-ink-2">Aparece arriba de la carta, antes de las categorías. Hasta {LIMITS.featured}.</p>
              </div>
              <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} label="Favorito de la casa" />
            </div>

            {error && <p role="alert" className="rounded-md border border-bad/20 bg-bad-tint px-3 py-2 text-[15px] text-bad">{error}</p>}
          </fieldset>
        </form>
      </Sheet>
      <Confirm
        open={confirm}
        onOpenChange={setConfirm}
        title="¿Eliminar este producto?"
        description={`"${existing?.name}" deja de aparecer en tu carta. Si solo se acabó, márcalo como agotado.`}
        confirmLabel="Eliminar producto"
        onConfirm={() =>
          start(async () => {
            const r = await deleteItem(id!);
            if (!r.ok) return void toast.error(r.error);
            toast.success("Producto eliminado");
            onDeleted(id!);
          })
        }
      />
    </>
  );
}

function CategorySheet({
  value,
  onClose,
  onSaved,
}: {
  value: { id: string | null; name: string; visible: boolean };
  onClose: () => void;
  onSaved: (id: string, c: { name: string; visible: boolean }) => void;
}) {
  const [name, setName] = useState(value.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Sheet
      open
      onOpenChange={(v) => !v && onClose()}
      title={value.id ? "Renombrar categoría" : "Nueva categoría"}
      footer={
        <button form="cat-form" className="btn-primary w-full" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar
        </button>
      }
    >
      <form
        id="cat-form"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          start(async () => {
            const r = await saveCategory(value.id, { name, visible: value.visible });
            if (!r.ok) return setError(r.error);
            toast.success("Categoría guardada");
            onSaved((r.data as { id: string }).id, { name: name.trim(), visible: value.visible });
          });
        }}
      >
        <label htmlFor="c-name" className="label">Nombre</label>
        <input id="c-name" className="field" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Por ejemplo, Mezcales" />
        {error && <p role="alert" className="mt-3 text-[15px] text-bad">{error}</p>}
      </form>
    </Sheet>
  );
}
