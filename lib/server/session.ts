import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminAuth } from "@/lib/firebase/admin";
import { isEditable } from "@/lib/domain/constants";
import type { Role, Tenant } from "@/lib/domain/types";
import { getTenant, getUser } from "./db";

export const SESSION_COOKIE = "__session";
export const VIEW_AS_COOKIE = "nir_view_as";
export const SESSION_DAYS = 7;

export interface Session {
  uid: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string | null;
}

export const isStaffRole = (r: Role) => r === "seller" || r === "superadmin";

/** Sesión verificada en el servidor (cookie de sesión de Firebase, revocable). */
export const getSession = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const d = await adminAuth().verifySessionCookie(raw, true);
    const role = (d.role as Role | undefined) ?? "owner";
    let tenantId = (d.tenantId as string | undefined) ?? null;
    if (!tenantId && role === "owner") {
      // La cookie se creó antes de que existiera el negocio: se lee del perfil (1 lectura).
      const u = await getUser(d.uid);
      tenantId = u?.tenantId ?? null;
    }
    return {
      uid: d.uid,
      email: d.email ?? "",
      name: (d.name as string | undefined) ?? d.email ?? "",
      role,
      tenantId,
    };
  } catch {
    return null;
  }
});

export async function requireSession(next = "/admin"): Promise<Session> {
  const s = await getSession();
  if (!s) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return s;
}

export async function requireStaff(): Promise<Session> {
  const s = await requireSession("/console");
  if (!isStaffRole(s.role)) redirect("/admin");
  return s;
}

export interface OwnerContext {
  session: Session;
  tenant: Tenant;
  /** Cuenta suspendida o cancelada: el admin queda en solo lectura (RN09). */
  readOnly: boolean;
  /** Personal de AMOXTLI® viendo la cuenta de un cliente (RF43). */
  viewingAs: boolean;
}

/** Negocio sobre el que actúa la sesión: el propio del dueño, o el que el staff está viendo. */
export async function resolveTenantId(s: Session): Promise<{ tenantId: string | null; viewingAs: boolean }> {
  if (isStaffRole(s.role)) {
    const jar = await cookies();
    const viewAs = jar.get(VIEW_AS_COOKIE)?.value ?? null;
    return { tenantId: viewAs, viewingAs: !!viewAs };
  }
  return { tenantId: s.tenantId, viewingAs: false };
}

/** Para páginas del admin: redirige si no hay sesión o negocio. */
export async function requireOwner(): Promise<OwnerContext> {
  const session = await requireSession("/admin");
  const { tenantId, viewingAs } = await resolveTenantId(session);
  if (!tenantId) redirect(isStaffRole(session.role) ? "/console" : "/admin/bienvenida");
  const tenant = await getTenant(tenantId);
  if (!tenant) redirect(isStaffRole(session.role) ? "/console" : "/admin/bienvenida");
  return { session, tenant, readOnly: !isEditable(tenant.status), viewingAs };
}

/** Para Server Actions: mismo contexto, pero lanza errores en lugar de redirigir. */
export async function ownerForAction(): Promise<OwnerContext> {
  const session = await getSession();
  if (!session) throw new ActionError("Tu sesión terminó. Vuelve a entrar.");
  const { tenantId, viewingAs } = await resolveTenantId(session);
  if (!tenantId) throw new ActionError("Primero crea tu negocio.");
  const tenant = await getTenant(tenantId);
  if (!tenant) throw new ActionError("No encontramos tu negocio.");
  const readOnly = !isEditable(tenant.status);
  if (readOnly && !viewingAs) {
    throw new ActionError("Tu cuenta está suspendida. Registra tu pago para volver a editar.");
  }
  return { session, tenant, readOnly, viewingAs };
}

export async function staffForAction(): Promise<Session> {
  const s = await getSession();
  if (!s || !isStaffRole(s.role)) throw new ActionError("Solo el equipo de AMOXTLI® puede hacer esto.");
  return s;
}

export class ActionError extends Error {}

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

/** Envuelve una Server Action para devolver errores legibles en lugar de excepciones. */
export async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ActionError) return { ok: false, error: e.message };
    // redirect() y notFound() de Next se propagan.
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e;
    console.error(e);
    return { ok: false, error: "Algo salió mal. Intenta de nuevo en un momento." };
  }
}
