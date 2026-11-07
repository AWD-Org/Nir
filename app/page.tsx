import "@fontsource/big-shoulders-display/800";
import "@fontsource-variable/instrument-sans";
import "@fontsource/young-serif";
import "@fontsource-variable/schibsted-grotesk";
import Link from "next/link";
import { Card3D } from "@/components/landing/card-3d";
import { ControlRows } from "@/components/landing/control-rows";
import { Grain } from "@/components/landing/grain";
import { InstallLine } from "@/components/landing/install-line";
import { RippleField } from "@/components/landing/ripple-field";
import { ScrollWords } from "@/components/landing/scroll-words";
import { SiteHeader } from "@/components/landing/site-header";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { Story } from "@/components/landing/story";
import { TemplatesRail } from "@/components/landing/templates-rail";
import { MotionProvider, Reveal } from "@/components/motion/reveal";
import { kitWhatsappUrl, SITE_URL } from "@/lib/domain/links";

const FAQ = [
  { q: "¿Mis clientes tienen que descargar una app?", a: "No. Acercan el celular a la tarjeta o escanean su QR y tu página se abre en el navegador." },
  { q: "¿Funciona con cualquier celular?", a: "El NFC funciona en iPhone XS o posterior y en Android con NFC. Para el resto, cada tarjeta trae un QR de respaldo." },
  { q: "¿Puedo cambiar precios yo mismo?", a: "Sí. Desde tu celular cambias precios, marcas agotados, subes fotos y ajustas tu página. Se actualiza en segundos." },
  { q: "¿Qué pasa si se pierde una tarjeta?", a: "La desactivamos al instante para que deje de funcionar y te hacemos una de reposición." },
  { q: "¿Ustedes filtran las reseñas?", a: "No. El botón de reseña se muestra igual a todos tus comensales, como pide Google." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": "https://amoxtli.tech/#org", name: "AMOXTLI", url: "https://amoxtli.tech", email: "hello@amoxtli.tech" },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: "AMOXTLI Nir", inLanguage: "es-MX", publisher: { "@id": "https://amoxtli.tech/#org" } },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: "Nir",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "Tarjetas NFC por mesa con carta digital, reseñas de Google, redes sociales y Wi-Fi para restaurantes, bares y cafeterías.",
      publisher: { "@id": "https://amoxtli.tech/#org" },
    },
    { "@type": "FAQPage", "@id": `${SITE_URL}/#faq`, mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ],
};

