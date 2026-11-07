"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebase/admin";
import { applyDelivery, applyPayment } from "@/lib/domain/billing";
import { cardId, cardUrl, randomSuffix } from "@/lib/cards/suffix";
import { LIMITS } from "@/lib/domain/constants";
import { SITE_URL } from "@/lib/domain/links";
import { firstIssue, paymentSchema } from "@/lib/domain/schemas";
import { slugify, validateSlug } from "@/lib/domain/slug";
import { statusFor } from "@/lib/domain/status";
import type { Card, Tenant, TenantStatus } from "@/lib/domain/types";
import { logAudit } from "@/lib/server/audit";
import { col, fromFs, getTenant, nowTs, ts } from "@/lib/server/db";
import { applyMenuImport } from "@/lib/server/menu-import";
import { publishTenant } from "@/lib/server/publish";
import { ActionError, getSession, isStaffRole, run, staffForAction, VIEW_AS_COOKIE } from "@/lib/server/session";

async function tenantOr404(id: string): Promise<Tenant> {
  const t = await getTenant(id);
  if (!t) throw new ActionError("No encontramos ese negocio.");
  return t;
}

/** Fechas de cobro como Timestamp para que funcionen los índices y el cron. */
function billingToFs(b: Tenant["billing"]) {
  return {
    ...b,
    setupPaidAt: b.setupPaidAt ? ts(b.setupPaidAt) : null,
    cardsDeliveredAt: b.cardsDeliveredAt ? ts(b.cardsDeliveredAt) : null,
    nextPaymentAt: b.nextPaymentAt ? ts(b.nextPaymentAt) : null,
    paidUntil: b.paidUntil ? ts(b.paidUntil) : null,
  };
}

const refresh = (id: string) => revalidatePath(`/console/negocios/${id}`);

/* ---------- Activación y suspensión (RF39, RN02, RN09) ---------- */

export async function setStatus(tenantId: string, target: "active" | "suspended" | "cancelled" | "preview") {
  return run(async () => {
    const s = await staffForAction();
    const t = await tenantOr404(tenantId);
    if (target === "cancelled" && s.role !== "superadmin") throw new ActionError("Solo un superadmin puede cancelar cuentas.");
    let next: TenantStatus = target;
    const update: Record<string, unknown> = { updatedAt: nowTs() };
    if (target === "active") {
      if (!t.billing.setupPaidAt) throw new ActionError("Registra primero el pago del alta (RN02).");
      // Si ya corre la vigencia, el estado sale de la fecha pagada (activa, por vencer o gracia).
      if (t.billing.paidUntil) {
        next = statusFor(new Date(t.billing.paidUntil));
        if (next === "suspended" || next === "cancelled") throw new ActionError("La vigencia ya venció. Registra el pago para reactivar.");
      }
      update.activatedAt = nowTs();
      update.activatedBy = s.uid;
    }
    update.status = next;
    await col.tenants().doc(tenantId).update(update);
    await logAudit(s, tenantId, target === "active" ? "activate" : target === "preview" ? "status.preview" : target === "suspended" ? "suspend" : "cancel", { status: t.status }, { status: next });
    await publishTenant(tenantId);
    refresh(tenantId);
  });
}

/* ---------- Pagos (RF40) ---------- */

