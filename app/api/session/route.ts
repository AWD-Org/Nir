import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { TERMS_VERSION } from "@/lib/domain/constants";
import type { Role } from "@/lib/domain/types";
import { col, nowTs } from "@/lib/server/db";
import { SESSION_COOKIE, SESSION_DAYS, VIEW_AS_COOKIE, getSession } from "@/lib/server/session";

/** Crea la cookie de sesión a partir del ID token de Firebase Auth y registra al usuario. */
export async function POST(req: Request) {
  let body: { idToken?: string; acceptTerms?: boolean; displayName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  if (!body.idToken) return NextResponse.json({ error: "Falta el token" }, { status: 400 });

  try {
    const auth = adminAuth();
    const decoded = await auth.verifyIdToken(body.idToken, true);
    if (Date.now() / 1000 - decoded.iat > 5 * 60) {
      return NextResponse.json({ error: "Vuelve a iniciar sesión." }, { status: 401 });
    }
    const record = await auth.getUser(decoded.uid);
    const role = ((decoded.role as Role | undefined) ?? "owner") as Role;

    const ref = col.users().doc(decoded.uid);
    const snap = await ref.get();
    const now = nowTs();
    const providers = record.providerData.map((p) => p.providerId);
    const displayName = body.displayName?.trim() || record.displayName || "";
    if (!snap.exists) {
      await ref.set({
        email: record.email ?? "",
        displayName,
        providers,
        role,
        tenantId: (decoded.tenantId as string | undefined) ?? null,
        createdAt: now,
        lastLoginAt: now,
        ...(body.acceptTerms ? { termsVersion: TERMS_VERSION, termsAcceptedAt: now } : {}),
      });
    } else {
      const data = snap.data()!;
      await ref.update({
        providers,
        lastLoginAt: now,
        ...(displayName && !data.displayName ? { displayName } : {}),
        ...(body.acceptTerms && !data.termsAcceptedAt ? { termsVersion: TERMS_VERSION, termsAcceptedAt: now } : {}),
      });
    }

    const expiresIn = SESSION_DAYS * 24 * 60 * 60 * 1000;
    const cookie = await auth.createSessionCookie(body.idToken, { expiresIn });
    const jar = await cookies();
    jar.set(SESSION_COOKIE, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000,
    });

    const tenantId = (decoded.tenantId as string | undefined) ?? (snap.exists ? (snap.data()!.tenantId as string | null) : null);
    const next = role === "seller" || role === "superadmin" ? "/console" : tenantId ? "/admin" : "/admin/bienvenida";
    return NextResponse.json({ next });
  } catch (e) {
    console.error("session", e);
    return NextResponse.json({ error: "No pudimos iniciar tu sesión. Intenta de nuevo." }, { status: 401 });
  }
}

/** Cierra la sesión y revoca los tokens. */
export async function DELETE() {
  const s = await getSession();
  if (s) await adminAuth().revokeRefreshTokens(s.uid).catch(() => {});
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(VIEW_AS_COOKIE);
  return NextResponse.json({ ok: true });
}
