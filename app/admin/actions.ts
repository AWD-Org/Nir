"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { emptyBilling } from "@/lib/domain/billing";
import { DEFAULT_BUTTONS, LIMITS, TERMS_VERSION } from "@/lib/domain/constants";
import { newId } from "@/lib/domain/id";
import {
  buttonsSchema,
  categorySchema,
  firstIssue,
  itemSchema,
  linksSchema,
  profileSchema,
  themeSchema,
  wifiSchema,
} from "@/lib/domain/schemas";
import { slugify, validateSlug } from "@/lib/domain/slug";
import type { ItemInput } from "@/lib/domain/schemas";
import type { MenuItem, TenantTheme } from "@/lib/domain/types";
import { TEMPLATES, themeIssues } from "@/lib/themes";
import { logAudit } from "@/lib/server/audit";
import { col, draftRef, getDraft, nowTs } from "@/lib/server/db";
import { publishTenant, writePublicPage } from "@/lib/server/publish";
import { ActionError, getSession, ownerForAction, run, type OwnerContext } from "@/lib/server/session";
import { isWebp } from "@/lib/media/webp";
import { applyMenuImport } from "@/lib/server/menu-import";

/* ---------- Alta del negocio (RF05, RF06) ---------- */

export async function checkSlug(raw: string) {
  const slug = slugify(raw);
  const problem = validateSlug(slug);
  if (problem) return { slug, available: false, message: problem };
  const snap = await col.slugs().doc(slug).get();
  return snap.exists
    ? { slug, available: false, message: "Ese nombre ya está en uso. Prueba con otro." }
    : { slug, available: true, message: "Disponible" };
}

/**
 * Crea el negocio en una transacción: rechaza un segundo negocio para la misma cuenta y un
 * slug repetido. Después asigna los custom claims { role: "owner", tenantId }.
 */
export async function createBusiness(input: { name: string; slug: string; acceptTerms: boolean }) {
  return run(async () => {
    const s = await getSession();
    if (!s) throw new ActionError("Tu sesión terminó. Vuelve a entrar.");
    if (s.role !== "owner") throw new ActionError("Las cuentas de AMOXTLI® no pueden tener negocio.");
    const name = input.name.trim();
    if (name.length < 2 || name.length > 60) throw new ActionError("Escribe el nombre del negocio (2 a 60 caracteres).");
    const slug = slugify(input.slug || name);
    const problem = validateSlug(slug);
    if (problem) throw new ActionError(problem);

    const db = adminDb();
    const tenantId = newId("t", 10);
    const userRef = col.users().doc(s.uid);

    await db.runTransaction(async (tx) => {
      const [owner, slugDoc, user] = await Promise.all([
        tx.get(col.owners().doc(s.uid)),
        tx.get(col.slugs().doc(slug)),
        tx.get(userRef),
      ]);
      if (owner.exists) throw new ActionError("Ya tienes un negocio. Cada cuenta de Nir tiene un solo negocio.");
      if (slugDoc.exists) throw new ActionError("Ese nombre ya está en uso. Prueba con otro.");
      const terms = user.data()?.termsAcceptedAt;
      if (!terms && !input.acceptTerms) throw new ActionError("Acepta los términos y el aviso de privacidad para continuar.");

      const now = nowTs();
      const t = TEMPLATES.claro;
      tx.create(col.tenants().doc(tenantId), {
        name,
        slug,
        ownerUid: s.uid,
        status: "preview",
        profile: { phone: "", address: "", hours: "", logoImageId: null, coverImageId: null },
        links: { googleReviewUrl: "", instagram: "", facebook: "", tiktok: "", whatsapp: "" },
        wifi: { enabled: false, ssid: "", password: "" },
        buttons: DEFAULT_BUTTONS,
        theme: { templateId: t.id, ...t.defaults },
        tables: [],
        billing: emptyBilling(),
        activatedAt: null,
        activatedBy: null,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      });
      tx.create(draftRef(tenantId), { categories: {}, items: {}, itemCount: 0, updatedAt: now, updatedBy: s.uid });
      tx.create(col.owners().doc(s.uid), { tenantId, createdAt: now });
      tx.create(col.slugs().doc(slug), { tenantId, current: true, createdAt: now });
      tx.set(
        userRef,
        {
          tenantId,
          ...(!terms ? { termsVersion: TERMS_VERSION, termsAcceptedAt: now } : {}),
        },
        { merge: true },
      );
    });

    await adminAuth().setCustomUserClaims(s.uid, { role: "owner", tenantId });
    // Sin revalidar: la cuenta está en vista previa y así el asistente sigue en pantalla.
    await writePublicPage(tenantId);
    return { tenantId, slug };
  });
}