export async function recordPayment(tenantId: string, input: { concept: string; amountCents: number; method: string; reference: string; paidAt: string }) {
  return run(async () => {
    const s = await staffForAction();
    const p = paymentSchema.safeParse(input);
    if (!p.success) throw new ActionError(firstIssue(p.error));
    const t = await tenantOr404(tenantId);
    const paidAt = new Date(`${p.data.paidAt}T12:00:00-06:00`);
    if (Number.isNaN(paidAt.getTime())) throw new ActionError("Fecha de pago inválida.");
    const effect = applyPayment(t.billing, t.status, p.data.concept, paidAt);

    const payRef = col.payments().doc();
    const batch = adminDb().batch();
    batch.set(payRef, {
      tenantId,
      concept: p.data.concept,
      amountCents: p.data.amountCents,
      currency: "MXN",
      method: p.data.method,
      reference: p.data.reference,
      paidAt: ts(paidAt),
      coversFrom: effect.coversFrom ? ts(effect.coversFrom) : null,
      coversUntil: effect.coversUntil ? ts(effect.coversUntil) : null,
      recordedBy: s.uid,
      createdAt: nowTs(),
    });
    batch.update(col.tenants().doc(tenantId), { billing: billingToFs(effect.billing), status: effect.status, updatedAt: nowTs() });
    await batch.commit();
    await logAudit(s, tenantId, "payment.create", { billing: t.billing, status: t.status }, { payment: { id: payRef.id, ...p.data }, billing: effect.billing, status: effect.status });
    if (effect.status !== t.status) await publishTenant(tenantId);
    refresh(tenantId);
    return { status: effect.status, paidUntil: effect.billing.paidUntil };
  });
}

/* ---------- Entrega de tarjetas (RF41) ---------- */

export async function recordDelivery(tenantId: string, date: string) {
  return run(async () => {
    const s = await staffForAction();
    const t = await tenantOr404(tenantId);
    const d = new Date(`${date}T12:00:00-06:00`);
    if (Number.isNaN(d.getTime())) throw new ActionError("Fecha inválida.");
    const billing = applyDelivery(t.billing, d);
    const cards = await col.cards().where("tenantId", "==", tenantId).where("status", "==", "produced").get();
    const batch = adminDb().batch();
    batch.update(col.tenants().doc(tenantId), { billing: billingToFs(billing), updatedAt: nowTs() });
    cards.docs.forEach((c) => batch.update(c.ref, { status: "delivered", deliveredAt: ts(d) }));
    await batch.commit();
    revalidateTag(`cards:${tenantId}`);
    await logAudit(s, tenantId, "cards.delivered", { billing: t.billing }, { billing, cards: cards.size });
    refresh(tenantId);
  });
}

/* ---------- Tarjetas (RF32, RF36, RF45) ---------- */

/** Genera una tarjeta por cada mesa que todavía no tenga una tarjeta vigente. */
export async function generateCards(tenantId: string, tables: number) {
  return run(async () => {
    const s = await staffForAction();
    if (!Number.isInteger(tables) || tables < 1 || tables > LIMITS.tables) throw new ActionError(`Indica de 1 a ${LIMITS.tables} mesas.`);
    const t = await tenantOr404(tenantId);
    const existing = await col.cards().where("tenantId", "==", tenantId).get();
    const active = new Set(existing.docs.filter((d) => d.data().status !== "disabled").map((d) => d.data().table as number));
    const batch = adminDb().batch();
    let created = 0;
    for (let n = 1; n <= tables; n++) {
      if (active.has(n)) continue;
      const suffix = randomSuffix();
      batch.set(col.cards().doc(cardId(tenantId, n, suffix)), newCard(t, n, suffix));
      created++;
    }
    const tableList = Array.from({ length: Math.max(tables, t.tables.length) }, (_, i) => ({ number: i + 1, label: `Mesa ${i + 1}` }));
    batch.update(col.tenants().doc(tenantId), { tables: tableList, updatedAt: nowTs() });
    await batch.commit();
    revalidateTag(`cards:${tenantId}`);
    await logAudit(s, tenantId, "cards.generate", null, { tables, created });
    refresh(tenantId);
    return { created };
  });
}

function newCard(t: Tenant, table: number, suffix: string) {
  return {
    tenantId: t.id,
    slug: t.slug,
    table,
    suffix,
    url: cardUrl(SITE_URL, t.slug, table, suffix),
    status: "produced",
    producedAt: nowTs(),
    deliveredAt: null,
    disabledAt: null,
    replacedBy: null,
    writtenAt: null,
  };
}