export default function Landing() {
  const kit = kitWhatsappUrl();
  return (
    <MotionProvider>
      <div className="relative bg-[#0D0D0F] text-[#F4F1EA] selection:bg-[#FA1F6F] selection:text-[#141416]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <SmoothScroll />
        <div className="pointer-events-none fixed inset-0 z-[60] hidden md:block" aria-hidden>
          <Grain />
        </div>
        <SiteHeader kitUrl={kit} />

        <main>
          <Story kitUrl={kit} />

          <section className="mx-auto max-w-[1280px] px-5 py-32 md:px-10 md:py-48">
            <ScrollWords
              className="max-w-[24ch] text-[clamp(32px,4.6vw,64px)] font-semibold leading-[1.08] tracking-[-0.025em]"
              text="Un QR pegado en la mesa no alcanza. Tus clientes quieren la carta al día, el Wi-Fi sin preguntar y dejarte una reseña mientras siguen ahí. Nir hace las tres cosas con un toque."
            />
          </section>

          <section id="la-tarjeta" className="scroll-mt-20 border-t border-[#F4F1EA]/10">
            <div className="mx-auto grid max-w-[1280px] items-center gap-16 px-5 py-28 md:px-10 lg:grid-cols-12 lg:py-40">
              <div className="lg:col-span-7">
                <Card3D />
              </div>
              <div className="lg:col-span-5">
                <Reveal>
                  <h2 className="text-[clamp(36px,4.6vw,64px)] font-semibold leading-[0.95] tracking-[-0.03em]">Una tarjeta por mesa. Nada más que explicar.</h2>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="mt-6 text-[17px] leading-relaxed text-[#F4F1EA]/65">
                    La grabamos una sola vez con la dirección de tu negocio y la bloqueamos para que nadie la cambie. Lleva tu logo, el número de mesa y un QR por si el celular no tiene NFC.
                  </p>
                </Reveal>
                <dl className="mt-10 divide-y divide-[#F4F1EA]/10 border-y border-[#F4F1EA]/10 text-[15px]">
                  {[
                    ["Tamaño", "85.6 × 54 mm"],
                    ["Lectura", "iPhone XS o posterior y Android con NFC"],
                    ["Respaldo", "QR impreso en el reverso"],
                    ["Grabado", "una vez, bloqueada por AMOXTLI®"],
                  ].map(([k, v], i) => (
                    <Reveal key={k} delay={0.15 + i * 0.06} y={10} className="flex items-baseline justify-between gap-6 py-3.5">
                      <dt className="text-[#F4F1EA]/50">{k}</dt>
                      <dd className="text-right font-mono text-[14px]">{v}</dd>
                    </Reveal>
                  ))}
                </dl>
              </div>
            </div>
          </section>

          <div id="plantillas" className="scroll-mt-0 border-t border-[#F4F1EA]/10">
            <TemplatesRail />
          </div>

          <section className="border-t border-[#F4F1EA]/10">
            <div className="mx-auto max-w-[1280px] px-5 py-28 md:px-10 lg:py-40">
              <Reveal>
                <h2 className="max-w-[18ch] text-[clamp(36px,5vw,72px)] font-semibold leading-[0.95] tracking-[-0.03em]">Tú lo controlas desde el celular.</h2>
              </Reveal>
              <ControlRows />
            </div>
          </section>

          <section id="instalacion" className="scroll-mt-20 border-t border-[#F4F1EA]/10 bg-[#F4F1EA] text-[#141416]">
            <div className="mx-auto max-w-[1280px] px-5 py-28 md:px-10 lg:py-36">
              <Reveal>
                <h2 className="max-w-[20ch] text-[clamp(36px,5vw,72px)] font-semibold leading-[0.95] tracking-[-0.03em]">Nosotros llegamos, instalamos y te dejamos listo.</h2>
              </Reveal>
              <InstallLine tone="light" />
            </div>
          </section>

          <section id="preguntas" className="scroll-mt-20">
            <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-28 md:px-10 lg:grid-cols-12 lg:py-36">
              <Reveal className="lg:col-span-4">
                <h2 className="text-[clamp(32px,3.6vw,52px)] font-semibold leading-[0.98] tracking-[-0.025em]">Preguntas frecuentes</h2>
              </Reveal>
              <div className="divide-y divide-[#F4F1EA]/12 border-y border-[#F4F1EA]/12 lg:col-span-8">
                {FAQ.map((f) => (
                  <details key={f.q} className="group py-6">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[19px] font-medium">
                      {f.q}
                      <span className="relative h-4 w-4 shrink-0" aria-hidden>
                        <span className="absolute left-0 top-1/2 h-px w-4 bg-current" />
                        <span className="absolute left-1/2 top-0 h-4 w-px bg-current transition-transform duration-300 group-open:rotate-90 group-open:scale-y-0" />
                      </span>
                    </summary>
                    <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-[#F4F1EA]/65">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <RippleField className="border-t border-[#F4F1EA]/10">
            <section className="mx-auto max-w-[1280px] px-5 py-32 md:px-10 lg:py-48">
              <Reveal>
                <h2 className="text-[clamp(64px,13vw,200px)] font-semibold leading-[0.85] tracking-[-0.05em]">Acércalo.</h2>
              </Reveal>
              <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                <p className="max-w-[40ch] text-[18px] leading-relaxed text-[#F4F1EA]/65">
                  Escríbenos y vamos a tu negocio. En la primera visita dejamos tu carta lista; en 48 horas, tus tarjetas en las mesas.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href={kit} target="_blank" rel="noopener" className="inline-flex min-h-12 items-center rounded-full bg-[#FA1F6F] px-7 text-[16px] font-semibold text-[#141416] transition-transform hover:scale-[1.03]">
                    Pide tu kit por WhatsApp
                  </a>
                  <Link href="/registro" className="inline-flex min-h-12 items-center rounded-full border border-[#F4F1EA]/25 px-7 text-[16px] font-medium transition-colors hover:border-[#F4F1EA]/60">
                    Arma tu carta gratis
                  </Link>
                </div>
              </div>
            </section>
          </RippleField>
        </main>

        <footer className="border-t border-[#F4F1EA]/10">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-5 py-8 text-[14px] text-[#F4F1EA]/55 md:flex-row md:items-center md:justify-between md:px-10">
            <span>Nir es un producto de AMOXTLI®</span>
            <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Legal">
              <Link href="/terminos" className="hover:text-[#F4F1EA]">Términos de servicio</Link>
              <Link href="/privacidad" className="hover:text-[#F4F1EA]">Aviso de privacidad</Link>
              <a href="mailto:hello@amoxtli.tech" className="hover:text-[#F4F1EA]">hello@amoxtli.tech</a>
            </nav>
            <p>
              Desarrollado por <a href="https://amoxtli.tech" className="font-medium text-[#F4F1EA] hover:underline">AMOXTLI®</a>
            </p>
          </div>
        </footer>
      </div>
    </MotionProvider>
  );
}
