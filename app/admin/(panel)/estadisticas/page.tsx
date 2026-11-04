import Link from "next/link";
import { Bars, HBars } from "@/components/admin/charts";
import { BUTTON_LABELS, SOCIAL_LABELS } from "@/lib/domain/constants";
import { lastDayKeys } from "@/lib/domain/dates";
import { summarize } from "@/lib/domain/stats";
import type { ButtonKey, SocialKey } from "@/lib/domain/types";
import { getStats } from "@/lib/server/db";
import { requireOwner } from "@/lib/server/session";

export const metadata = { title: "Estadísticas" };

const RANGES = [7, 30, 90] as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string }> }) {
  const { tenant } = await requireOwner();
  const r = Number((await searchParams).r);
  const range = (RANGES as readonly number[]).includes(r) ? r : 7;
  const days = lastDayKeys(range);
  const s = summarize(days, await getStats(tenant.id, days[0]));
  const peak = s.byHour.indexOf(Math.max(...s.byHour));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight">Estadísticas</h1>
          <p className="mt-1 text-[15px] text-ink-2">Solo contamos visitas y toques; nunca datos de tus comensales.</p>
        </div>
        <nav className="flex rounded-lg border border-line-2 bg-surface p-1" aria-label="Rango">
          {RANGES.map((n) => (
            <Link
              key={n}
              href={`/admin/estadisticas?r=${n}`}
              aria-current={n === range ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${n === range ? "bg-ink text-white" : "text-ink-2 hover:text-ink"}`}
            >
              {n} días
            </Link>
          ))}
        </nav>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Tile label="Visitas" value={s.total.toLocaleString("es-MX")} />
        <Tile label="Por tarjeta (NFC + QR)" value={(s.bySource.nfc + s.bySource.qr).toLocaleString("es-MX")} />
        <Tile label="Hora más fuerte" value={s.total ? `${String(peak).padStart(2, "0")}:00` : "—"} />
      </section>

      <section className="panel p-5">
        <h2 className="mb-6 font-semibold">Visitas por día</h2>
        {s.total ? (
          <Bars data={s.byDay.map((d) => ({ label: d.date, value: d.visits }))} label="Día" kind="day" tickEvery={range === 7 ? 1 : range === 30 ? 5 : 15} />
        ) : (
          <Empty />
        )}
      </section>

      <section className="panel p-5">
        <h2 className="mb-6 font-semibold">Visitas por hora</h2>
        {s.total ? (
          <Bars data={s.byHour.map((v, h) => ({ label: `${String(h).padStart(2, "0")}:00`, value: v }))} label="Hora" tickEvery={3} />
        ) : (
          <Empty />
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-4 font-semibold">Por mesa</h2>
          <HBars rows={s.byTable.map((t) => ({ label: t.table === "link" ? "Enlace directo" : `Mesa ${t.table}`, value: t.visits }))} />
        </section>
        <section className="panel p-5">
          <h2 className="mb-4 font-semibold">Cómo llegaron</h2>
          <HBars rows={[
            { label: "Tarjeta NFC", value: s.bySource.nfc },
            { label: "QR de la tarjeta", value: s.bySource.qr },
            { label: "Enlace o redes", value: s.bySource.link },
          ]} />
        </section>
        <section className="panel p-5">
          <h2 className="mb-4 font-semibold">Clics en botones</h2>
          <HBars rows={(Object.keys(s.clicks) as ButtonKey[]).map((k) => ({ label: BUTTON_LABELS[k], value: s.clicks[k] }))} />
        </section>
        <section className="panel p-5">
          <h2 className="mb-4 font-semibold">Clics en redes</h2>
          <HBars rows={(Object.keys(s.social) as SocialKey[]).map((k) => ({ label: SOCIAL_LABELS[k], value: s.social[k] }))} />
        </section>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="num mt-1 text-[32px] font-semibold leading-none">{value}</p>
    </div>
  );
}

function Empty() {
  return <p className="text-[15px] text-ink-2">Todavía no hay visitas en este rango. Aparecen en cuanto alguien toca una tarjeta o abre tu enlace.</p>;
}
