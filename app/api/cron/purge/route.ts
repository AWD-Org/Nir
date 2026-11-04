import { NextResponse } from "next/server";
import type { Firestore, Query } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { addDays, addMonths, dayKey } from "@/lib/domain/dates";
import type { MenuDraft, Tenant } from "@/lib/domain/types";
import { authorized } from "@/lib/server/cron";
import { col, draftRef, fromFs, pageRef, ts } from "@/lib/server/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function deleteQuery(db: Firestore, q: Query, max = 2000) {
  let deleted = 0;
  while (deleted < max) {
    const snap = await q.limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.size;
  }
  return deleted;
}

/**
 * Limpieza semanal (sección 9 del diseño de base de datos):
 * estadísticas > 13 meses, auditoría > 24 meses, fotos sin usar > 7 días y
 * negocios cancelados hace más de 12 meses (los pagos se conservan).
 */
export async function POST(req: Request) {
  if (!authorized(req)) return new NextResponse(null, { status: 401 });
  const db = adminDb();
  const now = new Date();
  const result = { stats: 0, audit: 0, images: 0, tenants: 0 };

  result.stats = await deleteQuery(db, col.stats().where("date", "<", dayKey(addMonths(now, -13))));
  result.audit = await deleteQuery(db, col.audit().where("at", "<", ts(addMonths(now, -24))));

  // Fotos sin usar
  const tenants = await col.tenants().get();
  const cutoff = ts(addDays(now, -7));
  for (const d of tenants.docs) {
    const t = fromFs<Tenant>({ id: d.id, ...d.data() });
    const draft = (await draftRef(t.id).get()).data() as MenuDraft | undefined;
    const used = new Set<string>([t.profile.logoImageId, t.profile.coverImageId, ...Object.values(draft?.items ?? {}).map((i) => i.imageId)].filter(Boolean) as string[]);
    const imgs = await col.images().where("tenantId", "==", t.id).where("createdAt", "<", cutoff).select().get();
    const orphan = imgs.docs.filter((i) => !used.has(i.id));
    for (let i = 0; i < orphan.length; i += 400) {
      const batch = db.batch();
      orphan.slice(i, i + 400).forEach((x) => batch.delete(x.ref));
      await batch.commit();
    }
    result.images += orphan.length;

    // Negocio cancelado hace más de 12 meses
    if (t.status === "cancelled" && new Date(t.updatedAt) < addMonths(now, -12)) {
      await deleteQuery(db, col.images().where("tenantId", "==", t.id));
      await deleteQuery(db, col.cards().where("tenantId", "==", t.id));
      await deleteQuery(db, col.stats().where("tenantId", "==", t.id));
      const slugs = await col.slugs().where("tenantId", "==", t.id).get();
      const batch = db.batch();
      slugs.docs.forEach((s) => batch.delete(s.ref));
      batch.delete(draftRef(t.id));
      batch.delete(pageRef(t.id));
      batch.delete(col.owners().doc(t.ownerUid));
      batch.update(col.users().doc(t.ownerUid), { tenantId: null });
      batch.delete(d.ref);
      await batch.commit();
      result.tenants++;
    }
  }
  return NextResponse.json(result);
}
