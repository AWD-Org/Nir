import type { ButtonConfig, ButtonKey, SocialKey, TenantStatus } from "./types";

export const LIMITS = {
  items: 300,
  /** Recomendados de la casa (etiqueta discreta junto al nombre). */
  featured: 8,
  categories: 30,
  tables: 100,
  variants: 6,
  fullImageBytes: 150 * 1024,
  thumbImageBytes: 40 * 1024,
  fullImagePx: 1080,
  thumbImagePx: 400,
} as const;

export const TERMS_VERSION = "2026-11";
export const TIMEZONE = "America/Mexico_City";

export const DEFAULT_BUTTONS: ButtonConfig[] = [
  { key: "menu", enabled: true },
  { key: "reviews", enabled: true },
  { key: "social", enabled: true },
  { key: "wifi", enabled: false },
];

export const BUTTON_LABELS: Record<ButtonKey, string> = {
  menu: "Carta",
  reviews: "Déjanos tu reseña",
  social: "Redes sociales",
  wifi: "Wi-Fi",
};

export const SOCIAL_LABELS: Record<SocialKey, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
};

export const SUGGESTED_CATEGORIES = [
  "Entradas",
  "Platos fuertes",
  "Tacos",
  "Postres",
  "Bebidas",
  "Cocteles",
  "Cervezas",
  "Mezcales",
  "Café",
  "Sin alcohol",
];

export const TAGS: { id: string; label: string }[] = [
  { id: "picante", label: "Picante" },
  { id: "vegetariano", label: "Vegetariano" },
  { id: "vegano", label: "Vegano" },
  { id: "sin-gluten", label: "Sin gluten" },
  { id: "nuevo", label: "Nuevo" },
];

export const STATUS_LABELS: Record<TenantStatus, string> = {
  preview: "Vista previa",
  active: "Activa",
  due: "Por vencer",
  grace: "En gracia",
  suspended: "Suspendida",
  cancelled: "Cancelada",
};

/** Estados en los que la página pública se muestra. */
export const PUBLIC_STATUSES: TenantStatus[] = ["active", "due", "grace"];
/** Estados en los que el dueño puede editar. */
export const EDITABLE_STATUSES: TenantStatus[] = ["preview", "active", "due", "grace"];

export const isPublic = (s: TenantStatus) => PUBLIC_STATUSES.includes(s);
export const isEditable = (s: TenantStatus) => EDITABLE_STATUSES.includes(s);
