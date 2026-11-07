"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import Link from "next/link";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { PublicView, type View } from "@/components/public/public-view";
import { Phone } from "@/components/ui/phone";
import { demoPage } from "@/lib/demo";
import { NirCard } from "./nir-card";

const EASE = [0.22, 1, 0.36, 1] as const;

// La pantalla del celular solo se vuelve a dibujar cuando cambia lo que muestra, no en cada paso del scroll.
const Screen = memo(PublicView);

/** true en pantallas táctiles: ahí el scroll ya trae su propia inercia y no se suaviza otra vez. */
function useCoarse() {
  const [coarse, setCoarse] = useState(false);
  useEffect(
    () => setCoarse(window.matchMedia("(pointer: coarse)").matches),
    [],
  );
  return coarse;
}

/** Momentos de la historia: el scroll es el comensal (y luego el dueño). */
const STEPS = [
  { at: 0, label: "Acercar" },
  { at: 0.2, label: "Abrir" },
  { at: 0.38, label: "Carta" },
  { at: 0.56, label: "Cambiar" },
  { at: 0.78, label: "Reseñar" },
] as const;

const COPY = [
  null, // el primer momento es el encabezado principal
  {
    h: "Se abre tu negocio.",
    p: "Con tu logo, tus colores y cuatro botones: carta, reseña, redes y Wi-Fi. Sin app y sin registro.",
  },
  {
    h: "La carta, siempre al día.",
    p: "Por categorías, con fotos y variantes. Lo que se acabó aparece en gris, no en la boca del mesero.",
  },
  {
    h: "Cambias un precio. Listo.",
    p: "Desde tu celular, entre servicio y servicio. En la mesa se ve en segundos.",
  },
  {
    h: "Y te dejan su reseña.",
    p: "Un botón directo a tu perfil de Google, igual para todos, justo cuando la experiencia está fresca.",
  },
];

const stepAt = (p: number) => {
  let s = 0;
  STEPS.forEach((x, i) => p >= x.at && (s = i));
  return s;
};

