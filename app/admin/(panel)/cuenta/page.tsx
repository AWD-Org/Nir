import { CONCEPT_LABELS } from "@/lib/domain/billing";
import { formatDate } from "@/lib/domain/dates";
import { formatPrice } from "@/lib/domain/money";
import { kitWhatsappUrl } from "@/lib/domain/links";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPayments } from "@/lib/server/db";
import { requireOwner } from "@/lib/server/session";

export const metadata = { title: "Cuenta" };

/** RF23: plan, entrega de tarjetas, próximo pago e historial (solo lectura). */
export default async function Page() {
  const { tenant, session } = await requireOwner();
  const payments = await getPayments(tenant.id);
  const b = tenant.billing;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-[28px] font-semibold leading-tight">Cuenta</h1>

      <section className="panel divide-y divide-line">
        <Row label="Estado"><StatusBadge status={tenant.status} /></Row>
        <Row label="Plan">{b.cycle === "annual" ? "Anual" : "Mensual"}</Row>
        <Row label="Alta pagada">{formatDate(b.setupPaidAt)}</Row>
        <Row label="Tarjetas entregadas">{formatDate(b.cardsDeliveredAt)}</Row>
        <Row label="Próximo pago">{b.nextPaymentAt ? formatDate(b.nextPaymentAt) : "Se fija al entregar tus tarjetas"}</Row>
        <Row label="Correo de la cuenta">{session.email}</Row>
      </section>

      <section className="panel p-5">
        <h2 className="font-semibold">Pagos</h2>
        {payments.length === 0 ? (
          <p className="mt-2 text-[15px] text-ink-2">Aún no hay pagos registrados.</p>
        ) : (
          <div className="-mx-5 mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-[15px]">
              <thead>
                <tr className="border-b border-line text-sm text-ink-2">
                  <th className="px-5 py-2 font-medium">Fecha</th>
                  <th className="px-5 py-2 font-medium">Concepto</th>
                  <th className="px-5 py-2 font-medium">Cubre hasta</th>
                  <th className="px-5 py-2 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-line/70 last:border-0">
                    <td className="px-5 py-2.5">{formatDate(p.paidAt)}</td>
                    <td className="px-5 py-2.5">{CONCEPT_LABELS[p.concept]}</td>
                    <td className="px-5 py-2.5">{formatDate(p.coversUntil)}</td>
                    <td className="num px-5 py-2.5 text-right">{formatPrice(p.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-[15px] text-ink-2">
        Los pagos se hacen por transferencia o liga de pago. ¿Dudas con tu cuenta o necesitas más tarjetas?{" "}
        <a href={kitWhatsappUrl(tenant.name)} target="_blank" rel="noopener" className="font-medium text-brand-strong underline-offset-4 hover:underline">
          Escríbenos por WhatsApp
        </a>
        .
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
      <span className="text-[15px] text-ink-2">{label}</span>
      <span className="text-[15px] font-medium">{children}</span>
    </div>
  );
}
