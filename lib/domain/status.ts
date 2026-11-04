import { addDays } from "./dates";
import type { TenantStatus } from "./types";

export const DUE_DAYS = 5;
export const GRACE_DAYS = 7;
export const CANCEL_AFTER_SUSPENDED_DAYS = 90;

/**
 * Estado que corresponde según la vigencia pagada (RN09).
 * Solo aplica a cuentas ya activadas con vigencia; preview y cancelled no cambian solos.
 */
export function statusFor(paidUntil: Date, now = new Date()): TenantStatus {
  if (now < addDays(paidUntil, -DUE_DAYS)) return "active";
  if (now < paidUntil) return "due";
  if (now < addDays(paidUntil, GRACE_DAYS)) return "grace";
  if (now < addDays(paidUntil, GRACE_DAYS + CANCEL_AFTER_SUSPENDED_DAYS)) return "suspended";
  return "cancelled";
}

/** Siguiente estado automático para el cron diario, o null si no cambia. */
export function nextAutoStatus(
  current: TenantStatus,
  paidUntil: string | null,
  now = new Date(),
): TenantStatus | null {
  if (current === "preview" || current === "cancelled") return null;
  if (!paidUntil) return null; // Activa sin tarjetas entregadas: no corre el reloj.
  const s = statusFor(new Date(paidUntil), now);
  return s === current ? null : s;
}