export function Story({ kitUrl }: { kitUrl: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.4,
  });
  // En celular la escena sigue al dedo sin retraso; el resorte solo suaviza la rueda del mouse.
  const coarse = useCoarse();
  const p = coarse ? scrollYProgress : smooth;
  const [step, setStep] = useState(0);
  const [soldOut, setSoldOut] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setStep(stepAt(v));
    setSoldOut(v > 0.64);
  });

  // Celular del comensal: entra desde abajo, se acerca a la tarjeta y se queda.
  const dinerY = useTransform(p, [0, 0.17], ["58vh", "0vh"]);
  const dinerRotate = useTransform(p, [0, 0.17, 0.78, 1], [12, -4, -4, 0]);
  const dinerX = useTransform(
    p,
    [0.5, 0.6, 0.74, 0.8],
    ["0%", "36%", "36%", "0%"],
  );
  // Celular del dueño: entra por la izquierda solo durante el momento "Cambiar".
  const ownerX = useTransform(
    p,
    [0.5, 0.6, 0.74, 0.82],
    ["-260%", "-58%", "-58%", "-260%"],
  );
  const ownerOpacity = useTransform(p, [0.5, 0.56, 0.76, 0.81], [0, 1, 1, 0]);
  const ownerRotate = useTransform(p, [0.5, 0.6], [-14, -6]);
  // Mesa: la escena se aleja un poco cuando llega el celular.
  const tableScale = useTransform(p, [0, 0.2, 1], [1.08, 1, 0.94]);
  // La luz se mueve con transform (no se vuelve a pintar el degradado en cada cuadro).
  const lampX = useTransform(p, [0, 1], ["-12%", "12%"]);
  const lampY = useTransform(p, [0, 1], ["-6%", "8%"]);
  const progressH = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const goTo = (at: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.offsetTop + (el.offsetHeight - innerHeight) * (at + 0.03);
    window.scrollTo({ top, behavior: "smooth" });
  };

  const page = useMemo(() => {
    const base = demoPage("noche");
    if (!soldOut) return base;
    return {
      ...base,
      menu: {
        categories: base.menu.categories.map((c) => ({
          ...c,
          items: c.items.map((i) =>
            i.id === "i1" ? { ...i, available: false } : i,
          ),
        })),
      },
    };
  }, [soldOut]);
  const view: View = step === 2 || step === 3 ? "menu" : "home";

  return (
    <section
      ref={ref}
      className="relative h-[430vh] lg:h-[560vh]"
      aria-label="Cómo funciona Nir en la mesa"
    >
      <div className="sticky top-0 h-lvh overflow-hidden">
        {/* Mesa vista desde arriba */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ scale: reduce ? 1 : tableScale }}
          aria-hidden
        >
          <div className="absolute inset-0 bg-[#121113]" />
          <div className="absolute inset-0 opacity-[0.35] [background:repeating-linear-gradient(97deg,transparent_0_38px,rgba(255,255,255,0.025)_38px_40px,transparent_40px_90px)]" />
          <motion.div
            className="absolute inset-0 will-change-transform"
            style={{
              x: lampX,
              y: lampY,
              background:
                "radial-gradient(45% 40% at 45% 40%, rgba(255,214,170,0.13), transparent 70%)",
            }}
          />
          <TableObjects />
        </motion.div>

        <div className="relative mx-auto grid h-svh max-w-[1280px] grid-rows-[auto_1fr] gap-4 px-5 pt-24 md:px-10 lg:grid-cols-12 lg:grid-rows-1 lg:items-center lg:gap-10 lg:pt-0">
          {/* Texto */}
          <div className="relative z-20 lg:col-span-6">
            <AnimatePresence mode="popLayout" initial={false}>
              {step === 0 ? (
                <motion.div
                  key="hero"
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.2, ease: EASE }}
                >
                  <h1 className="max-w-[12ch] text-[clamp(42px,6.2vw,92px)] font-semibold leading-[0.93] tracking-[-0.035em] text-[#F4F1EA]">
                    Tu restaurante, a un toque de cada mesa.
                  </h1>
                  <p className="mt-6 max-w-[46ch] text-[clamp(16px,1.4vw,19px)] leading-relaxed text-[#F4F1EA]/70">
                    Una tarjeta Nir en cada mesa abre tu carta, tus reseñas de
                    Google, tus redes y el Wi-Fi. Tú cambias precios y agotados
                    desde el celular.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a
                      href={kitUrl}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex min-h-12 items-center rounded-full bg-[#FA1F6F] px-6 text-[16px] font-semibold text-[#141416] transition-transform hover:scale-[1.03] active:scale-[0.98]"
                    >
                      Pide tu kit
                    </a>
                    <Link
                      href="/registro"
                      className="inline-flex min-h-12 items-center rounded-full border border-[#F4F1EA]/25 px-6 text-[16px] font-medium text-[#F4F1EA] transition-colors hover:border-[#F4F1EA]/60"
                    >
                      Arma tu carta gratis
                    </Link>
                  </div>
                  <ScrollCue />
                </motion.div>
              ) : (
                <motion.div
                  key={step}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  className=""
                >
                  <h2 className="max-w-[13ch] text-[clamp(38px,5.6vw,80px)] font-semibold leading-[0.95] tracking-[-0.03em] text-[#F4F1EA]">
                    <MaskWords text={COPY[step]!.h} />
                  </h2>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: 0.12 }}
                    className="mt-5 max-w-[42ch] text-[clamp(16px,1.4vw,19px)] leading-relaxed text-[#F4F1EA]/70"
                  >
                    {COPY[step]!.p}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Celular: en qué momento vas y salto directo a los demás */}
            <nav className="mt-5 md:hidden" aria-label="Momentos">
              <ol className="-ml-1.5 flex items-center gap-0.5">
                {STEPS.map((s, i) => (
                  <li key={s.label}>
                    <button
                      onClick={() => goTo(s.at)}
                      className="flex h-8 items-center px-1.5"
                      aria-label={s.label}
                      aria-current={i === step ? "step" : undefined}
                    >
                      <span
                        className={`block h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-[#FA1F6F]" : "w-1.5 bg-[#F4F1EA]/35"}`}
                      />
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Escena: tarjeta y celulares */}
          <div className="relative z-10 flex h-full items-center justify-center lg:col-span-6">
            <div className="relative h-[600px] w-[300px] origin-top scale-[0.62] sm:scale-[0.78] lg:origin-center lg:scale-100">
              {/* Tarjeta sobre la mesa, bajo el celular */}
              <div className="absolute -left-36 bottom-6 w-[260px] -rotate-[9deg]">
                <NirCard table={12} />
                <AnimatePresence>
                  {step === 1 && !reduce && (
                    <div
                      className="pointer-events-none absolute right-[18%] top-[30%]"
                      aria-hidden
                    >
                      {[0, 1, 2, 3].map((i) => (
                        <motion.span
                          key={i}
                          className="absolute -left-12 -top-12 h-24 w-24 rounded-full border-2 border-[#FA1F6F]"
                          initial={{ scale: 0.2, opacity: 0.9 }}
                          animate={{ scale: 3.2, opacity: 0 }}
                          transition={{
                            duration: 1.6,
                            ease: "easeOut",
                            delay: i * 0.18,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Celular del dueño */}
              <motion.div
                className="absolute inset-0 z-10 will-change-transform"
                style={{
                  x: ownerX,
                  rotate: ownerRotate,
                  opacity: ownerOpacity,
                }}
              >
                <Phone
                  interactive={false}
                  className="shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]"
                >
                  <OwnerScreen soldOut={soldOut} />
                </Phone>
              </motion.div>

              {/* Celular del comensal */}
              <motion.div
                className="absolute inset-0 z-20 will-change-transform"
                style={{ y: dinerY, rotate: dinerRotate, x: dinerX }}
              >
                <Phone
                  interactive={false}
                  className="shadow-[0_50px_100px_-30px_rgba(0,0,0,0.95)]"
                >
                  <Screen
                    page={page}
                    mode="preview"
                    forceView={view}
                    highlight={step === 4 ? "reviews" : undefined}
                  />
                  <AnimatePresence>
                    {step === 0 && (
                      <motion.div
                        key="off"
                        className="absolute inset-0 z-30 bg-[#050506]"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: EASE }}
                        aria-hidden
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.08),transparent_40%)]" />
                        <p className="absolute inset-x-0 top-[38%] text-center font-mono text-[44px] font-light tracking-tight text-white/80">
                          21:47
                        </p>
                        <p className="absolute inset-x-0 top-[47%] text-center text-[13px] text-white/45">
                          Acerca el celular a la tarjeta
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Phone>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Progreso de la historia (navegable) */}

        <nav
          className="absolute bottom-8 left-5 z-30 hidden md:left-10 md:flex md:items-end md:gap-5"
          aria-label="Momentos"
        >
          <div className="relative h-24 w-px bg-[#F4F1EA]/15">
            <motion.div
              className="absolute inset-x-0 top-0 bg-[#FA1F6F]"
              style={{ height: progressH }}
            />
          </div>
          <ol className="flex flex-col gap-1.5">
            {STEPS.map((s, i) => (
              <li key={s.label}>
                <button
                  onClick={() => goTo(s.at)}
                  className={`text-left text-[13px] transition-colors ${i === step ? "text-[#F4F1EA]" : "text-[#F4F1EA]/40 hover:text-[#F4F1EA]/70"}`}
                  aria-current={i === step ? "step" : undefined}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}

/** Palabras que suben detrás de una máscara. */
function MaskWords({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <span aria-label={text}>
      {words.map((w, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block overflow-hidden pb-[0.1em] align-bottom"
        >
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: i * 0.03 }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function ScrollCue() {
  return (
    <div
      className="mt-14 hidden items-center gap-3 text-[13px] text-[#F4F1EA]/50 lg:flex"
      aria-hidden
    >
      <span className="relative h-9 w-[22px] rounded-full border border-[#F4F1EA]/30">
        <motion.span
          className="absolute left-1/2 top-2 h-1.5 w-1.5 rounded-full bg-[#F4F1EA]/70"
          style={{ x: "-50%" }}
          animate={{ y: [0, 12, 0], opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </span>
      Baja para acercar el celular
    </div>
  );
}

/** Objetos sobre la mesa, en trazo fino: vaso, servilleta con cubiertos y un plato. */
function TableObjects() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <g stroke="rgba(244,241,234,0.10)" strokeWidth="1.5">
        {/* vaso */}
        <circle cx="1210" cy="190" r="58" />
        <circle cx="1210" cy="190" r="48" />
        <path
          d="M1180 160a42 42 0 0 1 30-12"
          stroke="rgba(244,241,234,0.22)"
          strokeLinecap="round"
        />
        <circle cx="1205" cy="300" r="58" stroke="rgba(244,241,234,0.05)" />
        {/* plato */}
        <circle cx="210" cy="760" r="150" />
        <circle cx="210" cy="760" r="112" />
        {/* servilleta y cubiertos */}
        <rect
          x="1150"
          y="560"
          width="150"
          height="260"
          rx="6"
          transform="rotate(8 1225 690)"
        />
        <path
          d="M1203 590v220M1243 590v220"
          transform="rotate(8 1225 690)"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/** Pantalla del admin del dueño: la fila de la carta y el switch de disponible. */
function OwnerScreen({ soldOut }: { soldOut: boolean }) {
  const rows = [
    { name: "Guacamole con totopos", price: "$95", on: true },
    { name: "Chicharrón de queso", price: "$85", on: true },
    { name: "Tostadas de tinga", price: "$110", on: true },
  ];
  rows[0].on = !soldOut;
  return (
    <div className="flex h-full flex-col bg-[#F4F4F6] font-sans text-[#121214]">
      <div className="flex items-center gap-2 border-b border-[#E4E4E8] bg-white px-4 pb-3 pt-10">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FA1F6F]">
          <svg viewBox="0 0 32 32" className="h-4 w-4" fill="none" aria-hidden>
            <circle cx="11" cy="16" r="2.6" fill="#fff" />
            <path
              d="M16 10.5a7.8 7.8 0 0 1 0 11M20.5 7a12.6 12.6 0 0 1 0 18"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="text-[14px] font-semibold">Carta</span>
        <span className="ml-auto rounded-md border border-[#0F7B4B]/20 bg-[#E7F6EE] px-1.5 py-0.5 text-[11px] font-medium text-[#0F7B4B]">
          Activa
        </span>
      </div>
      <div className="m-3 overflow-hidden rounded-lg border border-[#E4E4E8] bg-white">
        <p className="border-b border-[#E4E4E8] bg-[#F4F4F6]/60 px-3 py-2 text-[13px] font-semibold">
          Botanas
        </p>
        {rows.map((r, i) => (
          <div
            key={r.name}
            className={`flex items-center gap-2 border-b border-[#E4E4E8] px-3 py-2.5 transition-colors duration-500 last:border-0 ${i === 0 && soldOut ? "bg-[#FFF0F5]" : ""}`}
          >
            <span className="min-w-0 flex-1">
              <span
                className={`block truncate text-[13px] font-medium ${r.on ? "" : "text-[#74747D] line-through"}`}
              >
                {r.name}
              </span>
              <span className="block text-[11px] text-[#55555E]">
                {r.on ? "Disponible" : "Agotado"}
              </span>
            </span>
            <span className="rounded border border-[#D2D2D8] px-1.5 py-1 font-mono text-[12px]">
              {r.price}
            </span>
            <span
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ${r.on ? "bg-[#0F7B4B]" : "bg-[#D2D2D8]"}`}
            >
              <motion.span
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                animate={{ left: r.on ? 18 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </span>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {soldOut && (
          <motion.div
            className="mx-auto mt-auto mb-8 rounded-lg bg-[#121214] px-3 py-2 text-[12px] font-medium text-white"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            Marcado como agotado
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
