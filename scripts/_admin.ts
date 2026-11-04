import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/** Admin SDK para scripts: usa FIREBASE_SERVICE_ACCOUNT_BASE64 o los emuladores locales. */
export function admin() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const app = b64
    ? initializeApp({ credential: cert(JSON.parse(Buffer.from(b64, "base64").toString("utf8"))) })
    : initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-nir" });
  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });
  return { auth: getAuth(app), db };
}
