import "server-only";
import { unstable_cache } from "next/cache";
import { fromFs, col, pageRef } from "./db";
import type { CardStatus, PublicPage } from "@/lib/domain/types";

export interface SlugInfo {
  tenantId: string;
  current: boolean;
  /** Slug vigente del negocio cuando `slug` es uno anterior (RF37). */
  currentSlug: string;
}

/** slug → negocio. En caché de Next.js; se invalida al cambiar de slug. */
export const resolveSlug = (slug: string) =>
  unstable_cache(
    async (): Promise<SlugInfo | null> => {
      const snap = await col.slugs().doc(slug).get();
      if (!snap.exists) return null;
      const { tenantId, current } = snap.data() as { tenantId: string; current: boolean };
      if (current) return { tenantId, current: true, currentSlug: slug };
      const t = await col.tenants().doc(tenantId).get();
      return { tenantId, current: false, currentSlug: (t.data()?.slug as string) ?? slug };
    },
    ["slug", slug],
    { tags: ["slugs", `slug:${slug}`], revalidate: 86_400 },
  )();

/** Documento público del negocio (1 lectura al regenerar). */
export const getPublicPage = (tenantId: string) =>
  unstable_cache(
    async (): Promise<PublicPage | null> => {
      const snap = await pageRef(tenantId).get();
      return snap.exists ? fromFs<PublicPage>(snap.data()) : null;
    },
    ["page", tenantId],
    { tags: [`page:${tenantId}`], revalidate: 86_400 },
  )();

/** Mapa de tarjetas del negocio: "{mesa}-{sufijo}" → estado. Evita leer Firestore en cada toque. */
export const getCardIndex = (tenantId: string) =>
  unstable_cache(
    async (): Promise<Record<string, CardStatus>> => {
      const q = await col.cards().where("tenantId", "==", tenantId).select("table", "suffix", "status").get();
      const out: Record<string, CardStatus> = {};
      for (const d of q.docs) {
        const c = d.data() as { table: number; suffix: string; status: CardStatus };
        out[`${c.table}-${c.suffix}`] = c.status;
      }
      return out;
    },
    ["cards", tenantId],
    { tags: [`cards:${tenantId}`], revalidate: 86_400 },
  )();
