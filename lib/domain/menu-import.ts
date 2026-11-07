import { LIMITS, TAGS } from "./constants";
import { parsePrice } from "./money";

/**
 * Importador de cartas en CSV.
 * Columnas: categoria, producto, descripcion, precio, variantes, etiquetas, disponible
 * - variantes: "Copa:90|Botella:1200" (si hay variantes, precio puede ir vacío)
 * - etiquetas: "picante|vegetariano|vegano|sin-gluten|nuevo"
 * - disponible: "si" o "no" (vacío = si)
 */
export const IMPORT_COLUMNS = ["categoria", "producto", "descripcion", "precio", "variantes", "etiquetas", "disponible"] as const;

export interface ImportItem {
  category: string;
  name: string;
  description: string;
  priceCents: number;
  variants: { name: string; priceCents: number }[];
  tags: string[];
  available: boolean;
}

export interface ImportRowError {
  line: number;
  message: string;
}

export interface ImportResult {
  items: ImportItem[];
  errors: ImportRowError[];
  categories: string[];
}

/** CSV con comillas, comas y saltos de línea dentro de comillas. Detecta "," o ";" o tabulador. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const firstLine = src.split("\n", 1)[0] ?? "";
  const delimiter = [",", ";", "\t"].reduce((best, d) => (firstLine.split(d).length > firstLine.split(best).length ? d : best), ",");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

const HEADER_ALIASES: Record<string, (typeof IMPORT_COLUMNS)[number]> = {
  categoria: "categoria",
  category: "categoria",
  seccion: "categoria",
  producto: "producto",
  nombre: "producto",
  platillo: "producto",
  name: "producto",
  descripcion: "descripcion",
  description: "descripcion",
  precio: "precio",
  price: "precio",
  variantes: "variantes",
  variants: "variantes",
  etiquetas: "etiquetas",
  tags: "etiquetas",
  disponible: "disponible",
  available: "disponible",
};

const TAG_IDS = new Map(TAGS.flatMap((t) => [[norm(t.id), t.id], [norm(t.label), t.id]]));

/** Convierte el texto CSV en productos validados, con errores por línea (la 1 es el encabezado). */
export function parseMenuCsv(text: string): ImportResult {
  const rows = parseCsv(text);
  const errors: ImportRowError[] = [];
  const items: ImportItem[] = [];
  if (rows.length === 0) return { items, errors: [{ line: 1, message: "El archivo está vacío." }], categories: [] };

  const header = rows[0].map((h) => HEADER_ALIASES[norm(h).replace(/\s+/g, "")] ?? null);
  const col = (name: (typeof IMPORT_COLUMNS)[number]) => header.indexOf(name);
  if (col("categoria") < 0 || col("producto") < 0) {
    return { items, errors: [{ line: 1, message: "Faltan las columnas categoria y producto en el encabezado." }], categories: [] };
  }
  const get = (r: string[], name: (typeof IMPORT_COLUMNS)[number]) => (col(name) >= 0 ? (r[col(name)] ?? "").trim() : "");

  rows.slice(1).forEach((r, idx) => {
    const line = idx + 2;
    const category = get(r, "categoria").slice(0, 40);
    const name = get(r, "producto").slice(0, 80);
    if (!category && !name) return;
    if (!category) return errors.push({ line, message: `"${name}": falta la categoría.` });
    if (!name) return errors.push({ line, message: "Falta el nombre del producto." });

    const variants: ImportItem["variants"] = [];
    const rawVariants = get(r, "variantes");
    if (rawVariants) {
      for (const part of rawVariants.split("|").map((x) => x.trim()).filter(Boolean)) {
        const sep = part.lastIndexOf(":");
        const vName = sep > 0 ? part.slice(0, sep).trim() : "";
        const vPrice = sep > 0 ? parsePrice(part.slice(sep + 1)) : null;
        if (!vName || vPrice === null) {
          errors.push({ line, message: `"${name}": variante inválida "${part}". Usa Nombre:precio, por ejemplo Copa:90.` });
          return;
        }
        variants.push({ name: vName.slice(0, 30), priceCents: vPrice });
      }
      if (variants.length > LIMITS.variants) {
        errors.push({ line, message: `"${name}": máximo ${LIMITS.variants} variantes.` });
        return;
      }
    }

    const rawPrice = get(r, "precio");
    let priceCents: number | null = rawPrice ? parsePrice(rawPrice) : null;
    if (priceCents === null && variants.length) priceCents = variants[0].priceCents;
    if (priceCents === null) {
      errors.push({ line, message: `"${name}": precio inválido "${rawPrice}". Escribe solo el número, por ejemplo 85 o 85.50.` });
      return;
    }

    const tags: string[] = [];
    for (const t of get(r, "etiquetas").split(/[|,]/).map((x) => x.trim()).filter(Boolean)) {
      const id = TAG_IDS.get(norm(t));
      if (id && !tags.includes(id)) tags.push(id);
    }

    const disp = norm(get(r, "disponible"));
    const available = !["no", "0", "false", "agotado"].includes(disp);

    items.push({ category, name, description: get(r, "descripcion").slice(0, 280), priceCents, variants, tags, available });
  });

  const categories: string[] = [];
  for (const i of items) if (!categories.some((c) => norm(c) === norm(i.category))) categories.push(i.category);
  if (categories.length > LIMITS.categories) errors.push({ line: 1, message: `La carta tiene ${categories.length} categorías; el máximo es ${LIMITS.categories}.` });
  if (items.length > LIMITS.items) errors.push({ line: 1, message: `La carta tiene ${items.length} productos; el máximo es ${LIMITS.items}.` });
  return { items, errors, categories };
}

export const sameCategory = (a: string, b: string) => norm(a) === norm(b);

/** Plantilla descargable con ejemplos de cada caso. */
export const IMPORT_TEMPLATE = [
  IMPORT_COLUMNS.join(","),
  'Botanas,Guacamole con totopos,"Aguacate, chile serrano y cilantro",95,,vegetariano,si',
  "Botanas,Chicharrón de queso,,85,,,si",
  "Mezcales,Espadín,Joven de Oaxaca,,Copa:90|Botella:1200,,si",
  "Bebidas sin alcohol,Agua de jamaica,,,Vaso:45|Jarra:120,,si",
  "Postres,Pastel de elote,Con cajeta,70,,nuevo,no",
].join("\n");