export async function disableCard(id: string, replace: boolean) {
  return run(async () => {
    const s = await staffForAction();
    const snap = await col.cards().doc(id).get();
    if (!snap.exists) throw new ActionError("No encontramos la tarjeta.");
    const card = fromFs<Card>({ id, ...snap.data() });
    const t = await tenantOr404(card.tenantId);
    const batch = adminDb().batch();
    let replacement: string | null = null;
    if (replace) {
      const suffix = randomSuffix();
      replacement = cardId(t.id, card.table, suffix);
      batch.set(col.cards().doc(replacement), newCard(t, card.table, suffix));
    }
    batch.update(snap.ref, { status: "disabled", disabledAt: nowTs(), replacedBy: replacement });
    await batch.commit();
    revalidateTag(`cards:${t.id}`);
    await logAudit(s, t.id, replace ? "card.replace" : "card.disable", { card: id, status: card.status }, { status: "disabled", replacedBy: replacement });
    refresh(t.id);
  });
}

export async function markCardWritten(id: string) {
  return run(async () => {
    const s = await staffForAction();
    const snap = await col.cards().doc(id).get();
    if (!snap.exists) throw new ActionError("No encontramos la tarjeta.");
    await snap.ref.update({ writtenAt: nowTs() });
    await logAudit(s, snap.data()!.tenantId, "card.nfc_written", null, { card: id });
  });
}

/* ---------- Ver como el cliente (RF43) ---------- */

export async function viewAs(tenantId: string) {
  return run(async () => {
    const s = await staffForAction();
    await tenantOr404(tenantId);
    const jar = await cookies();
    jar.set(VIEW_AS_COOKIE, tenantId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 2 });
    await logAudit(s, tenantId, "impersonate");
  });
}

export async function exitViewAs() {
  const s = await getSession();
  if (!s || !isStaffRole(s.role)) return;
  const jar = await cookies();
  jar.delete(VIEW_AS_COOKIE);
}

/* ---------- Cambio de slug (RF37, RN04) ---------- */

export async function changeSlug(tenantId: string, raw: string) {
  return run(async () => {
    const s = await staffForAction();
    if (s.role !== "superadmin") throw new ActionError("Solo un superadmin puede cambiar la dirección de un negocio.");
    const slug = slugify(raw);
    const problem = validateSlug(slug);
    if (problem) throw new ActionError(problem);
    const t = await tenantOr404(tenantId);
    if (slug === t.slug) throw new ActionError("Es la misma dirección.");
    await adminDb().runTransaction(async (tx) => {
      const existing = await tx.get(col.slugs().doc(slug));
      if (existing.exists && existing.data()!.tenantId !== tenantId) throw new ActionError("Esa dirección ya la usa otro negocio.");
      tx.set(col.slugs().doc(slug), { tenantId, current: true, createdAt: nowTs() });
      tx.update(col.slugs().doc(t.slug), { current: false });
      tx.update(col.tenants().doc(tenantId), { slug, updatedAt: nowTs() });
    });
    revalidateTag(`slug:${t.slug}`);
    revalidateTag(`slug:${slug}`);
    revalidatePath(`/${t.slug}`);
    await logAudit(s, tenantId, "slug.change", { slug: t.slug }, { slug });
    await publishTenant(tenantId);
    refresh(tenantId);
  });
}

/* ---------- Cargar carta desde CSV ---------- */

/** Carga una carta desde CSV (ver docs/importar-carta.md). */
export async function importMenu(tenantId: string, csv: string, mode: "append" | "replace") {
  return run(async () => {
    const s = await staffForAction();
    await tenantOr404(tenantId);
    const result = await applyMenuImport(tenantId, csv, mode, s.uid);
    await logAudit(s, tenantId, mode === "replace" ? "menu.import.replace" : "menu.import.append", null, result);
    await publishTenant(tenantId);
    refresh(tenantId);
    return result;
  });
}