/* ---------- Utilidades ---------- */

async function afterChange(ctx: OwnerContext, what: string, data?: Record<string, unknown>) {
  if (ctx.viewingAs) await logAudit(ctx.session, ctx.tenant.id, `support.${what}`, null, data ?? null);
  await publishTenant(ctx.tenant.id);
}

const tenantRef = (id: string) => col.tenants().doc(id);

/* ---------- Página: datos, enlaces, Wi-Fi, botones, diseño ---------- */

export async function saveProfile(input: { name: string; phone: string; address: string; hours: string }) {
  return run(async () => {
    const ctx = await ownerForAction();
    const p = profileSchema.safeParse(input);
    if (!p.success) throw new ActionError(firstIssue(p.error));
    const update: Record<string, unknown> = {
      "profile.phone": p.data.phone,
      "profile.address": p.data.address,
      "profile.hours": p.data.hours,
      updatedAt: nowTs(),
    };
    if (p.data.name !== ctx.tenant.name) {
      const hasCards = !(await col.cards().where("tenantId", "==", ctx.tenant.id).limit(1).get()).empty;
      if (hasCards) throw new ActionError("El nombre ya está en tus tarjetas. Pide el cambio a AMOXTLI®.");
      update.name = p.data.name;
    }
    await tenantRef(ctx.tenant.id).update(update);
    await afterChange(ctx, "profile", p.data);
  });
}

export async function saveLinks(input: { googleReviewUrl: string; instagram: string; facebook: string; tiktok: string; whatsapp: string }) {
  return run(async () => {
    const ctx = await ownerForAction();
    const p = linksSchema.safeParse(input);
    if (!p.success) throw new ActionError(firstIssue(p.error));
    const links = { ...p.data, whatsapp: p.data.whatsapp.replace(/[\s+-]/g, "") };
    await tenantRef(ctx.tenant.id).update({ links, updatedAt: nowTs() });
    await afterChange(ctx, "links", links);
  });
}

export async function saveWifi(input: { enabled: boolean; ssid: string; password: string }) {
  return run(async () => {
    const ctx = await ownerForAction();
    const p = wifiSchema.safeParse(input);
    if (!p.success) throw new ActionError(firstIssue(p.error));
    await tenantRef(ctx.tenant.id).update({ wifi: p.data, updatedAt: nowTs() });
    await afterChange(ctx, "wifi");
  });
}

export async function saveButtons(input: { key: string; enabled: boolean }[]) {
  return run(async () => {
    const ctx = await ownerForAction();
    const p = buttonsSchema.safeParse(input);
    if (!p.success) throw new ActionError("Revisa los botones.");
    await tenantRef(ctx.tenant.id).update({ buttons: p.data, updatedAt: nowTs() });
    await afterChange(ctx, "buttons", { buttons: p.data });
  });
}

export async function saveTheme(input: TenantTheme) {
  return run(async () => {
    const ctx = await ownerForAction();
    const p = themeSchema.safeParse(input);
    if (!p.success) throw new ActionError(firstIssue(p.error));
    const issues = themeIssues(p.data);
    if (issues.length) throw new ActionError(issues[0]);
    await tenantRef(ctx.tenant.id).update({ theme: p.data, updatedAt: nowTs() });
    await afterChange(ctx, "theme", p.data);
  });
}

/* ---------- Imágenes en Firestore (RF11) ---------- */

export async function uploadImage(form: FormData) {
  return run(async () => {
    const ctx = await ownerForAction();
    const kind = String(form.get("kind"));
    if (!["logo", "cover", "item"].includes(kind)) throw new ActionError("Tipo de imagen inválido.");
    const full = form.get("full");
    const thumb = form.get("thumb");
    if (!(full instanceof Blob) || !(thumb instanceof Blob)) throw new ActionError("Falta la imagen.");
    if (full.size > LIMITS.fullImageBytes || thumb.size > LIMITS.thumbImageBytes) {
      throw new ActionError("La imagen es demasiado pesada. Intenta con otra foto.");
    }
    const [fullBuf, thumbBuf] = await Promise.all([full.arrayBuffer(), thumb.arrayBuffer()]).then((b) => b.map((x) => Buffer.from(x)));
    if (!isWebp(fullBuf) || !isWebp(thumbBuf)) throw new ActionError("Formato de imagen inválido.");

    const imageId = newId("img", 16);
    await col.images().doc(imageId).set({
      tenantId: ctx.tenant.id,
      kind,
      mime: "image/webp",
      full: fullBuf,
      thumb: thumbBuf,
      size: fullBuf.length + thumbBuf.length,
      createdAt: nowTs(),
      createdBy: ctx.session.uid,
    });
    if (kind === "logo" || kind === "cover") {
      await tenantRef(ctx.tenant.id).update({ [`profile.${kind}ImageId`]: imageId, updatedAt: nowTs() });
      await afterChange(ctx, `image.${kind}`);
    }
    return { imageId };
  });
}

