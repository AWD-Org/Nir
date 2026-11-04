import Link from "next/link";
import { Mail } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { addDays, formatDate } from "@/lib/domain/dates";
import type { Tenant } from "@/lib/domain/types";
import { col, fromFs, ts } from "@/lib/server/db";

export const metadata = { title: "Por vencer" };
export const dynamic = "force-dynamic";

/** RF42 / RN08: pagos que vencen en los próximos 5 días, con correo de recordatorio prellenado. */
export default async function Page() {
  const limit = ts(addDays(new Date(), 5));
  const snap = await col.tenants().where("status", "in", ["active", "due", "grace"]).where("billing.nextPaymentAt", "<=", limit).orderBy("billing.nextPaymentAt").get();
  const tenants = snap.docs.map((d) => fromFs<Tenant>({ id: d.id, ...d.data() }));
  const owners = await Promise.all(tenants.map((t) => col.users().doc(t.ownerUid).get()));
  const emails = new Map(tenants.map((t, i) => [t.id, (owners[i].data()?.email as string) ?? ""]));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight">Pagos por vencer</h1>
        <p className="mt-1 text-ink-2">Vencen en los próximos 5 días o ya están en gracia. El recordatorio se envía a mano.</p>
      </div>
      <div className="panel divide-y divide-line">
        {tenants.length === 0 && <p className="px-4 py-8 text-center text-ink-2">Nada por vencer. Todo al corriente.</p>}
        {tenants.map((t) => {
          const date = formatDate(t.billing.nextPaymentAt);
          const subject = `Recordatorio de pago Nir · ${t.name}`;
          const body = `Hola,\n\nTe recordamos que el pago de tu ${t.billing.cycle === "annual" ? "anualidad" : "mensualidad"} de Nir para ${t.name} vence el ${date}.\n\nPuedes pagar por transferencia o con la liga de pago que te compartimos. Si ya pagaste, ignora este mensaje.\n\nGracias,\nEquipo AMOXTLI®`;
          return (
            <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/console/negocios/${t.id}`} className="font-medium hover:underline">{t.name}</Link>
                <p className="text-sm text-ink-2">{emails.get(t.id)} · vence {date}</p>
              </div>
              <StatusBadge status={t.status} />
              <a className="btn-secondary min-h-10 text-sm" href={`mailto:${emails.get(t.id)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
                <Mail className="h-4 w-4" /> Recordatorio
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
