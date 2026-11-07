import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { LIMITS } from "@/lib/domain/constants";
import { newId } from "@/lib/domain/id";
import { parseMenuCsv, sameCategory } from "@/lib/domain/menu-import";
import type { MenuCategory, MenuItem } from "@/lib/domain/types";
import { draftRef, nowTs } from "./db";
import { ActionError } from "./session";

/**
 * Aplica un CSV a la carta del negocio en una transacción (lo usan la consola y el admin).
 * "append" agrega y reutiliza categorías con el mismo nombre; "replace" deja solo lo del archivo.
 * Si el archivo tiene errores no se carga nada.
 */
export async function applyMenuImport(tenantId: string, csv: string, mode: "append" | "replace", uid: string) {
  if (csv.length > 400_000) throw new ActionError("El archivo es demasiado grande.");
  const parsed = parseMenuCsv(csv);
  if (parsed.errors.length) throw new ActionError(`El archivo tiene ${parsed.errors.length} errores. Corrígelos y vuelve a intentarlo.`);
  if (!parsed.items.length) throw new ActionError("El archivo no tiene productos.");
    const ref = draftRef(tenantId);
    return adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = (snap.data() ?? { categories: {}, items: {} }) as { categories: Record<string, MenuCategory>; items: Record<string, MenuItem> };
      const categories: Record<string, MenuCategory> = mode === "replace" ? {} : { ...current.categories };
      const items: Record<string, MenuItem> = mode === "replace" ? {} : { ...current.items };

      let catOrder = Math.max(-1, ...Object.values(categories).map((c) => c.order)) + 1;
      const catId = new Map<string, string>();
      for (const name of parsed.categories) {
        const existing = Object.entries(categories).find(([, c]) => sameCategory(c.name, name));
        if (existing) catId.set(name.toLowerCase(), existing[0]);
        else {
          const id = newId("c", 8);
          categories[id] = { name, order: catOrder++, visible: true };
          catId.set(name.toLowerCase(), id);
        }
      }
      const findCat = (name: string) => catId.get(name.toLowerCase()) ?? catId.get(parsed.categories.find((c) => sameCategory(c, name))!.toLowerCase())!;

      const orderIn = (cid: string) => Math.max(-1, ...Object.values(items).filter((i) => i.categoryId === cid).map((i) => i.order)) + 1;
      for (const it of parsed.items) {
        const cid = findCat(it.category);
        items[newId("i", 8)] = {
          categoryId: cid,
          name: it.name,
          description: it.description,
          priceCents: it.priceCents,
          variants: it.variants,
          tags: it.tags,
          imageId: null,
          available: it.available,
          featured: it.featured,
          order: orderIn(cid),
        };
      }
      if (Object.keys(categories).length > LIMITS.categories) throw new ActionError(`Con este archivo la carta tendría más de ${LIMITS.categories} categorías.`);
      if (Object.values(items).filter((i) => i.featured).length > LIMITS.featured) {
        throw new ActionError(`Con este archivo la carta tendría más de ${LIMITS.featured} recomendados de la casa.`);
      }
      if (Object.keys(items).length > LIMITS.items) throw new ActionError(`Con este archivo la carta tendría más de ${LIMITS.items} productos.`);

      tx.set(ref, { categories, items, itemCount: Object.keys(items).length, updatedAt: nowTs(), updatedBy: uid });
      return { categories: Object.keys(categories).length, items: Object.keys(items).length, imported: parsed.items.length };
    });

}
