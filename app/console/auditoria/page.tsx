import { AuditTable } from "@/components/console/audit-table";
import { col, getAudit } from "@/lib/server/db";

export const metadata = { title: "Auditoría" };
export const dynamic = "force-dynamic";

/** RF44: registro de acciones de AMOXTLI®. */
export default async function Page() {
  const [entries, tenants] = await Promise.all([getAudit(undefined, 200), col.tenants().select("name").get()]);
  const names = new Map(tenants.docs.map((d) => [d.id, d.data().name as string]));
  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-semibold leading-tight">Auditoría</h1>
      <div className="panel"><AuditTable entries={entries} names={names} /></div>
    </div>
  );
}