export async function removeProfileImage(kind: "logo" | "cover") {
  return run(async () => {
    const ctx = await ownerForAction();
    await tenantRef(ctx.tenant.id).update({ [`profile.${kind}ImageId`]: null, updatedAt: nowTs() });
    await afterChange(ctx, `image.${kind}.remove`);
  });
}

/* ---------- Carta (RF08–RF14) ---------- */

async function touchDraft(ctx: OwnerContext, update: Record<string, unknown>) {
  await draftRef(ctx.tenant.id).update({ ...update, updatedAt: nowTs(), updatedBy: ctx.session.uid });
}

export async function saveCategory(id: string | null, input: { name: string; visible: boolean }) {
  return run(async () => {
    const ctx = await ownerForAction();
    const p = categorySchema.safeParse(input);
    if (!p.success) throw new ActionError(firstIssue(p.error));
    if (id) {
      await touchDraft(ctx, { [`categories.${id}.name`]: p.data.name, [`categories.${id}.visible`]: p.data.visible });
      await afterChange(ctx, "category.update");
      return { id };
    }
    const draft = await getDraft(ctx.tenant.id);
    const count = Object.keys(draft.categories).length;
    if (count >= LIMITS.categories) throw new ActionError(`Máximo ${LIMITS.categories} categorías.`);
    const newIdValue = newId("c", 8);
    const order = Math.max(0, ...Object.values(draft.categories).map((c) => c.order + 1));
    await touchDraft(ctx, { [`categories.${newIdValue}`]: { ...p.data, order } });
    await afterChange(ctx, "category.create");
    return { id: newIdValue };
  });
}

export async function addCategories(names: string[]) {
  return run(async () => {
    const ctx = await ownerForAction();
    const draft = await getDraft(ctx.tenant.id);
    const existing = new Set(Object.values(draft.categories).map((c) => c.name.toLowerCase()));
    const fresh = names.map((n) => n.trim()).filter((n) => n && !existing.has(n.toLowerCase())).slice(0, 10);
    if (Object.keys(draft.categories).length + fresh.length > LIMITS.categories) throw new ActionError(`Máximo ${LIMITS.categories} categorías.`);
    let order = Math.max(0, ...Object.values(draft.categories).map((c) => c.order + 1));
    const update: Record<string, unknown> = {};
    const created: Record<string, { name: string; visible: boolean; order: number }> = {};
    for (const name of fresh) {
      const cid = newId("c", 8);
      created[cid] = { name: name.slice(0, 40), visible: true, order: order++ };
      update[`categories.${cid}`] = created[cid];
    }
    if (fresh.length) {
      await touchDraft(ctx, update);
      await afterChange(ctx, "category.create");
    }
    return created;
  });
}

export async function deleteCategory(id: string) {
  return run(async () => {
    const ctx = await ownerForAction();
    const draft = await getDraft(ctx.tenant.id);
    const itemIds = Object.entries(draft.items).filter(([, i]) => i.categoryId === id).map(([iid]) => iid);
    const update: Record<string, unknown> = { [`categories.${id}`]: FieldValue.delete(), itemCount: FieldValue.increment(-itemIds.length) };
    for (const iid of itemIds) update[`items.${iid}`] = FieldValue.delete();
    await touchDraft(ctx, update);
    await afterChange(ctx, "category.delete", { id, items: itemIds.length });
  });
}

export async function reorderCategories(ids: string[]) {
  return run(async () => {
    const ctx = await ownerForAction();
    const update: Record<string, unknown> = {};
    ids.slice(0, LIMITS.categories).forEach((id, i) => (update[`categories.${id}.order`] = i));
    await touchDraft(ctx, update);
    await afterChange(ctx, "category.reorder");
  });
}

