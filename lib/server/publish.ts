import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { buildPublicPage } from "@/lib/domain/publish";
import { col, getDraft, getTenant, nowTs, pageRef } from "./db";

/**
 * Publica el negocio: arma public/page desde el negocio y la carta, y revalida la página
 * en caché. Se llama después de cada cambio del dueño (cambios visibles en menos de 10 s)
 * y cuando AMOXTLI® cambia el estado de la cuenta.
 */
export async function publishTenant(tenantId: string) {
  const [tenant, draft] = await Promise.all([getTenant(tenantId), getDraft(tenantId)]);
  if (!tenant) return;
  const page = buildPublicPage(tenant, draft);
  await pageRef(tenantId).set(page);
  await col.tenants().doc(tenantId).update({ publishedAt: nowTs() });
  revalidatePublic(tenantId, tenant.slug);
}

export function revalidatePublic(tenantId: string, slug: string) {
  revalidateTag(`page:${tenantId}`);
  revalidatePath(`/${slug}`);
}
