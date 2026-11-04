import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc, terminate, updateDoc, type Firestore } from "firebase/firestore";

// RNF11: ningún negocio lee ni escribe datos de otro. Corre con: npm run test:rules
// Usa el SDK modular contra el emulador con tokens simulados (mockUserToken).
const PROJECT = "demo-nir-rules";
const HOST = "127.0.0.1";
const PORT = 8080;
const BASE = `http://${HOST}:${PORT}/emulator/v1/projects/${PROJECT}`;
const apps: FirebaseApp[] = [];
const dbs: Firestore[] = [];

function client(token?: Record<string, unknown> & { sub: string }): Firestore {
  const app = initializeApp({ projectId: PROJECT, apiKey: "demo" }, `app-${apps.length}-${Math.random()}`);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, HOST, PORT, token ? { mockUserToken: { user_id: token.sub, ...token } } : undefined);
  apps.push(app);
  dbs.push(db);
  return db;
}

// "owner" es el SDK sin reglas: el emulador acepta "Authorization: Bearer owner".
async function adminWrite(path: string, data: Record<string, unknown>) {
  const res = await fetch(`http://${HOST}:${PORT}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", Authorization: "Bearer owner" },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) throw new Error(`seed ${path}: ${res.status} ${await res.text()}`);
}

function toValue(v: unknown): Record<string, unknown> {
  if (v === null) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  return { mapValue: { fields: toFields(v as Record<string, unknown>) } };
}
const toFields = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, toValue(v)]));

async function assertSucceeds(p: Promise<unknown>) {
  await p; // lanza permission-denied si la regla lo bloquea
}
async function assertFails(p: Promise<unknown>) {
  await expect(p).rejects.toMatchObject({ code: "permission-denied" });
}

beforeAll(async () => {
  const res = await fetch(`${BASE}:securityRules`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ rules: { files: [{ name: "firestore.rules", content: readFileSync("firestore.rules", "utf8") }] } }),
  });
  if (!res.ok) throw new Error(`No se cargaron las reglas: ${await res.text()}`);
});

afterAll(async () => {
  await Promise.all(dbs.map((d) => terminate(d).catch(() => {})));
  await Promise.all(apps.map((a) => deleteApp(a).catch(() => {})));
});

beforeEach(async () => {
  await fetch(`${BASE}/databases/(default)/documents`, { method: "DELETE" });
  for (const [t, owner, status] of [["tA", "uA", "active"], ["tB", "uB", "active"], ["tS", "uS", "suspended"]]) {
    await adminWrite(`tenants/${t}`, { name: t, ownerUid: owner, status, profile: { phone: "" }, billing: { cycle: "monthly" } });
    await adminWrite(`tenants/${t}/menu/draft`, { categories: {}, items: {}, itemCount: 0 });
    await adminWrite(`tenants/${t}/public/page`, { name: t });
    await adminWrite(`users/${owner}`, { email: `${owner}@x.mx`, role: "owner", tenantId: t });
    await adminWrite(`owners/${owner}`, { tenantId: t });
  }
  await adminWrite("cards/tA_1-abcd", { tenantId: "tA", table: 1, status: "delivered" });
  await adminWrite("payments/p1", { tenantId: "tA", amountCents: 100 });
  await adminWrite("stats/tA_20261103", { tenantId: "tA", visits: 3 });
  await adminWrite("images/img1", { tenantId: "tA" });
  await adminWrite("slugs/a", { tenantId: "tA", current: true });
  await adminWrite("auditLog/e1", { tenantId: "tA" });
});

const owner = (uid: string, tenantId: string) => client({ sub: uid, role: "owner", tenantId });
const staff = () => client({ sub: "staff1", role: "seller" });
const anon = () => client();

describe("aislamiento entre negocios", () => {
  it("el dueño lee su negocio, su carta y su página", async () => {
    const db = owner("uA", "tA");
    await assertSucceeds(getDoc(doc(db, "tenants/tA")));
    await assertSucceeds(getDoc(doc(db, "tenants/tA/menu/draft")));
    await assertSucceeds(getDoc(doc(db, "tenants/tA/public/page")));
    await assertSucceeds(getDoc(doc(db, "cards/tA_1-abcd")));
    await assertSucceeds(getDoc(doc(db, "payments/p1")));
    await assertSucceeds(getDoc(doc(db, "stats/tA_20261103")));
  });
  it("el dueño no lee nada de otro negocio", async () => {
    const db = owner("uB", "tB");
    await assertFails(getDoc(doc(db, "tenants/tA")));
    await assertFails(getDoc(doc(db, "tenants/tA/menu/draft")));
    await assertFails(getDoc(doc(db, "tenants/tA/public/page")));
    await assertFails(getDoc(doc(db, "cards/tA_1-abcd")));
    await assertFails(getDoc(doc(db, "payments/p1")));
    await assertFails(getDoc(doc(db, "stats/tA_20261103")));
    await assertFails(getDoc(doc(db, "users/uA")));
  });
  it("el dueño no escribe en otro negocio", async () => {
    const db = owner("uB", "tB");
    await assertFails(updateDoc(doc(db, "tenants/tA"), { profile: { phone: "x" } }));
    await assertFails(setDoc(doc(db, "tenants/tA/menu/draft"), { categories: {}, items: {}, itemCount: 0 }));
  });
  it("un visitante sin sesión no lee nada", async () => {
    const db = anon();
    await assertFails(getDoc(doc(db, "tenants/tA")));
    await assertFails(getDoc(doc(db, "tenants/tA/public/page")));
    await assertFails(getDoc(doc(db, "images/img1")));
    await assertFails(getDoc(doc(db, "slugs/a")));
  });
});

describe("campos protegidos", () => {
  it("el dueño edita sus datos, enlaces y diseño", async () => {
    await assertSucceeds(updateDoc(doc(owner("uA", "tA"), "tenants/tA"), { profile: { phone: "55" } }));
  });
  it("el dueño no cambia estado, cobro ni slug", async () => {
    const db = owner("uA", "tA");
    await assertFails(updateDoc(doc(db, "tenants/tA"), { status: "suspended" }));
    await assertFails(updateDoc(doc(db, "tenants/tA"), { billing: { cycle: "annual" } }));
    await assertFails(updateDoc(doc(db, "tenants/tA"), { slug: "otro" }));
  });
  it("el dueño no cambia su rol ni su negocio", async () => {
    const db = owner("uA", "tA");
    await assertFails(updateDoc(doc(db, "users/uA"), { tenantId: "tB" }));
    await assertFails(updateDoc(doc(db, "users/uA"), { role: "superadmin" }));
    await assertSucceeds(updateDoc(doc(db, "users/uA"), { displayName: "Nuevo" }));
  });
  it("una cuenta no puede crear un segundo negocio ni una segunda carta", async () => {
    const db = owner("uA", "tA");
    await assertFails(setDoc(doc(db, "tenants/tNuevo"), { name: "Otro", ownerUid: "uA" }));
    await assertFails(setDoc(doc(db, "owners/uA"), { tenantId: "tNuevo" }));
    await assertFails(setDoc(doc(db, "tenants/tA/menu/segunda"), { categories: {}, items: {}, itemCount: 0 }));
  });
  it("la carta no pasa de 300 productos", async () => {
    const db = owner("uA", "tA");
    await assertSucceeds(setDoc(doc(db, "tenants/tA/menu/draft"), { categories: {}, items: {}, itemCount: 300 }));
    await assertFails(setDoc(doc(db, "tenants/tA/menu/draft"), { categories: {}, items: {}, itemCount: 301 }));
  });
  it("una cuenta suspendida queda en solo lectura", async () => {
    const db = owner("uS", "tS");
    await assertSucceeds(getDoc(doc(db, "tenants/tS")));
    await assertFails(updateDoc(doc(db, "tenants/tS"), { profile: { phone: "x" } }));
    await assertFails(setDoc(doc(db, "tenants/tS/menu/draft"), { categories: {}, items: {}, itemCount: 0 }));
  });
  it("el dueño no escribe tarjetas, pagos, imágenes ni estadísticas", async () => {
    const db = owner("uA", "tA");
    await assertFails(setDoc(doc(db, "cards/tA_2-zzzz"), { tenantId: "tA" }));
    await assertFails(setDoc(doc(db, "payments/p2"), { tenantId: "tA" }));
    await assertFails(setDoc(doc(db, "images/img2"), { tenantId: "tA" }));
    await assertFails(setDoc(doc(db, "stats/tA_20261104"), { tenantId: "tA" }));
  });
});

describe("equipo de AMOXTLI®", () => {
  it("lee y edita cualquier negocio, tarjetas y pagos", async () => {
    const db = staff();
    await assertSucceeds(getDoc(doc(db, "tenants/tB")));
    await assertSucceeds(updateDoc(doc(db, "tenants/tB"), { status: "suspended" }));
    await assertSucceeds(setDoc(doc(db, "cards/tB_1-wxyz"), { tenantId: "tB" }));
    await assertSucceeds(setDoc(doc(db, "payments/p9"), { tenantId: "tB" }));
    await assertSucceeds(getDoc(doc(db, "auditLog/e1")));
  });
  it("no escribe en la auditoría desde el navegador", async () => {
    await assertFails(setDoc(doc(staff(), "auditLog/e2"), { tenantId: "tB" }));
  });
});
