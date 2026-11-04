/** Rutas de la app que no pueden usarse como slug de un negocio. */
export const RESERVED_SLUGS = new Set([
  "admin", "console", "api", "img", "entrar", "registro", "recuperar", "salir",
  "no-disponible", "terminos", "privacidad", "guia", "ayuda", "precios", "kit",
  "nir", "amoxtli", "www", "app", "static", "_next", "robots.txt", "sitemap.xml",
  "manifest.webmanifest", "favicon.ico", "opengraph-image", "twitter-image", "icon",
]);

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export function validateSlug(slug: string): string | null {
  if (slug.length < 3) return "Usa al menos 3 caracteres.";
  if (slug.length > 40) return "Usa máximo 40 caracteres.";
  if (!SLUG_RE.test(slug) || slug.includes("--")) {
    return "Solo letras minúsculas, números y guiones; sin guion al inicio o al final.";
  }
  if (RESERVED_SLUGS.has(slug)) return "Ese nombre está reservado. Prueba con otro.";
  return null;
}
