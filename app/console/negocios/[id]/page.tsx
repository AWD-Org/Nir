import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AuditTable } from "@/components/console/audit-table";
import { MenuImport } from "@/components/console/menu-import";
import { CardsPanel, DeliveryForm, PaymentForm, SlugForm, StatusActions } from "@/components/console/tenant-panels";
import { StatusBadge } from "@/components/ui/status-badge";
import { CONCEPT_LABELS } from "@/lib/domain/billing";
import { formatDate } from "@/lib/domain/dates";
import { formatPrice } from "@/lib/domain/money";
import { getAudit, getCards, getDraft, getPayments, getTenant, getUser } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireStaff();
  const { id } = await params;
  const tenant = await getTenant(id);
  if (!tenant) notFound();
  const [owner, cards, payments, audit, draft] = await Promise.all([getUser(tenant.ownerUid), getCards(id), getPayments(id), getAudit(id, 50), getDraft(id)]);
  const b = tenant.billing;

  return (
    <div className="space-y-6">
      <Link href="/console" className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Negocios</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight">{tenant.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[15px] text-ink-2">
            <StatusBadge status={tenant.status} />
            <a href={`/${tenant.slug}`} target="_blank" className="num inline-flex items-center gap-1 hover:text-ink">/{tenant.slug} <ExternalLink className="h-3.5 w-3.5" /></a>
            <span>· {owner?.email}</span>
          </p>
        </div>
        <StatusActions tenant={tenant} isSuper={s.role === "superadmin"} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Alta pagada" value={formatDate(b.setupPaidAt)} />
        <Fact label="Tarjetas entregadas" value={formatDate(b.cardsDeliveredAt)} />
        <Fact label="Próximo pago" value={b.nextPaymentAt ? formatDate(b.nextPaymentAt) : b.prepaidMonths ? `${b.prepaidMonths} meses prepagados` : "—"} />
        <Fact label="Carta" value={`${Object.keys(draft.items).length} productos`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-4 font-semibold">Registrar pago</h2>
          <PaymentForm tenantId={id} />
        </section>
        <section className="panel p-5">
          <h2 className="mb-4 font-semibold">Pagos</h2>
          {payments.length === 0 ? (
            <p className="text-ink-2">Sin pagos.</p>
          ) : (
            <ul className="divide-y divide-line text-[15px]">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    {CONCEPT_LABELS[p.concept]} <span className="text-sm text-ink-2">· {formatDate(p.paidAt)}{p.coversUntil ? ` · cubre hasta ${formatDate(p.coversUntil)}` : ""}</span>
                  </span>
                  <span className="num">{formatPrice(p.amountCents)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="mb-3 text-[15px] font-semibold">Entrega de tarjetas</h3>
            <DeliveryForm tenantId={id} delivered={b.cardsDeliveredAt} />
          </div>
        </section>
      </div>

      <section className="panel p-5">
        <h2 className="font-semibold">Cargar carta desde archivo</h2>
        <p className="mb-4 mt-1 text-[15px] text-ink-2">Pega o sube un CSV con el formato de la plantilla. Antes de cargar ves cómo queda y qué líneas tienen errores.</p>
        <MenuImport tenantId={id} currentItems={Object.keys(draft.items).length} />
      </section>

      <section className="panel p-5">
        <h2 className="mb-4 font-semibold">Tarjetas</h2>
        <CardsPanel tenant={tenant} cards={cards} />
      </section>

      {s.role === "superadmin" && (
        <section className="panel p-5">
          <h2 className="mb-4 font-semibold">Dirección del negocio</h2>
          <SlugForm tenantId={id} slug={tenant.slug} />
        </section>
      )}

      <section className="panel">
        <h2 className="px-4 pb-2 pt-4 font-semibold">Auditoría</h2>
        <AuditTable entries={audit} />
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
