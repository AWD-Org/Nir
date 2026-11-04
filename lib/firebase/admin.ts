import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let db: Firestore | undefined;

function adminApp(): App {
  if (app) return app;
  if (getApps().length) return (app = getApps()[0]!);
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    const sa = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
  } else {
    // Emulador local o entorno con credenciales por defecto.
    app = initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-nir" });
  }
  return app;
}

export function adminDb(): Firestore {
  if (db) return db;
  db = getFirestore(adminApp());
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}

export const adminAuth = () => getAuth(adminApp());
