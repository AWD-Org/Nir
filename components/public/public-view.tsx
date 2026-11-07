"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { BUTTON_LABELS, SOCIAL_LABELS, TAGS } from "@/lib/domain/constants";
import { formatPrice } from "@/lib/domain/money";
import { socialHref } from "@/lib/domain/publish";
import type { ButtonKey, MenuStyle, PublicCategory, PublicItem, PublicPage, SocialKey } from "@/lib/domain/types";
import { resolveTheme } from "@/lib/themes";
import { SocialIcon } from "./social-icons";

export type View = "home" | "menu" | "social" | "wifi";
const HASH: Record<View, string> = { home: "", menu: "#carta", social: "#redes", wifi: "#wifi" };
const fromHash = (h: string): View => (h === "#carta" ? "menu" : h === "#redes" ? "social" : h === "#wifi" ? "wifi" : "home");
const TAG_LABEL = Object.fromEntries(TAGS.map((t) => [t.id, t.label]));

/** Colores de la plantilla para lo que se dibuja fuera de la raíz (la ficha del producto). */
const ThemeVars = createContext<CSSProperties>({});

export const imgSrc = (id: string, size: "thumb" | "full") => `/img/${id}/${size}`;

interface Props {
  page: PublicPage;
  /** live: página real (historial y estadísticas). preview: vista previa del admin o de la landing. */
  mode?: "live" | "preview";
  /** Para vistas previas que muestran imágenes aún no guardadas. */
  resolveImage?: (id: string, size: "thumb" | "full") => string;
  /** Solo vistas previas: controla la sección desde fuera (historia animada de la landing). */
  forceView?: View;
  /** Botón resaltado (por ejemplo, el de reseñas en la historia de la landing). */
  highlight?: ButtonKey;
  /** Solo vistas previas: abre una sección cada vez que cambia `n` (el comensal puede seguir navegando). */
  open?: { view: View; n: number };
}

