import { describe, expect, it } from "vitest";
import { applyDelivery, applyPayment, emptyBilling } from "@/lib/domain/billing";
import { addMonths, dayKey, hourKey } from "@/lib/domain/dates";
import { formatPrice, parsePrice } from "@/lib/domain/money";
import { buildPublicPage, isGoogleReviewUrl, socialHref } from "@/lib/domain/publish";
import { slugify, validateSlug } from "@/lib/domain/slug";
import { nextAutoStatus, statusFor } from "@/lib/domain/status";
import type { MenuDraft, Tenant } from "@/lib/domain/types";
import { parseCardCode, randomSuffix } from "@/lib/cards/suffix";
import { themeIssues } from "@/lib/themes";

const d = (s: string) => new Date(s);

describe("slug", () => {
  it("convierte nombres con acentos y signos", () => {
    expect(slugify("La Penka del Haragán")).toBe("la-penka-del-haragan");
    expect(slugify("  Café & Pan  ")).toBe("cafe-y-pan");
  });
  it("valida longitud, formato y rutas reservadas", () => {
    expect(validateSlug("ab")).not.toBeNull();
    expect(validateSlug("admin")).not.toBeNull();
    expect(validateSlug("-mal")).not.toBeNull();
    expect(validateSlug("la-penka")).toBeNull();
  });
});

describe("precios", () => {
  it("lee precios escritos por el dueño", () => {
    expect(parsePrice("85")).toBe(8500);
    expect(parsePrice("$1,200.50")).toBe(120050);
    expect(parsePrice("abc")).toBeNull();
    expect(parsePrice("1.234")).toBeNull();
  });
  it("formatea en pesos", () => {
    expect(formatPrice(9000)).toContain("90");
  });
});

describe("fechas", () => {
  it("suma meses respetando fin de mes", () => {
    expect(addMonths(d("2026-01-31T18:00:00Z"), 1).toISOString().slice(0, 10)).toBe("2026-02-28");
  });
  it("usa la zona horaria de la Ciudad de México", () => {
    // 2026-11-04 03:00 UTC = 2026-11-03 21:00 en CDMX
    expect(dayKey(d("2026-11-04T03:00:00Z"))).toBe("20261103");
    expect(hourKey(d("2026-11-04T03:00:00Z"))).toBe("21");
  });
});

describe("estados (RN09)", () => {
  const paid = d("2026-12-01T18:00:00Z");
  it("recorre activa → por vencer → gracia → suspendida → cancelada", () => {
    expect(statusFor(paid, d("2026-11-20T18:00:00Z"))).toBe("active");
    expect(statusFor(paid, d("2026-11-28T18:00:00Z"))).toBe("due");
    expect(statusFor(paid, d("2026-12-05T18:00:00Z"))).toBe("grace");
    expect(statusFor(paid, d("2026-12-20T18:00:00Z"))).toBe("suspended");
    expect(statusFor(paid, d("2027-04-01T18:00:00Z"))).toBe("cancelled");
  });
  it("no mueve cuentas en vista previa ni sin vigencia", () => {
    expect(nextAutoStatus("preview", paid.toISOString())).toBeNull();
    expect(nextAutoStatus("active", null)).toBeNull();
  });
});

describe("cobro (RN07, RF40, RF41)", () => {
  it("el alta no da vigencia; la entrega fija el primer cobro a un mes", () => {
    const b1 = applyPayment(emptyBilling(), "preview", "setup", d("2026-11-03T18:00:00Z")).billing;
    expect(b1.setupPaidAt).toBeTruthy();
    expect(b1.paidUntil).toBeNull();
    const b2 = applyDelivery(b1, d("2026-11-05T18:00:00Z"));
    expect(b2.nextPaymentAt?.slice(0, 10)).toBe("2026-12-05");
  });
  it("la anualidad pagada en la visita 1 cubre 12 meses desde la entrega", () => {
    const b1 = applyPayment(emptyBilling(), "preview", "annual", d("2026-11-03T18:00:00Z")).billing;
    expect(b1.prepaidMonths).toBe(12);
    expect(b1.cycle).toBe("annual");
    const b2 = applyDelivery(b1, d("2026-11-05T18:00:00Z"));
    expect(b2.paidUntil?.slice(0, 10)).toBe("2027-11-05");
  });
  it("una mensualidad extiende la vigencia y reactiva una cuenta suspendida", () => {
    const base = applyDelivery(emptyBilling(), d("2026-09-01T18:00:00Z")); // vigente hasta 1 oct
    const e = applyPayment(base, "suspended", "monthly", d("2026-10-20T18:00:00Z"), d("2026-10-20T18:00:00Z"));
    expect(e.status).toBe("active");
    expect(e.coversFrom?.slice(0, 10)).toBe("2026-10-20");
    expect(e.billing.paidUntil?.slice(0, 10)).toBe("2026-11-20");
  });
  it("en gracia, la mensualidad cubre desde la fecha vencida", () => {
    const base = applyDelivery(emptyBilling(), d("2026-09-01T18:00:00Z"));
    const e = applyPayment(base, "grace", "monthly", d("2026-10-03T18:00:00Z"), d("2026-10-03T18:00:00Z"));
    expect(e.billing.paidUntil?.slice(0, 10)).toBe("2026-11-01");
    expect(e.status).toBe("active");
  });
});

