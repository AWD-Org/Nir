import type { PublicPage, TemplateId } from "@/lib/domain/types";
import { TEMPLATES } from "@/lib/themes";
import { SITE_URL } from "@/lib/domain/links";

/** Negocio de ejemplo para la landing. Es ficticio y se rotula como ejemplo. */
export function demoPage(templateId: TemplateId): PublicPage {
  return {
    tenantId: "demo",
    slug: "ejemplo",
    status: "active",
    name: "Cantina El Ejemplo",
    logoImageId: null,
    coverImageId: null,
    theme: { templateId, ...TEMPLATES[templateId].defaults },
    buttons: ["menu", "reviews", "social", "wifi"],
    reviews: { url: `${SITE_URL}/#como-funciona` },
    social: { instagram: "ejemplo", whatsapp: "5215500000000" },
    wifi: { ssid: "ElEjemplo_Clientes", password: "botana2026" },
    profile: { phone: "", address: "Negocio de ejemplo", hours: "Mar a dom, 13:00 a 01:00" },
    menu: {
      categories: [
        {
          id: "c1",
          name: "Botanas",
          items: [
            { id: "i1", name: "Guacamole con totopos", description: "Aguacate, chile serrano, cebolla y cilantro.", priceCents: 9500, variants: [], tags: ["vegetariano"], imageId: null, available: true },
            { id: "i2", name: "Chicharrón de queso", description: "", priceCents: 8500, variants: [], tags: [], imageId: null, available: true },
            { id: "i3", name: "Tostadas de tinga", description: "Tres piezas con crema y queso fresco.", priceCents: 11000, variants: [], tags: ["picante"], imageId: null, available: false },
          ],
        },
        {
          id: "c2",
          name: "Mezcales",
          items: [
            { id: "i4", name: "Espadín", description: "Joven, Oaxaca.", priceCents: 9000, variants: [{ name: "Copa", priceCents: 9000 }, { name: "Botella", priceCents: 120000 }], tags: [], imageId: null, available: true },
            { id: "i5", name: "Tobalá", description: "Silvestre.", priceCents: 16000, variants: [], tags: [], imageId: null, available: true },
          ],
        },
        {
          id: "c3",
          name: "Sin alcohol",
          items: [
            { id: "i6", name: "Agua de jamaica", description: "", priceCents: 4500, variants: [{ name: "Vaso", priceCents: 4500 }, { name: "Jarra", priceCents: 12000 }], tags: [], imageId: null, available: true },
          ],
        },
      ],
    },
    publishedAt: "2026-11-03T00:00:00.000Z",
  };
}
