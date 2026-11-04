import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { STATUS_LABELS } from "@/lib/domain/constants";
import { formatDate } from "@/lib/domain/dates";
import type { Tenant, TenantStatus } from "@/lib/domain/types";
import { col, fromFs } from "@/lib/server/db";

export const metadata = { title: "Negocios" };
export const dynamic = "force-dynamic";

const FILTERS: (TenantStatus | "todos")[] = ["todos", "preview", "active", "due", "grace", "suspended", "cancelled"];

/** RF38: lista de negocios con estado, entrega, próximo pago y tarjetas. */
export default async function Page({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string }> }) {
  const { estado = "todos", q = "" } = await searchParams;
  const base = estado !== "todos" ? col.tenants().where("status", "==", estado) : col.tenants();
  const [snap, cardsSnap] = await Promise.all([base.limit(500).get(), col.cards().select("tenantId", "status").get()]);
  const cards = new Map<string, number>();
  cardsSnap.docs.forEach((d) => {
    if (d.data().status !== "disabled") cards.set(d.data().tenantId, (cards.get(d.data().tenantId) ?? 0) + 1);
  });
  const term = q.trim().toLowerCase();
  const tenants = snap.docs
    .map((d) => fromFs<Tenant>({ id: d.id, ...d.data() }))
    .filter((t) => !term || t.name.toLowerCase().includes(term) || t.slug.includes(term))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[28px] font-semibold leading-tight">Negocios</h1>
        <form className="flex gap-2" role="search">
          {estado !== "todos" && <input type="hidden" name="estado" value={estado} />}
          <input name="q" defaultValue={q} placeholder="Buscar por nombre o dirección" className="field w-64" aria-label="Buscar negocio" />
        </form>
      </div>
      <nav className="flex flex-wrap gap-1.5" aria-label="Filtrar por estado">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "todos" ? "/console" : `/console?estado=${f}`}
            aria-current={estado === f ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-sm ${estado === f ? "border-ink bg-ink text-white" : "border-line-2 bg-surface text-ink-2 hover:text-ink"}`}
          >
            {f === "todos" ? "Todos" : STATUS_LABELS[f]}
          </Link>
        ))}
      </nav>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[15px]">
          <thead>
            <tr className="border-b border-line text-sm text-ink-2">
              <th className="px-4 py-2.5 font-medium">Negocio</th>
              <th className="px-4 py-2.5 font-medium">Estado</th>
              <th className="px-4 py-2.5 font-medium">Tarjetas entregadas</th>
              <th className="px-4 py-2.5 font-medium">Próximo pago</th>
              <th className="px-4 py-2.5 text-right font-medium">Tarjetas</th>
              <th className="px-4 py-2.5 font-medium">Alta</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t, i) => (
              <tr key={t.id} className="anim-rise border-b border-line/70 last:border-0 hover:bg-paper/60" style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
                <td className="px-4 py-3">
                  <Link href={`/console/negocios/${t.id}`} className="font-medium hover:underline">{t.name}</Link>
                  <p className="num text-sm text-ink-2">/{t.slug}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3">{formatDate(t.billing.cardsDeliveredAt)}</td>
                <td className="px-4 py-3">{formatDate(t.billing.nextPaymentAt)}</td>
                <td className="num px-4 py-3 text-right">{cards.get(t.id) ?? 0}</td>
                <td className="px-4 py-3 text-ink-2">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && <p className="px-4 py-8 text-center text-ink-2">No hay negocios con este filtro.</p>}
      </div>
    </div>
  );
}