describe("tarjetas", () => {
  it("genera sufijos de 4 caracteres sin caracteres ambiguos", () => {
    for (let i = 0; i < 200; i++) expect(randomSuffix()).toMatch(/^[a-hj-km-np-z2-9]{4}$/);
  });
  it("lee el código {mesa}-{sufijo}", () => {
    expect(parseCardCode("12-k7m2")).toEqual({ table: 12, suffix: "k7m2" });
    expect(parseCardCode("0-k7m2")).toBeNull();
    expect(parseCardCode("12k7m2")).toBeNull();
  });
});

describe("enlaces", () => {
  it("acepta solo enlaces de reseñas de Google (RF16)", () => {
    expect(isGoogleReviewUrl("https://g.page/r/abc/review")).toBe(true);
    expect(isGoogleReviewUrl("https://search.google.com/local/writereview?placeid=x")).toBe(true);
    expect(isGoogleReviewUrl("https://www.google.com.mx/maps/place/x")).toBe(true);
    expect(isGoogleReviewUrl("https://evil.com/google.com")).toBe(false);
    expect(isGoogleReviewUrl("http://g.page/r/abc")).toBe(false);
  });
  it("arma enlaces de redes desde el usuario", () => {
    expect(socialHref("instagram", "@lapenka")).toBe("https://instagram.com/lapenka");
    expect(socialHref("whatsapp", "52 55 1234 5678")).toBe("https://wa.me/525512345678");
  });
});

describe("plantillas (RF15)", () => {
  it("bloquea combinaciones sin contraste", () => {
    expect(themeIssues({ templateId: "claro", primaryColor: "#FFFF00", accentColor: "#C2410C" }).length).toBeGreaterThan(0);
    expect(themeIssues({ templateId: "noche", primaryColor: "#14161A", accentColor: "#1A1C20" }).length).toBeGreaterThan(0);
    expect(themeIssues({ templateId: "noche", primaryColor: "#14161A", accentColor: "#E8B83A" })).toEqual([]);
    expect(themeIssues({ templateId: "mercado", primaryColor: "#7A2E1F", accentColor: "#7A2E1F" })).toEqual([]);
  });
});

describe("página pública", () => {
  const tenant = {
    id: "t1", name: "Bar", slug: "bar", ownerUid: "u", status: "active",
    profile: { phone: "", address: "", hours: "", logoImageId: null, coverImageId: null },
    links: { googleReviewUrl: "", instagram: "bar", facebook: "", tiktok: "", whatsapp: "" },
    wifi: { enabled: false, ssid: "Red", password: "x" },
    buttons: [{ key: "wifi", enabled: true }, { key: "menu", enabled: true }, { key: "reviews", enabled: true }, { key: "social", enabled: true }],
    theme: { templateId: "claro", primaryColor: "#1F4D3A", accentColor: "#C2410C" },
  } as unknown as Tenant;
  const draft = {
    categories: { a: { name: "Oculta", order: 0, visible: false }, b: { name: "Bebidas", order: 1, visible: true }, c: { name: "Vacía", order: 2, visible: true } },
    items: {
      x: { categoryId: "a", name: "No sale", description: "", priceCents: 1, variants: [], tags: [], imageId: null, available: true, order: 0 },
      y: { categoryId: "b", name: "Segunda", description: "", priceCents: 1, variants: [], tags: [], imageId: null, available: true, order: 1 },
      z: { categoryId: "b", name: "Primera", description: "", priceCents: 1, variants: [], tags: [], imageId: null, available: false, order: 0 },
    },
    itemCount: 3,
  } as unknown as MenuDraft;

  it("solo publica botones activos con contenido, en su orden", () => {
    const p = buildPublicPage(tenant, draft);
    expect(p.buttons).toEqual(["menu", "social"]); // wifi apagado, sin enlace de reseñas
    expect(p.wifi).toBeNull();
    expect(p.reviews).toBeNull();
  });
  it("omite categorías ocultas o vacías y ordena productos", () => {
    const p = buildPublicPage(tenant, draft);
    expect(p.menu.categories.map((c) => c.name)).toEqual(["Bebidas"]);
    expect(p.menu.categories[0].items.map((i) => i.name)).toEqual(["Primera", "Segunda"]);
  });
});
