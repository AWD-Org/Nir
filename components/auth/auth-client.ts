"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "No hay una cuenta con ese correo.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Inicia sesión.",
  "auth/weak-password": "Usa una contraseña de al menos 8 caracteres.",
  "auth/invalid-email": "Revisa el correo.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.",
  "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar.",
  "auth/popup-blocked": "Tu navegador bloqueó la ventana de Google. Permite ventanas emergentes e intenta de nuevo.",
  "auth/network-request-failed": "Sin conexión. Revisa tu internet.",
  "auth/account-exists-with-different-credential": "Ese correo ya tiene cuenta. Entra con correo y contraseña.",
};

export function authMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  return MESSAGES[code] ?? (e instanceof Error && e.message.startsWith("Nir:") ? e.message.slice(4) : "No pudimos completar el acceso. Intenta de nuevo.");
}

/** Intercambia el ID token por la cookie de sesión del servidor. */
export async function startSession(user: User, opts: { acceptTerms?: boolean; displayName?: string; force?: boolean; retried?: boolean } = {}) {
  const idToken = await user.getIdToken(opts.force ?? true);
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken, acceptTerms: opts.acceptTerms, displayName: opts.displayName }),
  });
  const data = (await res.json()) as { next?: string; error?: string; refresh?: boolean };
  if (!res.ok) throw new Error(`Nir:${data.error ?? "No pudimos iniciar tu sesión."}`);
  if (data.refresh && !opts.retried) return startSession(user, { ...opts, force: true, retried: true });
  return data.next ?? "/admin";
}

export async function loginEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(clientAuth(), email.trim(), password);
  return startSession(cred.user);
}

export async function registerEmail(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(clientAuth(), email.trim(), password);
  if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
  return startSession(cred.user, { acceptTerms: true, displayName: name });
}

export async function loginGoogle(acceptTerms: boolean) {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(clientAuth(), provider);
  return startSession(cred.user, { acceptTerms });
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(clientAuth(), email.trim(), { url: `${location.origin}/entrar` });
}

/** Renueva la sesión después de que el servidor cambió los permisos (por ejemplo, al crear el negocio). */
export async function refreshSession() {
  const user = clientAuth().currentUser;
  if (!user) return false;
  await startSession(user, { force: true });
  return true;
}

export async function logout() {
  await fetch("/api/session", { method: "DELETE" });
  await signOut(clientAuth()).catch(() => {});
}