export function PublicView({ page, mode = "live", resolveImage, forceView, highlight, open }: Props) {
  const theme = useMemo(() => resolveTheme(page.theme), [page.theme]);
  const [ownView, setView] = useState<View>("home");
  const view = mode === "preview" && forceView ? forceView : ownView;
  useEffect(() => {
    if (open && mode === "preview") setView(open.view);
  }, [open?.n]); // eslint-disable-line react-hooks/exhaustive-deps
  const lastForced = useRef(forceView);
  if (forceView !== lastForced.current) {
    lastForced.current = forceView;
  }
  // Dirección de la transición: entrar a una sección desliza desde la derecha; volver, desde la izquierda.
  const moved = useRef(false);
  if (forceView && forceView !== "home") moved.current = true;
  const anim = !moved.current ? "" : view === "home" ? "anim-in-left" : "anim-in-right";
  const tracker = useTracker(page.slug, mode === "live");
  const img = resolveImage ?? imgSrc;
  const rootRef = useRef<HTMLDivElement>(null);

  // Navegación con el botón "atrás" del celular.
  useEffect(() => {
    if (mode !== "live") return;
    setView(fromHash(location.hash));
    const sync = () => {
      moved.current = true;
      setView(fromHash(location.hash));
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [mode]);

  const go = useCallback(
    (v: View) => {
      moved.current = true;
      if (mode === "live") {
        if (v === "home") history.back();
        else history.pushState(null, "", HASH[v]);
        window.scrollTo({ top: 0 });
      } else {
        rootRef.current?.scrollTo?.({ top: 0 });
      }
      setView(v);
    },
    [mode],
  );

  const style = {
    "--bg": theme.bg,
    "--text": theme.text,
    "--muted": theme.muted,
    "--surface": theme.surface,
    "--line": theme.line,
    "--btn-bg": theme.buttonBg,
    "--btn-text": theme.buttonText,
    "--btn-border": theme.buttonBorder,
    "--accent": theme.accent,
    "--header-bg": theme.headerBg,
    "--header-text": theme.headerText,
    "--radius": theme.template.radius,
    "--display": theme.template.displayFont,
    "--body": theme.template.bodyFont,
    backgroundColor: theme.bg,
    color: theme.text,
    fontFamily: theme.template.bodyFont,
  } as CSSProperties;

  const displayClass = theme.template.uppercaseDisplay ? "uppercase tracking-[0.01em]" : "";

  return (
    <ThemeVars.Provider value={style}>
    <div ref={rootRef} style={style} className="anim-fade min-h-full w-full overflow-x-clip" data-template={theme.template.id}>
      {mode === "live" && (
        // El navegador del celular pinta su barra superior, la inferior y el rebote del scroll con el fondo del documento.
        <style>{`html,body{background:${theme.bg};color-scheme:${isDark(theme.bg) ? "dark" : "light"}}`}</style>
      )}
      <div key={view} className={`mx-auto flex min-h-dvh w-full max-w-[480px] flex-col ${anim}`}>
        {view === "home" && (
          <Home page={page} displayClass={displayClass} img={img} go={go} tracker={tracker} template={theme.template.id} live={mode === "live"} highlight={highlight} />
        )}
        {view === "menu" && <MenuSection page={page} displayClass={displayClass} img={img} back={() => go("home")} mode={mode} />}
        {view === "social" && <SocialSection page={page} displayClass={displayClass} back={() => go("home")} tracker={tracker} />}
        {view === "wifi" && <WifiSection page={page} displayClass={displayClass} back={() => go("home")} />}
      </div>
    </div>
    </ThemeVars.Provider>
  );
}

/* ---------- Inicio tipo Linktree ---------- */

function Home({
  page,
  displayClass,
  img,
  go,
  tracker,
  template,
  live,
  highlight,
}: {
  page: PublicPage;
  displayClass: string;
  img: (id: string, s: "thumb" | "full") => string;
  go: (v: View) => void;
  tracker: Tracker;
  template: string;
  live: boolean;
  highlight?: ButtonKey;
}) {
  const hasCover = !!page.coverImageId;
  // En vistas previas (admin, landing) el nombre no es el h1 de la página que lo contiene.
  const Title = live ? "h1" : "p";
  return (
    <>
      <header className="relative">
        {hasCover ? (
          <div className="aspect-[16/9] w-full overflow-hidden bg-[var(--surface)]">
            <img src={img(page.coverImageId!, "full")} alt="" className="h-full w-full object-cover" fetchPriority="high" />
          </div>
        ) : (
          <div className="h-28 w-full" style={{ background: "var(--header-bg)" }} />
        )}
        <div className="px-6">
          <div
            className="anim-pop -mt-12 h-24 w-24 overflow-hidden border-4 bg-[var(--surface)]"
            style={{ borderColor: "var(--bg)", borderRadius: template === "noche" ? "0" : "999px" }}
          >
            {page.logoImageId ? (
              <img src={img(page.logoImageId, "thumb")} alt={`Logo de ${page.name}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-semibold" style={{ fontFamily: "var(--display)" }}>
                {page.name.slice(0, 1)}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-6 pb-8 pt-4">
        <Title className={`anim-rise text-[34px] leading-[1.05] ${displayClass}`} style={{ fontFamily: "var(--display)", fontWeight: template === "noche" ? 800 : 400 }}>
          {page.name}
        </Title>
        {page.profile.hours && <p className="mt-2 text-[16px] text-[var(--muted)]">{page.profile.hours}</p>}

        <nav aria-label="Accesos" className="mt-7 flex flex-col gap-3">
          {page.buttons.map((key, i) => (
            <div key={key} className="anim-rise" style={{ "--i": i + 2 } as CSSProperties}>
              <LinkButton k={key} page={page} go={go} tracker={tracker} highlighted={highlight === key} />
            </div>
          ))}
          {page.buttons.length === 0 && (
            <p className="text-[16px] text-[var(--muted)]">Este negocio todavía no configura su página.</p>
          )}
        </nav>

        <footer className="mt-auto pt-10 text-[15px] leading-relaxed text-[var(--muted)]">
          {page.profile.address && <p>{page.profile.address}</p>}
          {page.profile.phone && (
            <p>
              <a className="underline underline-offset-4" href={`tel:${page.profile.phone.replace(/\s/g, "")}`}>
                {page.profile.phone}
              </a>
            </p>
          )}
          <p className="mt-6 text-[13px] opacity-80">
            Desarrollado por{" "}
            <a href="https://nir.amoxtli.tech" className="underline underline-offset-4">
              AMOXTLI®
            </a>
          </p>
        </footer>
      </main>
    </>
  );
}

const ICONS: Record<ButtonKey, React.ReactNode> = {
  menu: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M9 9h6M9 13h6" strokeLinecap="round" />
    </svg>
  ),
  reviews: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </svg>
  ),
  social: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
    </svg>
  ),
  wifi: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.8 16a5 5 0 0 1 6.4 0" />
      <circle cx="12" cy="19.2" r="1" fill="currentColor" />
    </svg>
  ),
};

function LinkButton({ k, page, go, tracker, highlighted }: { k: ButtonKey; page: PublicPage; go: (v: View) => void; tracker: Tracker; highlighted?: boolean }) {
  const cls =
    "flex min-h-14 w-full items-center gap-3 border-[1.5px] px-5 text-left text-[17px] font-medium transition-transform active:scale-[0.985]";
  const st: CSSProperties = {
    background: "var(--btn-bg)",
    color: "var(--btn-text)",
    borderColor: "var(--btn-border)",
    borderRadius: "var(--radius)",
    ...(highlighted ? { outline: "3px solid #FA1F6F", outlineOffset: "3px", transform: "scale(1.03)" } : {}),
    transition: "transform .35s cubic-bezier(.22,1,.36,1), outline-color .35s",
  };
  const content = (
    <>
      <span className="flex shrink-0">{ICONS[k]}</span>
      <span className="flex-1">{BUTTON_LABELS[k]}</span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        {k === "reviews" ? <path d="M7 17 17 7M9 7h8v8" /> : <path d="m9 6 6 6-6 6" />}
      </svg>
    </>
  );
  if (k === "reviews" && page.reviews) {
    return (
      <a href={page.reviews.url} target="_blank" rel="noopener" className={cls} style={st} onClick={() => tracker.click("reviews")}>
        {content}
      </a>
    );
  }
  const view: View = k === "menu" ? "menu" : k === "social" ? "social" : "wifi";
  return (
    <button
      type="button"
      className={cls}
      style={st}
      onClick={() => {
        tracker.click(k);
        go(view);
      }}
    >
      {content}
    </button>
  );
}

/* ---------- Secciones ---------- */

function SectionBar({ title, back, displayClass }: { title: string; back: () => void; displayClass: string }) {
  return (
    <div data-section-bar className="flex items-center gap-2 px-3 pb-2 pt-3">
      <button type="button" onClick={back} className="flex h-11 w-11 items-center justify-center" aria-label="Volver al inicio" style={{ borderRadius: "var(--radius)" }}>
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m15 6-6 6 6 6" />
        </svg>
      </button>
      <h2 className={`min-w-0 text-[24px] leading-tight ${displayClass}`} style={{ fontFamily: "var(--display)", fontWeight: displayClass ? 800 : 400 }}>
        {title}
      </h2>
    </div>
  );
}

function MenuSection({
  page,
  displayClass,
  img,
  back,
  mode,
}: {
  page: PublicPage;
  displayClass: string;
  img: (id: string, s: "thumb" | "full") => string;
  back: () => void;
  mode: "live" | "preview";
}) {
  const cats = page.menu.categories;
  const [active, setActive] = useState(cats[0]?.id);
  const [detail, setDetail] = useState<PublicItem | null>(null);
  const closeDetail = useCallback(() => setDetail(null), []);
  const mainRef = useRef<HTMLElement>(null);
  const style = page.theme.menuStyle ?? "lista";
  const chipsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  // Mientras se desplaza por un toque en una categoría, el observador no cambia la activa.
  const lockUntil = useRef(0);

  useEffect(() => {
    const els = cats.map((c) => document.getElementById(`cat-${c.id}`)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const scroller = scrollParent(els[0]);
    const offset = (barRef.current?.offsetHeight ?? 110) + 10;
    const io = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockUntil.current) return;
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id.replace("cat-", ""));
      },
      { root: scroller === window ? null : (scroller as HTMLElement), rootMargin: `-${offset}px 0px -55% 0px` },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [cats, mode]);

  // La barra de categorías se desplaza en horizontal sin mover la página
  // (scrollIntoView cancelaría el desplazamiento vertical en curso).
  useEffect(() => {
    const bar = chipsRef.current;
    const chip = bar?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    if (!bar || !chip) return;
    bar.scrollTo({ left: chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  const jump = (id: string) => {
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;
    setActive(id);
    lockUntil.current = Date.now() + 1000;
    const scroller = scrollParent(el);
    const offset = (barRef.current?.offsetHeight ?? 110) + 4;
    const isWin = scroller === window;
    const sc = scroller as HTMLElement;
    const current = isWin ? window.scrollY : sc.scrollTop;
    const view = isWin ? window.innerHeight : sc.clientHeight;
    const target = isWin
      ? el.getBoundingClientRect().top + window.scrollY - offset
      : el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - offset;
    // En cartas largas, salta casi al destino y termina con un desplazamiento corto y suave.
    if (Math.abs(target - current) > view * 1.5) {
      const near = target - Math.sign(target - current) * view * 0.6;
      if (isWin) window.scrollTo({ top: near, behavior: "instant" });
      else sc.scrollTo({ top: near, behavior: "instant" });
    }
    if (isWin) window.scrollTo({ top: target, behavior: "smooth" });
    else sc.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <>
      <div ref={barRef} data-sticky-bar className="sticky top-0 z-10" style={{ background: "var(--bg)" }}>
        <SectionBar title="Carta" back={back} displayClass={displayClass} />
        {cats.length > 1 && (
          <div ref={chipsRef} className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]" role="tablist" aria-label="Categorías">
            {cats.map((c) => {
              const on = c.id === active;
              return (
                <button
                  key={c.id}
                  data-cat={c.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => jump(c.id)}
                  className="shrink-0 whitespace-nowrap border px-4 py-2 text-[15px] font-medium"
                  style={{
                    borderRadius: "var(--radius)",
                    borderColor: on ? "var(--text)" : "var(--line)",
                    background: on ? "var(--text)" : "transparent",
                    color: on ? "var(--bg)" : "var(--text)",
                  }}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
        <div className="h-px w-full" style={{ background: "var(--line)" }} />
      </div>

      <main ref={mainRef} className="flex-1 px-4 pb-16">
        {cats.length === 0 && <p className="px-2 py-10 text-[16px] text-[var(--muted)]">La carta se está preparando.</p>}
        {cats.map((c) => (
          <CategoryBlock key={c.id} cat={c} style={style} displayClass={displayClass} img={img} onOpen={setDetail} />
        ))}
      </main>
      {detail && <ItemDetail item={detail} img={img} displayClass={displayClass} anchor={mainRef} onClose={closeDetail} />}
    </>
  );
}

type Img = (id: string, s: "thumb" | "full") => string;

const displayStyle = (displayClass: string): CSSProperties => ({ fontFamily: "var(--display)", fontWeight: displayClass ? 800 : 400 });
/** Las fotos no heredan el radio de píldora de algunas plantillas. */
const PHOTO_RADIUS = "min(var(--radius), 18px)";
const priceColor = (off: boolean) => ({ color: off ? "var(--muted)" : "var(--accent)" });
const fromPrice = (i: PublicItem) => (i.variants.length ? Math.min(...i.variants.map((v) => v.priceCents)) : i.priceCents);

/** Un producto se abre en su ficha con un toque (o Enter/espacio con teclado). */
const tap = (onOpen: () => void) => ({
  role: "button" as const,
  tabIndex: 0,
  onClick: onOpen,
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  },
});

/** Nombre del producto (el "recomendado" va como insignia junto a las etiquetas, no en el nombre). */
function Name({ item }: { item: PublicItem }) {
  return <>{item.name}</>;
}

/** Insignia "Recomendado": mismo tamaño y forma que las etiquetas, en el color de precios. */
function RecoBadge() {
  return (
    <span className="inline-flex items-center border px-2 py-0.5 text-[13px] font-semibold" style={{ borderRadius: "var(--radius)", borderColor: "var(--accent)", color: "var(--accent)" }}>
      <FavStar />
      Recomendado
    </span>
  );
}

function FavStar({ className = "-mt-0.5 mr-1 inline-block h-[0.85em] w-[0.85em] align-middle" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" style={{ color: "var(--accent)" }} aria-hidden="true">
      <path d="m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.1 6.4 20l1.1-6.2L3 9.4l6.2-.9z" />
    </svg>
  );
}

/** Ficha del producto: foto grande, descripción, variantes y etiquetas. Dentro del teléfono de la vista previa
 *  se dibuja en el teléfono; en la página real, sobre toda la pantalla. */
function ItemDetail({ item, img, displayClass, anchor, onClose }: { item: PublicItem; img: Img; displayClass: string; anchor: React.RefObject<HTMLElement | null>; onClose: () => void }) {
  const { backgroundColor: _bg, ...vars } = useContext(ThemeVars);
  void _bg;
  const [host, setHost] = useState<{ el: HTMLElement; inPhone: boolean } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const phone = anchor.current?.closest<HTMLElement>(".phone-screen") ?? null;
    setHost({ el: phone?.parentElement ?? document.body, inPhone: !!phone });
    const scroller = phone ?? document.documentElement;
    const prev = scroller.style.overflow;
    scroller.style.overflow = "hidden";
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      scroller.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [anchor, onClose]);
  useEffect(() => closeRef.current?.focus({ preventScroll: true }), [host]);

  if (!host) return null;
  const off = !item.available;
  return createPortal(
    <div className={`${host.inPhone ? "absolute" : "fixed"} inset-0 z-[80] flex flex-col justify-end`} style={vars} role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="anim-fade absolute inset-0 bg-black/55" onClick={onClose} aria-hidden />
      <div
        className="relative mx-auto max-h-[90%] w-full max-w-[480px] overflow-y-auto overscroll-contain"
        style={{ background: "var(--bg)", color: "var(--text)", borderRadius: "min(var(--radius), 22px) min(var(--radius), 22px) 0 0", animation: "sheet-up 0.34s cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <div className="sticky top-0 z-10 flex h-12 items-center justify-center">
          <span className="h-1 w-10 rounded-full" style={{ background: "var(--line)" }} aria-hidden />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="absolute right-2 top-1.5 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: "var(--bg)", color: "var(--text)" }}
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {item.imageId && (
          <div className="px-4">
            <img src={img(item.imageId, "full")} alt={item.name} className="aspect-[4/3] w-full object-cover" style={{ borderRadius: PHOTO_RADIUS, filter: off ? "grayscale(1)" : undefined }} />
          </div>
        )}
        <div className="px-5 pb-10 pt-4">
          {item.featured && (
            <p className="mb-1 flex items-center text-[13px] font-semibold" style={{ color: "var(--accent)" }}>
              <FavStar />
              Recomendado de la casa
            </p>
          )}
          <div className="flex items-baseline justify-between gap-4">
            <h2 className={`text-[28px] leading-[1.1] ${displayClass}`} style={displayStyle(displayClass)}>
              {item.name}
            </h2>
            {item.variants.length === 0 && (
              <span className="shrink-0 text-[20px] font-semibold tabular-nums" style={priceColor(off)}>
                {formatPrice(item.priceCents)}
              </span>
            )}
          </div>
          {item.description && <p className="mt-2 text-[16px] leading-relaxed text-[var(--muted)]">{item.description}</p>}
          {item.variants.length > 0 && (
            <ul className="mt-4 border-t" style={{ borderColor: "var(--line)" }}>
              {item.variants.map((v) => (
                <li key={v.name} className="flex items-baseline justify-between gap-4 border-b py-3 text-[16px]" style={{ borderColor: "var(--line)" }}>
                  <span>{v.name}</span>
                  <span className="font-semibold tabular-nums" style={priceColor(off)}>
                    {formatPrice(v.priceCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Badges item={item} />
        </div>
      </div>
    </div>,
    host.el,
  );
}

/** Un estilo desconocido o retirado se muestra como Lista. */
function CategoryBlock({ cat, style, displayClass, img, onOpen }: { cat: PublicCategory; style: MenuStyle; displayClass: string; img: Img; onOpen: (i: PublicItem) => void }) {
  if (style === "clasica") {
    return (
      <section id={`cat-${cat.id}`} className="pt-9">
        <h2 className={`flex items-center gap-4 px-2 text-center text-[22px] ${displayClass}`} style={displayStyle(displayClass)}>
          <span className="h-px flex-1" style={{ background: "var(--line)" }} />
          {cat.name}
          <span className="h-px flex-1" style={{ background: "var(--line)" }} />
        </h2>
        <ul className="mt-5 space-y-5 px-2">
          {cat.items.map((i, n) => (
            <ClassicItem key={i.id} item={i} index={n} onOpen={() => onOpen(i)} />
          ))}
        </ul>
      </section>
    );
  }
  if (style === "cuadricula") {
    return (
      <section id={`cat-${cat.id}`} className="pt-7">
        <h2 className={`px-1 text-[22px] ${displayClass}`} style={displayStyle(displayClass)}>
          {cat.name}
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-5">
          {cat.items.map((i, n) => (
            <GridItem key={i.id} item={i} index={n} img={img} displayClass={displayClass} textOnly={!cat.items.some((x) => x.imageId)} onOpen={() => onOpen(i)} />
          ))}
        </ul>
      </section>
    );
  }
  return (
    <section id={`cat-${cat.id}`} className="pt-6">
      <h2 className={`px-2 text-[22px] ${displayClass}`} style={displayStyle(displayClass)}>
        {cat.name}
      </h2>
      <ul className="mt-2">
        {cat.items.map((i, n) => (
          <ItemRow key={i.id} item={i} img={img} index={n} onOpen={() => onOpen(i)} />
        ))}
      </ul>
    </section>
  );
}

function Badges({ item }: { item: PublicItem }) {
  const off = !item.available;
  if (!item.tags.length && !off && !item.featured) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {item.featured && <RecoBadge />}
      {off && (
        <span className="border px-2 py-0.5 text-[13px] font-semibold" style={{ borderRadius: "var(--radius)", borderColor: "var(--text)" }}>
          Agotado
        </span>
      )}
      {item.tags.map((t) => (
        <span key={t} className="px-2 py-0.5 text-[13px]" style={{ background: "var(--surface)", borderRadius: "var(--radius)" }}>
          {TAG_LABEL[t] ?? t}
        </span>
      ))}
    </div>
  );
}

/** Carta impresa: nombre, línea punteada y precio; las variantes van en su propio renglón. */
function ClassicItem({ item, index, onOpen }: { item: PublicItem; index: number; onOpen: () => void }) {
  const off = !item.available;
  const leader = <span className="mb-[0.45em] min-w-6 flex-1 border-b-2 border-dotted" style={{ borderColor: "var(--line)" }} aria-hidden />;
  return (
    <li {...tap(onOpen)} className="anim-rise cursor-pointer" style={{ opacity: off ? 0.6 : 1, "--i": Math.min(index, 8) } as CSSProperties}>
      {/* items-end: si el nombre ocupa dos renglones, los puntos y el precio van con el último */}
      <div className="flex items-end gap-2">
        <h3 className={`text-[17px] font-semibold leading-snug ${off ? "line-through decoration-1" : ""}`}>
          <Name item={item} />
        </h3>
        {item.variants.length === 0 ? (
          <>
            {leader}
            <span className="shrink-0 text-[17px] font-semibold tabular-nums" style={priceColor(off)}>
              {formatPrice(item.priceCents)}
            </span>
          </>
        ) : (
          off && <span className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">Agotado</span>
        )}
      </div>
      {item.variants.length === 0 && off && <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">Agotado</p>}
      {item.description && <p className="mt-0.5 text-[15px] italic leading-relaxed text-[var(--muted)]">{item.description}</p>}
      {item.variants.length > 0 && (
        <ul className="mt-1.5 space-y-1 pl-3">
          {item.variants.map((v) => (
            <li key={v.name} className="flex items-baseline gap-2 text-[15px]">
              <span className="text-[var(--muted)]">{v.name}</span>
              {leader}
              <span className="shrink-0 font-semibold tabular-nums" style={priceColor(off)}>
                {formatPrice(v.priceCents)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {(item.tags.length > 0 || item.featured) && (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-[var(--muted)]">
          {item.featured && (
            <span className="inline-flex items-center font-semibold" style={{ color: "var(--accent)" }}>
              <FavStar />
              Recomendado
            </span>
          )}
          {item.featured && item.tags.length > 0 && <span aria-hidden>·</span>}
          {item.tags.length > 0 && <span>{item.tags.map((t) => TAG_LABEL[t] ?? t).join(" · ")}</span>}
        </p>
      )}
    </li>
  );
}

/** Foto del producto; si no tiene, un mosaico neutro con cubiertos para que la composición no tenga huecos. */
function PhotoOrInitial({ item, img, size, className }: { item: PublicItem; img: Img; size: "thumb" | "full"; className: string; displayClass?: string }) {
  const off = !item.available;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ borderRadius: PHOTO_RADIUS, background: "var(--surface)" }}>
      {item.imageId ? (
        <img
          src={img(item.imageId, size)}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          style={{ filter: off ? "grayscale(1)" : undefined }}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center"
          style={{ backgroundImage: "radial-gradient(var(--line) 1.2px, transparent 1.2px)", backgroundSize: "12px 12px", color: "var(--muted)" }}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-9 w-9 opacity-60" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 21V3c-2 1.5-3 4-3 7v3h3" />
          </svg>
        </span>
      )}
      {off && (
        <span className="absolute left-2 top-2 px-2 py-0.5 text-[12px] font-semibold" style={{ background: "var(--bg)", color: "var(--text)", borderRadius: "var(--radius)" }}>
          Agotado
        </span>
      )}
      {item.featured && (
        <span
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: "var(--bg)" }}
          role="img"
          aria-label="Recomendado de la casa"
        >
          <FavStar className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}

function GridItem({ item, index, img, displayClass, textOnly, onOpen }: { item: PublicItem; index: number; img: Img; displayClass: string; textOnly: boolean; onOpen: () => void }) {
  const off = !item.available;
  // Si ningún producto de la categoría tiene foto, la cuadrícula se arma con tarjetas de texto.
  if (textOnly) {
    return (
      <li
        {...tap(onOpen)}
        className="anim-rise relative flex min-h-[132px] min-w-0 cursor-pointer flex-col p-3"
        style={{ background: "var(--surface)", borderRadius: PHOTO_RADIUS, opacity: off ? 0.65 : 1, "--i": Math.min(index, 8) } as CSSProperties}
      >
        <h3 className={`line-clamp-3 text-[17px] leading-snug ${displayClass}`} style={displayStyle(displayClass)}>
          <Name item={item} />
        </h3>
        {item.description && <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--muted)]">{item.description}</p>}
        <p className="mt-auto flex items-center justify-between gap-2 pt-2 text-[15px] font-semibold tabular-nums" style={priceColor(off)}>
          {off ? <span className="text-[13px] uppercase tracking-wide">Agotado</span> : (
            <span>
              {item.variants.length > 0 && <span className="font-normal text-[var(--muted)]">desde </span>}
              {formatPrice(fromPrice(item))}
            </span>
          )}
          {item.featured && (
            <span role="img" aria-label="Recomendado de la casa">
              <FavStar className="h-4 w-4" />
            </span>
          )}
        </p>
      </li>
    );
  }
  return (
    <li {...tap(onOpen)} className="anim-rise flex min-w-0 cursor-pointer flex-col" style={{ opacity: off ? 0.65 : 1, "--i": Math.min(index, 8) } as CSSProperties}>
      <PhotoOrInitial item={item} img={img} size="thumb" className="aspect-square w-full" displayClass={displayClass} />
      <h3 className="mt-2 line-clamp-3 text-[15px] font-semibold leading-snug">
        <Name item={item} />
      </h3>
      {item.description && <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[var(--muted)]">{item.description}</p>}
      <p className="mt-1 text-[15px] font-semibold tabular-nums" style={priceColor(off)}>
        {item.variants.length > 0 && <span className="font-normal text-[var(--muted)]">desde </span>}
        {formatPrice(fromPrice(item))}
      </p>
    </li>
  );
}

function ItemRow({ item, img, index, onOpen }: { item: PublicItem; img: Img; index: number; onOpen: () => void }) {
  const off = !item.available;
  return (
    <li {...tap(onOpen)} className="anim-rise flex cursor-pointer gap-4 border-b px-2 py-4" style={{ borderColor: "var(--line)", opacity: off ? 0.6 : 1, "--i": Math.min(index, 8) } as CSSProperties}>
      <div className="min-w-0 flex-1">
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-[17px] font-semibold leading-snug">
            <Name item={item} />
          </h3>
          {item.variants.length === 0 && (
            <span className="shrink-0 text-[17px] font-semibold tabular-nums" style={{ color: off ? "var(--muted)" : "var(--accent)" }}>
              {formatPrice(item.priceCents)}
            </span>
          )}
        </div>
        {item.description && <p className="mt-1 text-[15px] leading-relaxed text-[var(--muted)]">{item.description}</p>}
        {item.variants.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
            {item.variants.map((v) => (
              <li key={v.name}>
                <span className="text-[var(--muted)]">{v.name}</span>{" "}
                <span className="font-semibold tabular-nums" style={{ color: off ? "var(--muted)" : "var(--accent)" }}>
                  {formatPrice(v.priceCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {(item.tags.length > 0 || off || item.featured) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.featured && <RecoBadge />}
            {off && (
              <span className="border px-2 py-0.5 text-[13px] font-semibold" style={{ borderRadius: "var(--radius)", borderColor: "var(--text)" }}>
                Agotado
              </span>
            )}
            {item.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 text-[13px]" style={{ background: "var(--surface)", borderRadius: "var(--radius)" }}>
                {TAG_LABEL[t] ?? t}
              </span>
            ))}
          </div>
        )}
      </div>
      {item.imageId && (
        <img
          src={img(item.imageId, "thumb")}
          alt={item.name}
          loading="lazy"
          decoding="async"
          width={88}
          height={88}
          className="h-[88px] w-[88px] shrink-0 object-cover"
          style={{ borderRadius: "calc(var(--radius) / 2)", filter: off ? "grayscale(1)" : undefined }}
        />
      )}
    </li>
  );
}

function SocialSection({ page, displayClass, back, tracker }: { page: PublicPage; displayClass: string; back: () => void; tracker: Tracker }) {
  const entries = Object.entries(page.social) as [SocialKey, string][];
  return (
    <>
      <SectionBar title="Redes sociales" back={back} displayClass={displayClass} />
      <main className="flex flex-col gap-3 px-6 pb-10 pt-4">
        {entries.map(([k, v], n) => (
          <a
            key={k}
            style={{ borderColor: "var(--line)", borderRadius: "var(--radius)", background: "var(--surface)", "--i": n } as CSSProperties}
            href={socialHref(k, v)}
            target="_blank"
            rel="noopener"
            onClick={() => tracker.social(k)}
            className="anim-rise flex min-h-14 items-center gap-3 border-[1.5px] px-5 text-[17px] font-medium"
          >
            <SocialIcon k={k} className="h-6 w-6 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{SOCIAL_LABELS[k]}</span>
            <span className="min-w-0 max-w-[45%] truncate text-[15px] text-[var(--muted)]">{k === "whatsapp" ? "Enviar mensaje" : v.replace(/^https?:\/\/(www\.)?/, "")}</span>
          </a>
        ))}
      </main>
    </>
  );
}

function WifiSection({ page, displayClass, back }: { page: PublicPage; displayClass: string; back: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!page.wifi) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(page.wifi!.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* el usuario puede copiar a mano */
    }
  };
  return (
    <>
      <SectionBar title="Wi-Fi" back={back} displayClass={displayClass} />
      <main className="px-6 pb-10 pt-4">
        <dl className="border-[1.5px] p-5" style={{ borderColor: "var(--line)", borderRadius: "var(--radius)", background: "var(--surface)" }}>
          <dt className="text-[15px] text-[var(--muted)]">Red</dt>
          <dd className="mt-1 break-all text-[20px] font-semibold">{page.wifi.ssid}</dd>
          {page.wifi.password && (
            <>
              <dt className="mt-5 text-[15px] text-[var(--muted)]">Contraseña</dt>
              <dd className="mt-1 break-all font-mono text-[20px] font-semibold">{page.wifi.password}</dd>
            </>
          )}
        </dl>
        {page.wifi.password && (
          <button
            type="button"
            onClick={copy}
            className="mt-4 flex min-h-14 w-full items-center justify-center border-[1.5px] text-[17px] font-medium"
            style={{ background: "var(--btn-bg)", color: "var(--btn-text)", borderColor: "var(--btn-border)", borderRadius: "var(--radius)" }}
          >
            <span key={String(copied)} className={copied ? "anim-pop" : ""}>{copied ? "Contraseña copiada" : "Copiar contraseña"}</span>
          </button>
        )}
        <p aria-live="polite" className="sr-only">
          {copied ? "Contraseña copiada" : ""}
        </p>
      </main>
    </>
  );
}

/* ---------- Estadísticas (sin datos personales) ---------- */

interface Tracker {
  click: (k: ButtonKey) => void;
  social: (k: SocialKey) => void;
}

function useTracker(slug: string, enabled: boolean): Tracker {
  const state = useRef({ visit: false, clicks: {} as Record<string, number>, social: {} as Record<string, number> });

  useEffect(() => {
    if (!enabled) return;
    // La tarjeta ya contó la visita y redirige con #t; un enlace directo la cuenta aquí.
    if (location.hash === "#t") {
      history.replaceState(null, "", location.pathname);
    } else {
      state.current.visit = true;
    }
    const flush = () => {
      const s = state.current;
      if (!s.visit && !Object.keys(s.clicks).length && !Object.keys(s.social).length) return;
      const body = JSON.stringify({ slug, visit: s.visit, clicks: s.clicks, social: s.social });
      // Se envía lo acumulado y se reinicia, para no contar dos veces si el comensal regresa.
      state.current = { visit: false, clicks: {}, social: {} };
      if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
        fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
      }
    };
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, [slug, enabled]);

  return useMemo(
    () => ({
      click: (k) => {
        if (!enabled) return;
        state.current.clicks[k] = (state.current.clicks[k] ?? 0) + 1;
      },
      social: (k) => {
        if (!enabled) return;
        state.current.social[k] = (state.current.social[k] ?? 0) + 1;
      },
    }),
    [enabled],
  );
}

/** El contenedor que se desplaza: la ventana en la página real, el marco del teléfono en las vistas previas. */
function scrollParent(el: HTMLElement): HTMLElement | Window {
  let p = el.parentElement;
  while (p) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight) return p;
    p = p.parentElement;
  }
  return window;
}

function isDark(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return lum < 128;
}
