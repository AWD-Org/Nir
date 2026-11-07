import { z } from "zod";
import { LIMITS, TAGS } from "./constants";
import { isGoogleReviewUrl } from "./publish";

const str = (max: number) => z.string().trim().max(max);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Usa un color #RRGGBB");

export const profileSchema = z.object({
  name: str(60).min(2, "Escribe el nombre del negocio"),
  phone: str(30),
  address: str(160),
  hours: str(160),
});

const handle = str(120).refine((v) => !/\s/.test(v), "Sin espacios");

export const linksSchema = z.object({
  googleReviewUrl: str(300).refine((v) => v === "" || isGoogleReviewUrl(v), {
    message: "Pega el enlace que da Google para pedir reseñas (g.page o google.com).",
  }),
  instagram: handle,
  facebook: handle,
  tiktok: handle,
  whatsapp: str(20).refine((v) => v === "" || /^\+?\d{10,15}$/.test(v.replace(/[\s-]/g, "")), {
    message: "Escribe el número con lada, por ejemplo 52 55 1234 5678.",
  }),
});

export const wifiSchema = z
  .object({ enabled: z.boolean(), ssid: str(32), password: str(63) })
  .refine((w) => !w.enabled || w.ssid.length > 0, { message: "Escribe el nombre de la red", path: ["ssid"] });

export const buttonsSchema = z
  .array(z.object({ key: z.enum(["menu", "reviews", "social", "wifi"]), enabled: z.boolean() }))
  .length(4)
  .refine((b) => new Set(b.map((x) => x.key)).size === 4);

export const themeSchema = z.object({
  templateId: z.enum(["noche", "mercado", "claro"]),
  primaryColor: hex,
  accentColor: hex,
  menuStyle: z.enum(["lista", "clasica", "cuadricula", "destacada"]).optional(),
});

export const variantSchema = z.object({
  name: str(30).min(1, "Nombre de la variante"),
  priceCents: z.number().int().min(0).max(100_000_000),
});

const tagIds = TAGS.map((t) => t.id) as [string, ...string[]];

export const itemSchema = z.object({
  categoryId: z.string().min(1),
  name: str(80).min(1, "Escribe el nombre del producto"),
  description: str(280),
  priceCents: z.number().int().min(0).max(100_000_000),
  variants: z.array(variantSchema).max(LIMITS.variants),
  tags: z.array(z.enum(tagIds)).max(TAGS.length),
  imageId: z.string().nullable(),
  available: z.boolean(),
});

export const categorySchema = z.object({
  name: str(40).min(1, "Escribe el nombre de la categoría"),
  visible: z.boolean(),
});

export const paymentSchema = z.object({
  concept: z.enum(["setup", "monthly", "annual", "cards"]),
  amountCents: z.number().int().min(0).max(100_000_000),
  method: z.enum(["transfer", "stripe_link"]),
  reference: str(80),
  paidAt: z.string().min(8),
});

export type ItemInput = z.infer<typeof itemSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type LinksInput = z.infer<typeof linksSchema>;

export function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Revisa los datos.";
}
