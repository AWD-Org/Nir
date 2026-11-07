// Tipos del dominio de Nir. Las fechas se manejan como ISO 8601 (string) fuera de
// Firestore; lib/server/db.ts convierte Timestamps <-> ISO al leer y escribir.

export type Role = "owner" | "seller" | "superadmin";
export type TenantStatus = "preview" | "active" | "due" | "grace" | "suspended" | "cancelled";
export type ButtonKey = "menu" | "reviews" | "social" | "wifi";
export type SocialKey = "instagram" | "facebook" | "tiktok" | "whatsapp";
export type TemplateId = "noche" | "mercado" | "claro";
/** Cómo se acomodan los productos en la carta (independiente de la plantilla de colores). */
export type MenuStyle = "lista" | "clasica" | "cuadricula";
export type CardStatus = "produced" | "delivered" | "disabled";
export type PaymentConcept = "setup" | "monthly" | "annual" | "cards";
export type PaymentMethod = "transfer" | "stripe_link";
export type Source = "nfc" | "qr" | "link";

export interface UserDoc {
  email: string;
  displayName: string;
  providers: string[];
  role: Role;
  tenantId: string | null;
  termsVersion?: string;
  termsAcceptedAt?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface TenantProfile {
  phone: string;
  address: string;
  hours: string;
  logoImageId: string | null;
  coverImageId: string | null;
}

export interface TenantLinks {
  googleReviewUrl: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  whatsapp: string;
}

export interface TenantWifi {
  enabled: boolean;
  ssid: string;
  password: string;
}

export interface ButtonConfig {
  key: ButtonKey;
  enabled: boolean;
}

export interface TenantTheme {
  templateId: TemplateId;
  primaryColor: string;
  accentColor: string;
  /** Opcional: las cuentas creadas antes de los estilos usan "lista". */
  menuStyle?: MenuStyle;
}

export interface TableConfig {
  number: number;
  label: string;
}

export interface TenantBilling {
  cycle: "monthly" | "annual";
  setupPaidAt: string | null;
  cardsDeliveredAt: string | null;
  nextPaymentAt: string | null;
  paidUntil: string | null;
  includedCards: number;
  /** Meses pagados antes de entregar tarjetas; se aplican al registrar la entrega. */
  prepaidMonths: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerUid: string;
  status: TenantStatus;
  profile: TenantProfile;
  links: TenantLinks;
  wifi: TenantWifi;
  buttons: ButtonConfig[];
  theme: TenantTheme;
  tables: TableConfig[];
  billing: TenantBilling;
  activatedAt: string | null;
  activatedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  name: string;
  priceCents: number;
}

export interface MenuCategory {
  name: string;
  order: number;
  visible: boolean;
}

export interface MenuItem {
  categoryId: string;
  name: string;
  description: string;
  priceCents: number;
  variants: Variant[];
  tags: string[];
  imageId: string | null;
  available: boolean;
  /** Favorito de la casa (opcional en cartas anteriores). */
  featured?: boolean;
  order: number;
}

export interface MenuDraft {
  categories: Record<string, MenuCategory>;
  items: Record<string, MenuItem>;
  itemCount: number;
  updatedAt: string;
  updatedBy: string;
}

export interface PublicItem {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  variants: Variant[];
  tags: string[];
  imageId: string | null;
  available: boolean;
  featured?: boolean;
}

export interface PublicCategory {
  id: string;
  name: string;
  items: PublicItem[];
}

export interface PublicPage {
  tenantId: string;
  slug: string;
  status: TenantStatus;
  name: string;
  logoImageId: string | null;
  coverImageId: string | null;
  theme: TenantTheme;
  buttons: ButtonKey[];
  reviews: { url: string } | null;
  social: Partial<Record<SocialKey, string>>;
  wifi: { ssid: string; password: string } | null;
  profile: { phone: string; address: string; hours: string };
  menu: { categories: PublicCategory[] };
  publishedAt: string;
}

export interface Card {
  id: string;
  tenantId: string;
  slug: string;
  table: number;
  suffix: string;
  url: string;
  status: CardStatus;
  producedAt: string;
  deliveredAt: string | null;
  disabledAt: string | null;
  replacedBy: string | null;
  writtenAt?: string | null;
}

export interface Payment {
  id: string;
  tenantId: string;
  concept: PaymentConcept;
  amountCents: number;
  currency: "MXN";
  method: PaymentMethod;
  reference: string;
  paidAt: string;
  coversFrom: string | null;
  coversUntil: string | null;
  recordedBy: string;
  createdAt: string;
}

export interface DayStats {
  tenantId: string;
  date: string; // AAAAMMDD
  visits: number;
  byHour: Record<string, number>;
  byTable: Record<string, number>;
  bySource: Partial<Record<Source, number>>;
  clicks: Partial<Record<ButtonKey, number>>;
  social: Partial<Record<SocialKey, number>>;
}

export interface AuditEntry {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: Role;
  tenantId: string | null;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  at: string;
}
