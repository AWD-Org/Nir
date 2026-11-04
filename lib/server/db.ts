import "server-only";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { AuditEntry, Card, DayStats, MenuDraft, Payment, PublicPage, Tenant, UserDoc } from "@/lib/domain/types";

/** Convierte Timestamps de Firestore a ISO (recursivo) para pasar datos a componentes. */
export function fromFs<T>(value: unknown): T {
  if (value instanceof Timestamp) return value.toDate().toISOString() as T;
  if (Array.isArray(value)) return value.map((v) => fromFs(v)) as T;
  if (value && typeof value === "object" && !(value instanceof Buffer) && !(value instanceof Uint8Array)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = fromFs(v);
    return out as T;
  }
  return value as T;
}

export const ts = (iso: string | Date) => Timestamp.fromDate(typeof iso === "string" ? new Date(iso) : iso);
export const nowTs = () => Timestamp.now();

const withId = <T>(snap: DocumentSnapshot): T | null =>
  snap.exists ? fromFs<T>({ id: snap.id, ...snap.data() }) : null;

export const col = {
  users: () => adminDb().collection("users"),
  owners: () => adminDb().collection("owners"),
  tenants: () => adminDb().collection("tenants"),
  slugs: () => adminDb().collection("slugs"),
  cards: () => adminDb().collection("cards"),
  images: () => adminDb().collection("images"),
  payments: () => adminDb().collection("payments"),
  stats: () => adminDb().collection("stats"),
  audit: () => adminDb().collection("auditLog"),
};

export const draftRef = (tenantId: string) => col.tenants().doc(tenantId).collection("menu").doc("draft");
export const pageRef = (tenantId: string) => col.tenants().doc(tenantId).collection("public").doc("page");

export async function getUser(uid: string) {
  return withId<UserDoc & { id: string }>(await col.users().doc(uid).get());
}

export async function getTenant(id: string) {
  return withId<Tenant>(await col.tenants().doc(id).get());
}

export async function getDraft(tenantId: string): Promise<MenuDraft> {
  const snap = await draftRef(tenantId).get();
  return snap.exists
    ? fromFs<MenuDraft>(snap.data())
    : { categories: {}, items: {}, itemCount: 0, updatedAt: new Date().toISOString(), updatedBy: "" };
}

export async function getPage(tenantId: string) {
  const snap = await pageRef(tenantId).get();
  return snap.exists ? fromFs<PublicPage>(snap.data()) : null;
}

export async function getCards(tenantId: string) {
  const q = await col.cards().where("tenantId", "==", tenantId).orderBy("table").get();
  return q.docs.map((d) => fromFs<Card>({ id: d.id, ...d.data() }));
}

export async function getPayments(tenantId: string) {
  const q = await col.payments().where("tenantId", "==", tenantId).orderBy("paidAt", "desc").limit(100).get();
  return q.docs.map((d) => fromFs<Payment>({ id: d.id, ...d.data() }));
}

export async function getStats(tenantId: string, fromKey: string) {
  const q = await col.stats().where("tenantId", "==", tenantId).where("date", ">=", fromKey).orderBy("date", "desc").get();
  return q.docs.map((d) => fromFs<DayStats>(d.data()));
}

export async function getAudit(tenantId?: string, limit = 100) {
  const base = tenantId ? col.audit().where("tenantId", "==", tenantId) : col.audit();
  const q = await base.orderBy("at", "desc").limit(limit).get();
  return q.docs.map((d) => fromFs<AuditEntry>({ id: d.id, ...d.data() }));
}
