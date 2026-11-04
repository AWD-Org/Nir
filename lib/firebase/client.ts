"use client";

import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

// Configuración web de Firebase (proyecto nir-app-26fa6). Es pública por diseño: la protegen
// las reglas de Firestore y los dominios autorizados de Auth. Las variables de entorno la reemplazan.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAY7vTgFRiJZB7JXc40-UsQmEKZ2oKhG1o",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "nir-app-26fa6.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nir-app-26fa6",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:312128824882:web:817619b5f91c5b139f3e2b",
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