export async function saveItem(id: string | null, input: ItemInput) {
  return run(async () => {
    const ctx = await ownerForAction();
    const p = itemSchema.safeParse(input);
    if (!p.success) throw new ActionError(firstIssue(p.error));
    const ref = draftRef(ctx.tenant.id);
    const result = await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const draft = snap.data() as { categories: Record<string, unknown>; items: Record<string, MenuItem>; itemCount: number };
      if (!draft.categories[p.data.categoryId]) throw new ActionError("La categoría ya no existe.");
      if (p.data.featured && !draft.items[id ?? ""]?.featured && countFeatured(draft.items) >= LIMITS.featured) {
        throw new ActionError(`Puedes tener hasta ${LIMITS.featured} recomendados de la casa. Quita uno para agregar otro.`);
      }
      const now = nowTs();
      if (id) {
        const prev = draft.items[id];
        if (!prev) throw new ActionError("El producto ya no existe.");
        const order = prev.categoryId === p.data.categoryId ? prev.order : nextOrder(draft.items, p.data.categoryId);
        tx.update(ref, { [`items.${id}`]: { ...p.data, featured: p.data.featured ?? prev.featured ?? false, order }, updatedAt: now, updatedBy: ctx.session.uid });
        return id;
      }
      if (draft.itemCount >= LIMITS.items) throw new ActionError(`Tu carta llegó al máximo de ${LIMITS.items} productos.`);
      const iid = newId("i", 8);
      tx.update(ref, {
        [`items.${iid}`]: { ...p.data, order: nextOrder(draft.items, p.data.categoryId) },
        itemCount: FieldValue.increment(1),
        updatedAt: now,
        updatedBy: ctx.session.uid,
      });
      return iid;
    });
    await afterChange(ctx, id ? "item.update" : "item.create", { id: result, name: p.data.name });
    return { id: result };
  });
}

function nextOrder(items: Record<string, MenuItem>, categoryId: string) {
  return Math.max(-1, ...Object.values(items).filter((i) => i.categoryId === categoryId).map((i) => i.order)) + 1;
}

export async function duplicateItem(id: string) {
  return run(async () => {
    const ctx = await ownerForAction();
    const draft = await getDraft(ctx.tenant.id);
    const item = draft.items[id];
    if (!item) throw new ActionError("El producto ya no existe.");
    const { order: _order, ...rest } = item;
    void _order;
    const r = await saveItem(null, { ...rest, featured: false, name: `${item.name} (copia)`.slice(0, 80) } as ItemInput);
    if (!r.ok) throw new ActionError(r.error);
    return r.data;
  });
}

export async function deleteItem(id: string) {
  return run(async () => {
    const ctx = await ownerForAction();
    await touchDraft(ctx, { [`items.${id}`]: FieldValue.delete(), itemCount: FieldValue.increment(-1) });
    await afterChange(ctx, "item.delete", { id });
  });
}

/** RF13: agotado o disponible con un toque; se publica al instante. */
export async function setAvailable(id: string, available: boolean) {
  return run(async () => {
    const ctx = await ownerForAction();
    await touchDraft(ctx, { [`items.${id}.available`]: available });
    await afterChange(ctx, "item.available", { id, available });
  });
}

const countFeatured = (items: Record<string, MenuItem>) => Object.values(items).filter((i) => i.featured).length;

/** Recomendado de la casa: etiqueta discreta junto al nombre. Se publica al instante. */
export async function setFeatured(id: string, featured: boolean) {
  return run(async () => {
    const ctx = await ownerForAction();
    if (featured) {
      const draft = await getDraft(ctx.tenant.id);
      if (!draft.items[id]) throw new ActionError("El producto ya no existe.");
      if (!draft.items[id].featured && countFeatured(draft.items) >= LIMITS.featured) {
        throw new ActionError(`Puedes tener hasta ${LIMITS.featured} recomendados de la casa. Quita uno para agregar otro.`);
      }
    }
    await touchDraft(ctx, { [`items.${id}.featured`]: featured });
    await afterChange(ctx, "item.featured", { id, featured });
  });
}

/** RF14: cambiar el precio desde la lista. */
export async function setPrice(id: string, priceCents: number) {
  return run(async () => {
    const ctx = await ownerForAction();
    if (!Number.isInteger(priceCents) || priceCents < 0 || priceCents > 100_000_000) throw new ActionError("Precio inválido.");
    await touchDraft(ctx, { [`items.${id}.priceCents`]: priceCents });
    await afterChange(ctx, "item.price", { id, priceCents });
  });
}

export async function reorderItems(ids: string[]) {
  return run(async () => {
    const ctx = await ownerForAction();
    const update: Record<string, unknown> = {};
    ids.slice(0, LIMITS.items).forEach((id, i) => (update[`items.${id}.order`] = i));
    await touchDraft(ctx, update);
    await afterChange(ctx, "item.reorder");
  });
}

/* ---------- Cargar carta desde archivo ---------- */

export async function importMyMenu(csv: string, mode: "append" | "replace") {
  return run(async () => {
    const ctx = await ownerForAction();
    const result = await applyMenuImport(ctx.tenant.id, csv, mode, ctx.session.uid);
    await logAudit(ctx.session, ctx.tenant.id, mode === "replace" ? "menu.import.replace" : "menu.import.append", null, result);
    await publishTenant(ctx.tenant.id);
    return result;
  });
}
