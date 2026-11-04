/**
 * Respaldo de Firestore con el Admin SDK (RNF08). Lo ejecuta GitHub Actions a diario.
 *   npm run backup -- backups/2026-11-03.json [--with-images]
 * Las imágenes se respaldan solo con --with-images (una vez por semana) por su tamaño.
 * El archivo se cifra en el workflow antes de guardarse.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { Timestamp } from "firebase-admin/firestore";
import { admin } from "./_admin.mts";

const out = process.argv[2] ?? `backups/nir-${new Date().toISOString().slice(0, 10)}.json`;
const withImages = process.argv.includes("--with-images");
const { db } = admin();

function serialize(v: unknown): unknown {
  if (v instanceof Timestamp) return { __ts: v.toDate().toISOString() };
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) return { __bytes: Buffer.from(v).toString("base64") };
  if (Array.isArray(v)) return v.map(serialize);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, serialize(x)]));
  return v;
}

const dump: Record<string, Record<string, unknown>> = {};
const roots = ["users", "owners", "tenants", "slugs", "cards", "payments", "stats", "auditLog", "config", ...(withImages ? ["images"] : [])];
for (const name of roots) {
  const snap = await db.collection(name).get();
  dump[name] = {};
  for (const d of snap.docs) {
    dump[name][d.id] = serialize(d.data());
    if (name === "tenants") {
      for (const sub of ["menu", "public"]) {
        const s = await d.ref.collection(sub).get();
        s.docs.forEach((x) => (dump[name][`${d.id}/${sub}/${x.id}`] = serialize(x.data())));
      }
    }
  }
  console.log(`${name}: ${snap.size}`);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ exportedAt: new Date().toISOString(), withImages, data: dump }));
console.log(`Respaldo escrito en ${out}`);
