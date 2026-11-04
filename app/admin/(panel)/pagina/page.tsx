import { PageEditor } from "@/components/admin/page-editor";
import { col, getDraft } from "@/lib/server/db";
import { requireOwner } from "@/lib/server/session";

export const metadata = { title: "Página" };

export default async function Page() {
  const { tenant, readOnly } = await requireOwner();
  const [draft, cards] = await Promise.all([getDraft(tenant.id), col.cards().where("tenantId", "==", tenant.id).limit(1).get()]);
  return <PageEditor initial={tenant} draft={draft} readOnly={readOnly} hasCards={!cards.empty} />;
}
