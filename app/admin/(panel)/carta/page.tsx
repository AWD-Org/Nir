import { MenuEditor } from "@/components/admin/menu-editor";
import { getDraft } from "@/lib/server/db";
import { requireOwner } from "@/lib/server/session";

export const metadata = { title: "Carta" };

export default async function Page() {
  const { tenant, readOnly } = await requireOwner();
  const draft = await getDraft(tenant.id);
  return <MenuEditor tenant={tenant} initial={draft} readOnly={readOnly} />;
}
