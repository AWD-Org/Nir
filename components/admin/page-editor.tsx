"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, Check, GripVertical, Loader2, Smartphone } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { PublicView } from "@/components/public/public-view";
import { SocialIcon } from "@/components/public/social-icons";
import { Phone } from "@/components/ui/phone";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { BUTTON_LABELS, SOCIAL_LABELS } from "@/lib/domain/constants";
import { buildPublicPage } from "@/lib/domain/publish";
import type { ButtonConfig, MenuDraft, MenuStyle, SocialKey, Tenant, TenantTheme } from "@/lib/domain/types";
import { MENU_STYLES, resolveTheme, TEMPLATE_LIST, TEMPLATES, themeIssues, type ResolvedTheme } from "@/lib/themes";
import { removeProfileImage, saveButtons, saveLinks, saveProfile, saveTheme, saveWifi } from "@/app/admin/actions";
import { ImagePicker } from "./image-picker";

type Result = { ok: true } | { ok: false; error: string };

export function PageEditor({ initial, draft, readOnly, hasCards }: { initial: Tenant; draft: MenuDraft; readOnly: boolean; hasCards: boolean }) {
  const [t, setT] = useState(initial);
  const [showPreview, setShowPreview] = useState(false);
  // Al elegir un estilo de carta, la vista previa abre la carta para verlo de inmediato.
  const [openMenu, setOpenMenu] = useState<{ view: "menu"; n: number } | undefined>();
  const showMenu = () => setOpenMenu((o) => ({ view: "menu", n: (o?.n ?? 0) + 1 }));
  const preview = useMemo(() => buildPublicPage(t, draft), [t, draft]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-semibold leading-tight">Página</h1>
            <p className="mt-1 text-[15px] text-ink-2">Lo que ve el comensal al acercar su celular a la tarjeta.</p>
          </div>
          <button className="btn-secondary lg:hidden" onClick={() => setShowPreview(true)}>
            <Smartphone className="h-4 w-4" /> Ver como comensal
          </button>
        </div>

        <ProfileSection t={t} setT={setT} readOnly={readOnly} hasCards={hasCards} />
        <LinksSection t={t} setT={setT} readOnly={readOnly} />
        <WifiSection t={t} setT={setT} readOnly={readOnly} />
        <ButtonsSection t={t} setT={setT} readOnly={readOnly} hasMenu={Object.values(draft.items).some((i) => draft.categories[i.categoryId]?.visible)} />
        <ThemeSection t={t} setT={setT} readOnly={readOnly} onMenuStyle={showMenu} />
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <p className="mb-3 text-center text-sm text-ink-2">Vista previa en vivo</p>
          <Phone>
            <PublicView key={preview.theme.templateId} page={preview} mode="preview" open={openMenu} />
          </Phone>
          <p className="mt-3 text-center text-sm text-ink-2">Se publica al guardar cada sección.</p>
        </div>
      </aside>

      <Sheet open={showPreview} onOpenChange={setShowPreview} title="Así lo ve el comensal">
        <div className="-mx-5 -my-5 h-[78dvh] overflow-y-auto [&_.min-h-dvh]:min-h-full">
          <PublicView page={preview} mode="preview" open={openMenu} />
        </div>
      </Sheet>
    </div>
  );
}

type SectionProps = { t: Tenant; setT: React.Dispatch<React.SetStateAction<Tenant>>; readOnly: boolean };

function Section({
  id,
  title,
  description,
  children,
  onSave,
  readOnly,
  dirty,
  disabledReason,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave?: () => Promise<Result>;
  readOnly: boolean;
  dirty?: boolean;
  disabledReason?: string | null;
}) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  return (
    <section id={id} className="panel anim-rise scroll-mt-24 p-5 sm:p-6" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-[15px] text-ink-2">{description}</p>}
      <fieldset disabled={readOnly} className="mt-5 space-y-4">{children}</fieldset>
      {onSave && !readOnly && (
        <div className="mt-5 flex items-center justify-end gap-3 border-t border-line pt-4">
          {disabledReason && <p className="mr-auto flex items-center gap-1.5 text-sm text-bad"><AlertTriangle className="h-4 w-4" />{disabledReason}</p>}
          {saved && !dirty && <span className="anim-pop flex items-center gap-1 text-sm text-ok"><Check className="h-4 w-4" />Publicado</span>}
          <button
            className="btn-primary"
            disabled={pending || !dirty || !!disabledReason}
            onClick={() =>
              start(async () => {
                const r = await onSave();
                if (!r.ok) toast.error(r.error);
                else {
                  toast.success("Guardado y publicado");
                  setSaved(true);
                }
              })
            }
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </button>
        </div>
      )}
    </section>
  );
}

