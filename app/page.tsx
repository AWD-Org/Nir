import "@fontsource/big-shoulders-display/800";
import "@fontsource-variable/instrument-sans";
import "@fontsource/young-serif";
import "@fontsource-variable/schibsted-grotesk";
import Link from "next/link";
import { DemoPhone } from "@/components/landing/demo-phone";
import { Logo, NirMark } from "@/components/ui/logo";
import { kitWhatsappUrl, SITE_URL } from "@/lib/domain/links";

const FAQ = [
  {
    q: "¿Mis clientes tienen que descargar una app?",
    a: "No. Acercan el celular a la tarjeta o escanean su QR y se abre tu página en el navegador.",
  },
  {
    q: "¿Funciona con cualquier celular?",
    a: "El NFC funciona en iPhone XS o posterior y en Android con NFC. Para el resto, cada tarjeta trae un QR de respaldo.",
  },
  {
    q: "¿Puedo cambiar precios yo mismo?",
    a: "Sí. Desde tu celular cambias precios, marcas agotados, subes fotos y ajustas tu página. Se actualiza en segundos.",
  },
  {
    q: "¿Qué pasa si se pierde una tarjeta?",
    a: "La desactivamos al instante para que deje de funcionar y te hacemos una de reposición.",
  },
  {
    q: "¿Ustedes filtran las reseñas?",
    a: "No. El botón de reseña se muestra igual a todos tus comensales, como pide Google.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://amoxtli.tech/#org",
      name: "AMOXTLI",
      url: "https://amoxtli.tech",
      email: "hello@amoxtli.tech",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "AMOXTLI Nir",
      inLanguage: "es-MX",
      publisher: { "@id": "https://amoxtli.tech/#org" },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: "Nir",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "Tarjetas NFC por mesa con carta digital, reseñas de Google, redes sociales y Wi-Fi para restaurantes, bares y cafeterías.",
      publisher: { "@id": "https://amoxtli.tech/#org" },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

export default function Landing() {
  const kit = kitWhatsappUrl();
  return (
    <div className="bg-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 md:px-8">
          <Logo />
          <nav className="hidden gap-6 text-[15px] text-ink-2 md:flex" aria-label="Principal">
            <a href="#como-funciona" className="hover:text-ink">Cómo funciona</a>
            <a href="#para-el-dueno" className="hover:text-ink">Para el dueño</a>
            <a href="#preguntas" className="hover:text-ink">Preguntas</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/entrar" className="btn-ghost min-h-10 px-3 text-[15px]">Entrar</Link>
            <a href={kit} target="_blank" rel="noopener" className="btn-primary min-h-10 px-4 text-[15px]">Pide tu kit</a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero: texto y acción a la izquierda, la página real a la derecha */}
        <section className="overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 md:px-8 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-20">
            <div className="lg:col-span-7">
              <h1 className="max-w-[16ch] text-[44px] font-semibold leading-[1.02] tracking-[-0.02em] sm:text-[56px] lg:text-[64px]">
                Tu carta y tus reseñas, a un toque de cada mesa
              </h1>
              <p className="mt-6 max-w-[52ch] text-[19px] leading-relaxed text-ink-2">
                Ponemos una tarjeta Nir en cada mesa de tu restaurante, bar o cafetería. El comensal acerca su celular y abre tu carta, tu enlace para reseñas de Google, tus redes y el Wi-Fi. Tú cambias precios y agotados desde tu teléfono.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href={kit} target="_blank" rel="noopener" className="btn-primary min-h-12 px-6 text-[16px]">Pide tu kit por WhatsApp</a>
                <Link href="/registro" className="btn-secondary min-h-12 px-6 text-[16px]">Arma tu carta gratis</Link>
              </div>
              <p className="mt-4 text-[15px] text-ink-2">Puedes armar tu página desde hoy; se publica cuando instalamos tus tarjetas.</p>
            </div>
            <div className="lg:col-span-5">
              <DemoPhone />
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="scroll-mt-20 border-t border-line bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-20 md:px-8 lg:py-28">
            <h2 className="max-w-[22ch] text-[34px] font-semibold leading-tight tracking-[-0.01em] sm:text-[40px]">En la mesa no hay nada que explicar</h2>
            <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
              <Moment title="Acercan el celular" body="La tarjeta lleva el nombre de tu negocio y el número de mesa. Con un toque se abre tu página; sin app ni registro." />
              <Moment title="Ven tu carta al día" body="Por categorías, con fotos, variantes y lo que ya se acabó en gris. Si cambias un precio, se ve en segundos." />
              <Moment title="Te dejan su reseña" body="Un botón directo a tu perfil de Google, igual para todos, justo cuando la experiencia está fresca." />
            </div>
          </div>
        </section>

        {/* Para el dueño */}
        <section id="para-el-dueno" className="scroll-mt-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:px-8 lg:grid-cols-2 lg:items-center lg:py-28">
            <div>
              <h2 className="max-w-[20ch] text-[34px] font-semibold leading-tight tracking-[-0.01em] sm:text-[40px]">Lo controlas tú, entre servicio y servicio</h2>
              <ul className="mt-8 divide-y divide-line border-y border-line">
                <Feature title="Agotado con un toque" body="Apaga un platillo cuando se acaba y vuelve a prenderlo mañana." />
                <Feature title="Precios sin reimprimir" body="Cambia el precio desde la lista, sin abrir cada producto." />
                <Feature title="Tu página con tu estilo" body="Tres plantillas, tus colores y tu logo. Ves el resultado mientras lo editas." />
                <Feature title="Sabes qué mesas te visitan" body="Toques por día, hora y mesa, y qué botones usan. Sin datos personales de tus comensales." />
              </ul>
            </div>
            <AdminMock />
          </div>
        </section>

        {/* El kit */}
        <section className="border-t border-line bg-ink text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:px-8 lg:grid-cols-12 lg:py-24">
            <div className="lg:col-span-5">
              <h2 className="text-[34px] font-semibold leading-tight tracking-[-0.01em] sm:text-[40px]">Nosotros instalamos todo</h2>
              <p className="mt-4 text-[17px] leading-relaxed text-white/75">En la primera visita creamos tu cuenta y tus primeros productos contigo. En las siguientes 48 horas llevamos e instalamos las tarjetas.</p>
            </div>
            <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-7">
              <KitItem title="Una tarjeta por mesa" body="NFC con QR de respaldo, tu logo y el número de mesa. Grabada y bloqueada por AMOXTLI®." />
              <KitItem title="Tu página y tu carta" body="En nir.amoxtli.tech con el nombre de tu negocio, lista para compartir en redes." />
              <KitItem title="Admin desde el celular" body="Carta, enlaces, Wi-Fi, diseño y estadísticas, con correo o cuenta de Google." />
              <KitItem title="Soporte directo" body="Si pierdes una tarjeta, la desactivamos al momento y te hacemos otra." />
            </dl>
          </div>
        </section>

        {/* Preguntas */}
        <section id="preguntas" className="scroll-mt-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:px-8 lg:grid-cols-12 lg:py-28">
            <h2 className="text-[34px] font-semibold leading-tight tracking-[-0.01em] sm:text-[40px] lg:col-span-4">Preguntas frecuentes</h2>
            <div className="divide-y divide-line border-y border-line lg:col-span-8">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[18px] font-medium">
                    {f.q}
                    <span className="text-2xl leading-none text-ink-3 transition-transform group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-ink-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-paper">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 md:flex-row md:items-center md:justify-between md:px-8">
            <h2 className="max-w-[24ch] text-[28px] font-semibold leading-tight sm:text-[32px]">¿Quieres Nir en tus mesas?</h2>
            <a href={kit} target="_blank" rel="noopener" className="btn-primary min-h-12 px-6 text-[16px]">Pide tu kit por WhatsApp</a>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-[15px] text-ink-2 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-2">
            <NirMark className="h-5 w-5" />
            <span>Nir es un producto de AMOXTLI®</span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Legal">
            <Link href="/terminos" className="hover:text-ink">Términos de servicio</Link>
            <Link href="/privacidad" className="hover:text-ink">Aviso de privacidad</Link>
            <a href="mailto:hello@amoxtli.tech" className="hover:text-ink">hello@amoxtli.tech</a>
          </nav>
          <p>Desarrollado por <a href="https://amoxtli.tech" className="font-medium text-ink hover:underline">AMOXTLI®</a></p>
        </div>
      </footer>
    </div>
  );
}

function Moment({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-surface p-7">
      <h3 className="text-[20px] font-semibold">{title}</h3>
      <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{body}</p>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <li className="py-5">
      <h3 className="text-[18px] font-semibold">{title}</h3>
      <p className="mt-1 text-[16px] leading-relaxed text-ink-2">{body}</p>
    </li>
  );
}

function KitItem({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <dt className="text-[18px] font-semibold">{title}</dt>
      <dd className="mt-1.5 text-[16px] leading-relaxed text-white/75">{body}</dd>
    </div>
  );
}

/** Fragmento estático del admin real: la fila de producto con precio y disponible. */
function AdminMock() {
  const rows = [
    { name: "Guacamole con totopos", price: "95", on: true },
    { name: "Tostadas de tinga", price: "110", on: false },
    { name: "Mezcal espadín", price: "90", on: true },
    { name: "Agua de jamaica", price: "45", on: true },
  ];
  return (
    <div className="panel overflow-hidden shadow-[0_24px_60px_-28px_rgba(18,18,20,0.35)]" aria-hidden>
      <div className="flex items-center justify-between border-b border-line bg-paper/60 px-4 py-3">
        <span className="font-semibold">Botanas y mezcales</span>
        <span className="num text-sm text-ink-2">4</span>
      </div>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3 px-4 py-3">
            <span className="h-10 w-10 shrink-0 rounded-md bg-paper" />
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-[15px] font-medium ${r.on ? "" : "text-ink-3 line-through"}`}>{r.name}</span>
              <span className="block text-sm text-ink-2">{r.on ? "Disponible" : "Agotado"}</span>
            </span>
            <span className="num flex h-10 w-20 items-center justify-end rounded-md border border-line-2 px-2.5 text-[15px]">${r.price}</span>
            <span className={`relative h-7 w-12 shrink-0 rounded-full ${r.on ? "bg-ok" : "bg-line-2"}`}>
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm ${r.on ? "left-[22px]" : "left-0.5"}`} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
