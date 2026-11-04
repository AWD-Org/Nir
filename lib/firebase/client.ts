"use client";

import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-nir.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-nir",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "demo-app",
};

let auth: Auth | null = null;

/** Solo se usa Firebase Authentication en el navegador; los datos pasan por el servidor. */
export function clientAuth(): Auth {
  if (auth) return auth;
  const app = getApps()[0] ?? initializeApp(config);
  auth = getAuth(app);
  auth.languageCode = "es";
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  return auth;
}
