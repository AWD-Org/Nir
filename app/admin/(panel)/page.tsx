import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";
import { QrDownload } from "@/components/admin/qr-download";
import { CountUp } from "@/components/motion/reveal";
import { isPublic } from "@/lib/domain/constants";
import { dayKey, lastDayKeys } from "@/lib/domain/dates";
import { publicUrl } from "@/lib/domain/links";
import { getDraft, getStats } from "@/lib/server/db";
import { requireOwner } from "@/lib/server/session";

export default async function AdminHome() {
  const { tenant } = await requireOwner();
  const days = lastDayKeys(7);
  const [draft, stats] = await Promise.all([getDraft(tenant.id), getStats(tenant.id, days[0])]);
  const today = stats.find((s) => s.date === dayKey())?.visits ?? 0;
  const week = stats.reduce((a, s) => a + (s.visits ?? 0), 0);
  const items = Object.keys(draft.items).length;
  const live = isPublic(tenant.status);

  const checklist = [
    { done: !!tenant.profile.logoImageId, label: "Sube tu logo", href: "/admin/pagina#datos" },
    { done: items >= 5, label: `Agrega tus primeros 5 productos (${Math.min(items, 5)}/5)`, href: "/admin/carta" },
    { done: !!tenant.links.googleReviewUrl, label: "Pega tu enlace de reseñas de Google", href: "/admin/pagina#enlaces" },
    { done: Object.entries(tenant.links).some(([k, v]) => k !== "googleReviewUrl" && !!v), label: "Agrega al menos una red social", href: "/admin/pagina#enlaces" },
    { done: !!tenant.profile.hours, label: "Escribe tu horario", href: "/admin/pagina#datos" },
  ];
  const pending = checklist.filter((c) => !c.done);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-[28px] font-semibold leading-tight">Hola, {tenant.name}</h1>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Visitas">
        <Stat label="Visitas hoy" value={today} />
        <Stat label="Últimos 7 días" value={week} />
        <Stat label="Productos en tu carta" value={items} />
      </section>

      {pending.length > 0 && (
        <section className="panel p-5">
          <h2 className="text-lg font-semibold">Deja lista tu página</h2>
          <ul className="mt-3 divide-y divide-line">
            {checklist.map((c, i) => (
              <li key={c.label} className="anim-rise" style={{ "--i": i + 3 } as React.CSSProperties}>
                <Link href={c.href} className="flex min-h-12 items-center gap-3 text-[15px]">
                  {c.done ? <Check className="h-5 w-5 shrink-0 text-ok" /> : <Circle className="h-5 w-5 shrink-0 text-line-2" />}
                  <span className={c.done ? "text-ink-2 line-through" : ""}>{c.label}</span>
                  {!c.done && <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-ink-3" />}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel p-5">
        <h2 className="text-lg font-semibold">Tu enlace</h2>
        {live ? (
          <div className="mt-4">
            <QrDownload url={publicUrl(tenant.slug)} slug={tenant.slug} />
          </div>
        ) : (
          <p className="mt-2 text-ink-2">
            Tu dirección será <span className="num text-ink">{publicUrl(tenant.slug).replace(/^https?:\/\//, "")}</span>. El QR para redes se habilita cuando AMOXTLI® active tu cuenta.
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <QuickLink href="/admin/carta" title="Cambia precios y agotados" body="Desde la lista, sin abrir cada producto." />
        <QuickLink href="/admin/estadisticas" title="Mira quién te visita" body="Toques por día, hora y mesa." />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-ink-2">{label}</p>
      <CountUp value={value} className="num mt-1 block text-[32px] font-semibold leading-none" />
    </div>
  );
}

function QuickLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="panel group flex items-center gap-4 p-5 transition-colors hover:border-line-2">
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-[15px] text-ink-2">{body}</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
