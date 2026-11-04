/**
 * Datos de prueba para el emulador local (nunca en producción).
 *   npm run emulators   (en otra terminal)
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npm run seed
 * Crea: superadmin@nir.test / vendedor@nir.test / dueno@nir.test (contraseña: nir-prueba-2026)
 * y el negocio ficticio "Bar de Prueba" activo con carta y 6 tarjetas.
 */
import { Timestamp } from "firebase-admin/firestore";
import { admin } from "./_admin.mts";
import { buildPublicPage } from "../lib/domain/publish.ts";
import type { MenuDraft, Tenant } from "../lib/domain/types.ts";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("Este script solo corre contra el emulador (FIRESTORE_EMULATOR_HOST).");
  process.exit(1);
}

const PASSWORD = "nir-prueba-2026";
const { auth, db } = admin();
const now = Timestamp.now();

async function user(email: string, displayName: string, claims: Record<string, unknown>) {
  const u = await auth.getUserByEmail(email).catch(() => auth.createUser({ email, password: PASSWORD, displayName, emailVerified: true }));
  await auth.setCustomUserClaims(u.uid, claims);
  return u;
}

const sa = await user("superadmin@nir.test", "Superadmin", { role: "superadmin" });
const se = await user("vendedor@nir.test", "Vendedor", { role: "seller" });
const tenantId = "t_demo000001";
const ow = await user("dueno@nir.test", "Dueño de prueba", { role: "owner", tenantId });

for (const [u, role, tid] of [[sa, "superadmin", null], [se, "seller", null], [ow, "owner", tenantId]] as const) {
  await db.collection("users").doc(u.uid).set({ email: u.email, displayName: u.displayName, providers: ["password"], role, tenantId: tid, termsVersion: "2026-11", termsAcceptedAt: now, createdAt: now, lastLoginAt: now });
}

const slug = "bar-de-prueba";
const delivered = new Date();
delivered.setDate(delivered.getDate() - 10);
const paidUntil = new Date(delivered);
paidUntil.setMonth(paidUntil.getMonth() + 1);

await db.collection("tenants").doc(tenantId).set({
  name: "Bar de Prueba",
  slug,
  ownerUid: ow.uid,
  status: "active",
  profile: { phone: "55 0000 0000", address: "Dirección de prueba, CDMX", hours: "Mar a dom, 14:00 a 02:00", logoImageId: null, coverImageId: null },
  links: { googleReviewUrl: "https://g.page/r/prueba/review", instagram: "bardeprueba", facebook: "", tiktok: "", whatsapp: "5215500000000" },
  wifi: { enabled: true, ssid: "Prueba_Clientes", password: "clave-prueba" },
  buttons: [{ key: "menu", enabled: true }, { key: "reviews", enabled: true }, { key: "social", enabled: true }, { key: "wifi", enabled: true }],
  theme: { templateId: "noche", primaryColor: "#14161A", accentColor: "#E8B83A" },
  tables: Array.from({ length: 6 }, (_, i) => ({ number: i + 1, label: `Mesa ${i + 1}` })),
  billing: { cycle: "monthly", setupPaidAt: Timestamp.fromDate(delivered), cardsDeliveredAt: Timestamp.fromDate(delivered), nextPaymentAt: Timestamp.fromDate(paidUntil), paidUntil: Timestamp.fromDate(paidUntil), includedCards: 10, prepaidMonths: 0 },
  activatedAt: now,
  activatedBy: sa.uid,
  publishedAt: null,
  createdAt: now,
  updatedAt: now,
});
await db.collection("owners").doc(ow.uid).set({ tenantId, createdAt: now });
await db.collection("slugs").doc(slug).set({ tenantId, current: true, createdAt: now });

const categories = { c_bebidas: { name: "Bebidas", order: 0, visible: true }, c_botanas: { name: "Botanas", order: 1, visible: true } };
const items = {
  i_1: { categoryId: "c_bebidas", name: "Mezcal espadín", description: "Joven.", priceCents: 9000, variants: [{ name: "Copa", priceCents: 9000 }, { name: "Botella", priceCents: 120000 }], tags: [], imageId: null, available: true, order: 0 },
  i_2: { categoryId: "c_bebidas", name: "Cerveza de barril", description: "", priceCents: 6500, variants: [], tags: [], imageId: null, available: true, order: 1 },
  i_3: { categoryId: "c_botanas", name: "Guacamole", description: "Con totopos.", priceCents: 9500, variants: [], tags: ["vegetariano"], imageId: null, available: true, order: 0 },
  i_4: { categoryId: "c_botanas", name: "Tostadas de tinga", description: "", priceCents: 11000, variants: [], tags: ["picante"], imageId: null, available: false, order: 1 },
};
await db.collection("tenants").doc(tenantId).collection("menu").doc("draft").set({ categories, items, itemCount: 4, updatedAt: now, updatedBy: ow.uid });

const suffixes = ["k7m2", "p3qa", "x9bd", "h4tr", "w2ne", "c8fz"];
for (let i = 0; i < 6; i++) {
  const table = i + 1;
  await db.collection("cards").doc(`${tenantId}_${table}-${suffixes[i]}`).set({
    tenantId, slug, table, suffix: suffixes[i], url: `http://localhost:3000/${slug}/${table}-${suffixes[i]}`,
    status: "delivered", producedAt: now, deliveredAt: Timestamp.fromDate(delivered), disabledAt: null, replacedBy: null, writtenAt: null,
  });
}
const tSnap = await db.collection("tenants").doc(tenantId).get();
const page = buildPublicPage({ id: tenantId, ...tSnap.data() } as unknown as Tenant, { categories, items, itemCount: 4 } as unknown as MenuDraft);
await db.collection("tenants").doc(tenantId).collection("public").doc("page").set(page);
console.log(`Listo. Página: http://localhost:3000/${slug} · tarjeta mesa 1: http://localhost:3000/${slug}/1-${suffixes[0]}`);
console.log(`Usuarios: superadmin@nir.test, vendedor@nir.test, dueno@nir.test · contraseña ${PASSWORD}`);
