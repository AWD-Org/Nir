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
  const tenant = await writePublicPage(tenantId);
  if (tenant) revalidatePublic(tenantId, tenant.slug);
}

/** Escribe public/page sin revalidar (por ejemplo, al crear un negocio en vista previa). */
export async function writePublicPage(tenantId: string) {
  const [tenant, draft] = await Promise.all([getTenant(tenantId), getDraft(tenantId)]);
  if (!tenant) return null;
  await pageRef(tenantId).set(buildPublicPage(tenant, draft));
  await col.tenants().doc(tenantId).update({ publishedAt: nowTs() });
  return tenant;
}

export function revalidatePublic(tenantId: string, slug: string) {
  revalidateTag(`page:${tenantId}`);
  revalidatePath(`/${slug}`);
}
