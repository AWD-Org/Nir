import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

// RNF11: ningún negocio lee ni escribe datos de otro. Corre con: npm run test:rules
let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-nir-rules",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
afterAll(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [t, owner, status] of [["tA", "uA", "active"], ["tB", "uB", "active"], ["tS", "uS", "suspended"]]) {
      await setDoc(doc(db, `tenants/${t}`), { name: t, ownerUid: owner, status, profile: { phone: "" }, billing: { cycle: "monthly" } });
      await setDoc(doc(db, `tenants/${t}/menu/draft`), { categories: {}, items: {}, itemCount: 0 });
      await setDoc(doc(db, `tenants/${t}/public/page`), { name: t });
      await setDoc(doc(db, `users/${owner}`), { email: `${owner}@x.mx`, role: "owner", tenantId: t });
      await setDoc(doc(db, `owners/${owner}`), { tenantId: t });
    }
    await setDoc(doc(db, "cards/tA_1-abcd"), { tenantId: "tA", table: 1, status: "delivered" });
    await setDoc(doc(db, "payments/p1"), { tenantId: "tA", amountCents: 100 });
    await setDoc(doc(db, "stats/tA_20261103"), { tenantId: "tA", visits: 3 });
    await setDoc(doc(db, "images/img1"), { tenantId: "tA" });
    await setDoc(doc(db, "slugs/a"), { tenantId: "tA", current: true });
    await setDoc(doc(db, "auditLog/e1"), { tenantId: "tA" });
  });
});

const owner = (uid: string, tenantId: string) => env.authenticatedContext(uid, { role: "owner", tenantId }).firestore();
const staff = () => env.authenticatedContext("staff1", { role: "seller" }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

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
    await assertFails(updateDoc(doc(db, "tenants/tA"), { status: "active" }));
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
