import type { ButtonKey, MenuDraft, PublicPage, SocialKey, Tenant } from "./types";

const SOCIALS: SocialKey[] = ["instagram", "facebook", "tiktok", "whatsapp"];

/**
 * Arma el documento público (tenants/{id}/public/page) a partir del negocio y la carta.
 * Solo incluye botones activos que tienen contenido, categorías visibles con productos y
 * el orden ya resuelto, para que la página solo pinte.
 */
export function buildPublicPage(t: Tenant, draft: MenuDraft, now = new Date()): PublicPage {
  const categories = Object.entries(draft.categories)
    .filter(([, c]) => c.visible)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([id, c]) => ({
      id,
      name: c.name,
      items: Object.entries(draft.items)
        .filter(([, i]) => i.categoryId === id)
        .sort(([, a], [, b]) => a.order - b.order)
        .map(([iid, i]) => ({
          id: iid,
          name: i.name,
          description: i.description,
          priceCents: i.priceCents,
          variants: i.variants,
          tags: i.tags,
          imageId: i.imageId,
          available: i.available,
          featured: !!i.featured,
        })),
    }))
    .filter((c) => c.items.length > 0);

  const social: Partial<Record<SocialKey, string>> = {};
  for (const k of SOCIALS) {
    const v = t.links[k]?.trim();
    if (v) social[k] = v;
  }

  const hasContent: Record<ButtonKey, boolean> = {
    menu: categories.length > 0,
    reviews: !!t.links.googleReviewUrl.trim(),
    social: Object.keys(social).length > 0,
    wifi: t.wifi.enabled && !!t.wifi.ssid.trim(),
  };

  const buttons = t.buttons.filter((b) => b.enabled && hasContent[b.key]).map((b) => b.key);

  return {
    tenantId: t.id,
    slug: t.slug,
    status: t.status,
    name: t.name,
    logoImageId: t.profile.logoImageId,
    coverImageId: t.profile.coverImageId,
    theme: t.theme,
    buttons,
    reviews: buttons.includes("reviews") ? { url: t.links.googleReviewUrl.trim() } : null,
    social: buttons.includes("social") ? social : {},
    wifi: buttons.includes("wifi") ? { ssid: t.wifi.ssid.trim(), password: t.wifi.password } : null,
    profile: { phone: t.profile.phone, address: t.profile.address, hours: t.profile.hours },
    menu: { categories: buttons.includes("menu") ? categories : [] },
    publishedAt: now.toISOString(),
  };
}

/** Enlaces de cada red a partir de lo que guarda el dueño (usuario o URL). */
export function socialHref(key: SocialKey, value: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  switch (key) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "facebook":
      return `https://facebook.com/${handle}`;
    case "tiktok":
      return `https://www.tiktok.com/@${handle}`;
    case "whatsapp":
      return `https://wa.me/${handle.replace(/\D/g, "")}`;
  }
}

/** RF16: el enlace de reseñas debe ser de Google. */
export function isGoogleReviewUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    return (
      h === "g.page" ||
      h === "search.google.com" ||
      h === "maps.app.goo.gl" ||
      h === "goo.gl" ||
      h === "g.co" ||
      /(^|\.)google\.[a-z.]+$/.test(h)
    );
  } catch {
    return false;
  }
}