function useDirty<T>(value: T) {
  const [base, setBase] = useState(() => JSON.stringify(value));
  return { dirty: JSON.stringify(value) !== base, reset: () => setBase(JSON.stringify(value)) };
}

/* ---------- Datos del negocio ---------- */

function ProfileSection({ t, setT, readOnly, hasCards }: SectionProps & { hasCards: boolean }) {
  const v = { name: t.name, phone: t.profile.phone, address: t.profile.address, hours: t.profile.hours };
  const d = useDirty(v);
  const set = (k: keyof typeof v, val: string) =>
    setT((x) => (k === "name" ? { ...x, name: val } : { ...x, profile: { ...x.profile, [k]: val } }));
  return (
    <Section
      id="datos"
      title="Datos del negocio"
      readOnly={readOnly}
      dirty={d.dirty}
      onSave={async () => {
        const r = await saveProfile(v);
        if (r.ok) d.reset();
        return r;
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <ImagePicker
          kind="logo"
          label="Logo"
          imageId={t.profile.logoImageId}
          disabled={readOnly}
          onChange={(id) => setT((x) => ({ ...x, profile: { ...x.profile, logoImageId: id } }))}
          onRemove={async () => {
            setT((x) => ({ ...x, profile: { ...x.profile, logoImageId: null } }));
            const r = await removeProfileImage("logo");
            if (!r.ok) toast.error(r.error);
          }}
        />
        <ImagePicker
          kind="cover"
          label="Portada"
          aspect="wide"
          imageId={t.profile.coverImageId}
          disabled={readOnly}
          onChange={(id) => setT((x) => ({ ...x, profile: { ...x.profile, coverImageId: id } }))}
          onRemove={async () => {
            setT((x) => ({ ...x, profile: { ...x.profile, coverImageId: null } }));
            const r = await removeProfileImage("cover");
            if (!r.ok) toast.error(r.error);
          }}
        />
      </div>
      <div>
        <label htmlFor="p-name" className="label">Nombre</label>
        <input id="p-name" className="field" maxLength={60} value={v.name} disabled={hasCards} onChange={(e) => set("name", e.target.value)} />
        {hasCards && <p className="hint">El nombre ya está en tus tarjetas. Para cambiarlo, escríbenos.</p>}
      </div>
      <div>
        <label htmlFor="p-hours" className="label">Horario</label>
        <input id="p-hours" className="field" maxLength={160} placeholder="Mar a dom, 13:00 a 23:00" value={v.hours} onChange={(e) => set("hours", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-address" className="label">Dirección</label>
          <input id="p-address" className="field" maxLength={160} placeholder="Calle, número y colonia" value={v.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <label htmlFor="p-phone" className="label">Teléfono</label>
          <input id="p-phone" className="field" type="tel" maxLength={30} value={v.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>
    </Section>
  );
}

/* ---------- Reseñas y redes ---------- */

const SOCIAL_FIELDS: { key: SocialKey; placeholder: string; hint?: string }[] = [
  { key: "instagram", placeholder: "@tunegocio" },
  { key: "facebook", placeholder: "tunegocio o enlace" },
  { key: "tiktok", placeholder: "@tunegocio" },
  { key: "whatsapp", placeholder: "52 55 1234 5678", hint: "Con lada del país. Abre un chat con tu negocio." },
];

function LinksSection({ t, setT, readOnly }: SectionProps) {
  const d = useDirty(t.links);
  const set = (k: keyof Tenant["links"], val: string) => setT((x) => ({ ...x, links: { ...x.links, [k]: val } }));
  return (
    <Section
      id="enlaces"
      title="Reseñas y redes sociales"
      description="Las redes que dejes vacías no se muestran."
      readOnly={readOnly}
      dirty={d.dirty}
      onSave={async () => {
        const r = await saveLinks(t.links);
        if (r.ok) d.reset();
        return r;
      }}
    >
      <div>
        <label htmlFor="l-review" className="label">Enlace para reseñas de Google</label>
        <input id="l-review" className="field" inputMode="url" placeholder="https://g.page/r/..." value={t.links.googleReviewUrl} onChange={(e) => set("googleReviewUrl", e.target.value)} />
        <p className="hint">
          En tu Perfil de Negocio de Google, toca &ldquo;Pedir reseñas&rdquo; y copia el enlace. El botón se muestra igual a todos tus comensales.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {SOCIAL_FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`l-${f.key}`} className="label flex items-center gap-2">
              <SocialIcon k={f.key} className="h-4 w-4" /> {SOCIAL_LABELS[f.key]}
            </label>
            <input id={`l-${f.key}`} className="field" placeholder={f.placeholder} value={t.links[f.key]} onChange={(e) => set(f.key, e.target.value)} inputMode={f.key === "whatsapp" ? "tel" : "text"} />
            {f.hint && <p className="hint">{f.hint}</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Wi-Fi ---------- */

function WifiSection({ t, setT, readOnly }: SectionProps) {
  const d = useDirty(t.wifi);
  const set = (patch: Partial<Tenant["wifi"]>) => setT((x) => ({ ...x, wifi: { ...x.wifi, ...patch } }));
  return (
    <Section
      id="wifi"
      title="Wi-Fi"
      readOnly={readOnly}
      dirty={d.dirty}
      onSave={async () => {
        const r = await saveWifi(t.wifi);
        if (r.ok) d.reset();
        return r;
      }}
    >
      <div className="flex items-center justify-between gap-4 rounded-lg border border-line p-3">
        <div>
          <p className="font-medium">Mostrar el botón de Wi-Fi</p>
          <p className="text-sm text-ink-2">Cualquiera que abra tu página verá la red y la contraseña.</p>
        </div>
        <Switch checked={t.wifi.enabled} onCheckedChange={(v) => set({ enabled: v })} label="Mostrar Wi-Fi" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="w-ssid" className="label">Nombre de la red</label>
          <input id="w-ssid" className="field" maxLength={32} value={t.wifi.ssid} onChange={(e) => set({ ssid: e.target.value })} />
        </div>
        <div>
          <label htmlFor="w-pass" className="label">Contraseña</label>
          <input id="w-pass" className="field num" maxLength={63} value={t.wifi.password} onChange={(e) => set({ password: e.target.value })} autoComplete="off" />
        </div>
      </div>
    </Section>
  );
}

/* ---------- Orden de botones ---------- */

function ButtonsSection({ t, setT, readOnly, hasMenu }: SectionProps & { hasMenu: boolean }) {
  const d = useDirty(t.buttons);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const keys = t.buttons.map((b) => b.key as string);
    setT((x) => ({ ...x, buttons: arrayMove(x.buttons, keys.indexOf(String(e.active.id)), keys.indexOf(String(e.over!.id))) }));
  };
  const missing = (b: ButtonConfig) =>
    b.key === "menu" && !hasMenu
      ? "Agrega productos a tu carta para que aparezca"
      : b.key === "reviews" && !t.links.googleReviewUrl
      ? "Falta el enlace de reseñas"
      : b.key === "social" && !["instagram", "facebook", "tiktok", "whatsapp"].some((k) => t.links[k as SocialKey])
        ? "Agrega al menos una red"
        : b.key === "wifi" && !(t.wifi.enabled && t.wifi.ssid)
          ? "Activa el Wi-Fi arriba"
          : null;
  return (
    <Section
      id="botones"
      title="Botones"
      description="Arrastra para cambiar el orden. Los botones sin información no se muestran."
      readOnly={readOnly}
      dirty={d.dirty}
      onSave={async () => {
        const r = await saveButtons(t.buttons);
        if (r.ok) d.reset();
        return r;
      }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={t.buttons.map((b) => b.key)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {t.buttons.map((b) => (
              <ButtonRow
                key={b.key}
                b={b}
                note={b.enabled ? missing(b) : null}
                readOnly={readOnly}
                onToggle={(v) => setT((x) => ({ ...x, buttons: x.buttons.map((y) => (y.key === b.key ? { ...y, enabled: v } : y)) }))}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </Section>
  );
}

function ButtonRow({ b, note, readOnly, onToggle }: { b: ButtonConfig; note: string | null; readOnly: boolean; onToggle: (v: boolean) => void }) {
  const s = useSortable({ id: b.key, disabled: readOnly });
  return (
    <li ref={s.setNodeRef} style={{ transform: CSS.Translate.toString(s.transform), transition: s.transition }} className={`flex items-center gap-3 bg-surface px-2 py-2 ${s.isDragging ? "relative z-10 shadow-lg" : ""}`}>
      <button className="flex h-10 w-8 cursor-grab touch-none items-center justify-center text-ink-3 hover:text-ink" aria-label={`Mover ${BUTTON_LABELS[b.key]}`} {...s.attributes} {...s.listeners}>
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <p className="font-medium">{BUTTON_LABELS[b.key]}</p>
        {note && <p className="text-sm text-warn">{note}</p>}
      </div>
      <Switch checked={b.enabled} onCheckedChange={onToggle} label={`Mostrar ${BUTTON_LABELS[b.key]}`} />
    </li>
  );
}

/* ---------- Diseño por plantillas (RF15) ---------- */

function ThemeSection({ t, setT, readOnly, onMenuStyle }: SectionProps & { onMenuStyle: () => void }) {
  const d = useDirty(t.theme);
  const issues = themeIssues(t.theme);
  const set = (patch: Partial<TenantTheme>) => setT((x) => ({ ...x, theme: { ...x.theme, ...patch } }));
  return (
    <Section
      id="diseno"
      title="Diseño"
      description="Elige una plantilla, ajusta los colores a tu marca y escoge cómo se acomoda tu carta."
      readOnly={readOnly}
      dirty={d.dirty}
      disabledReason={issues[0] ?? null}
      onSave={async () => {
        const r = await saveTheme(t.theme);
        if (r.ok) d.reset();
        return r;
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Plantilla">
        {TEMPLATE_LIST.map((tpl) => {
          const on = t.theme.templateId === tpl.id;
          const r = resolveTheme({ templateId: tpl.id, ...tpl.defaults });
          return (
            <button
              key={tpl.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => set({ templateId: tpl.id, ...TEMPLATES[tpl.id].defaults })}
              className={`overflow-hidden rounded-lg border-2 text-left transition-colors ${on ? "border-ink" : "border-line hover:border-line-2"}`}
            >
              <div className="flex h-24 flex-col justify-end gap-1.5 p-3" style={{ background: r.bg }}>
                <span className="text-[17px] leading-none" style={{ fontFamily: tpl.displayFont, color: r.text, textTransform: tpl.uppercaseDisplay ? "uppercase" : undefined, fontWeight: tpl.id === "noche" ? 800 : 400 }}>
                  Carta
                </span>
                <span className="block h-5 w-full border-[1.5px]" style={{ background: r.buttonBg, borderColor: r.buttonBorder, borderRadius: tpl.radius }} />
              </div>
              <div className="border-t border-line bg-surface px-3 py-2">
                <p className="text-[15px] font-medium">{tpl.name}</p>
                <p className="text-[13px] leading-snug text-ink-2">{tpl.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField key={`p-${t.theme.templateId}`} id="th-primary" label={t.theme.templateId === "noche" ? "Color de fondo" : "Color principal"} value={t.theme.primaryColor} onChange={(v) => set({ primaryColor: v })} />
        <ColorField key={`a-${t.theme.templateId}`} id="th-accent" label={t.theme.templateId === "noche" ? "Color de botones" : "Color de precios"} value={t.theme.accentColor} onChange={(v) => set({ accentColor: v })} />
      </div>
      <div>
        <p className="label">Estilo de la carta</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Estilo de la carta">
          {MENU_STYLES.map((m) => {
            const on = (MENU_STYLES.some((x) => x.id === t.theme.menuStyle) ? t.theme.menuStyle : "lista") === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  set({ menuStyle: m.id });
                  onMenuStyle();
                }}
                className={`overflow-hidden rounded-lg border-2 text-left transition-colors ${on ? "border-ink" : "border-line hover:border-line-2"}`}
              >
                <MenuStyleThumb style={m.id} r={resolveTheme(t.theme)} />
                <div className="border-t border-line bg-surface px-3 py-2">
                  <p className="text-[15px] font-medium">{m.name}</p>
                  <p className="text-[13px] leading-snug text-ink-2">{m.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label}: selector`}
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => {
            setText(e.target.value.toUpperCase());
            onChange(e.target.value.toUpperCase());
          }}
          className="h-11 w-14 cursor-pointer rounded-md border border-line-2 bg-surface p-1"
        />
        <input
          id={id}
          className="field num uppercase"
          maxLength={7}
          value={text}
          onChange={(e) => {
            const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            setText(v);
            if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v.toUpperCase());
          }}
        />
      </div>
    </div>
  );
}

/** Dibujo esquemático de cada estilo de carta, con los colores de la plantilla elegida. */
function MenuStyleThumb({ style, r }: { style: MenuStyle; r: ResolvedTheme }) {
  const bar = (w: string, o = 1) => <span className="block h-1.5 rounded-full" style={{ width: w, background: r.text, opacity: o }} />;
  const price = <span className="block h-1.5 w-5 shrink-0 rounded-full" style={{ background: r.accent }} />;
  const photo = (cls: string) => <span className={`block shrink-0 ${cls}`} style={{ background: r.text, opacity: 0.14, borderRadius: 4 }} />;
  return (
    <div className="flex h-24 flex-col justify-center gap-2 px-3" style={{ background: r.bg }} aria-hidden>
      {style === "lista" &&
        [0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <div className="flex justify-between gap-2">{bar("55%")}{price}</div>
              {bar("70%", 0.35)}
            </div>
            {photo("h-5 w-5")}
          </div>
        ))}
      {style === "clasica" &&
        [0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            {bar(i === 1 ? "38%" : "30%")}
            <span className="flex-1 border-b-2 border-dotted" style={{ borderColor: r.text, opacity: 0.3 }} />
            {price}
          </div>
        ))}
      {style === "cuadricula" && (
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1">
              {photo("aspect-square w-full")}
              {bar("80%")}
              {price}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
