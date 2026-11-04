import { addMonths } from "./dates";
import { statusFor } from "./status";
import type { PaymentConcept, TenantBilling, TenantStatus } from "./types";

export const CONCEPT_LABELS: Record<PaymentConcept, string> = {
  setup: "Alta",
  monthly: "Mensualidad",
  annual: "Anualidad",
  cards: "Tarjetas adicionales",
};

export const monthsFor = (c: PaymentConcept) => (c === "monthly" ? 1 : c === "annual" ? 12 : 0);

export interface PaymentEffect {
  billing: TenantBilling;
  coversFrom: string | null;
  coversUntil: string | null;
  status: TenantStatus;
}

/**
 * Efecto de registrar un pago (RF40, RN07).
 * - Alta: guarda la fecha; no da vigencia.
 * - Mensualidad/anualidad antes de entregar tarjetas: se acumulan como meses prepagados.
 * - Después de la entrega: extiende la vigencia desde la fecha vigente (o desde hoy si ya venció).
 * - Si la cuenta estaba por vencer, en gracia o suspendida y queda vigente, se reactiva al instante.
 */
export function applyPayment(
  billing: TenantBilling,
  status: TenantStatus,
  concept: PaymentConcept,
  paidAt: Date,
  now = new Date(),
): PaymentEffect {
  const b: TenantBilling = { ...billing };
  let coversFrom: string | null = null;
  let coversUntil: string | null = null;
  let nextStatus = status;

  if (concept === "setup") b.setupPaidAt = paidAt.toISOString();
  if (concept === "annual") b.cycle = "annual";
  if (concept === "monthly" && b.cycle !== "annual") b.cycle = "monthly";

  const months = monthsFor(concept);
  if (months > 0) {
    if (!b.cardsDeliveredAt || !b.paidUntil) {
      b.prepaidMonths = (b.prepaidMonths ?? 0) + months;
    } else {
      const current = new Date(b.paidUntil);
      const from = status === "suspended" || status === "cancelled" ? (current > now ? current : now) : current;
      const until = addMonths(from, months);
      coversFrom = from.toISOString();
      coversUntil = until.toISOString();
      b.paidUntil = coversUntil;
      b.nextPaymentAt = coversUntil;
      if (["active", "due", "grace", "suspended"].includes(status)) {
        nextStatus = statusFor(until, now);
      }
    }
  }
  return { billing: b, coversFrom, coversUntil, status: nextStatus };
}

/**
 * Registrar la entrega de tarjetas (RF41): la mensualidad empieza ese día y el primer
 * cobro es un mes después; si pagó la anualidad en la visita 1, cubre 12 meses desde la entrega.
 */
export function applyDelivery(billing: TenantBilling, deliveredAt: Date): TenantBilling {
  const months = Math.max(1, billing.prepaidMonths ?? 0);
  const until = addMonths(deliveredAt, months).toISOString();
  return {
    ...billing,
    cardsDeliveredAt: deliveredAt.toISOString(),
    paidUntil: until,
    nextPaymentAt: until,
    prepaidMonths: 0,
  };
}

export const emptyBilling = (): TenantBilling => ({
  cycle: "monthly",
  setupPaidAt: null,
  cardsDeliveredAt: null,
  nextPaymentAt: null,
  paidUntil: null,
  includedCards: 10,
  prepaidMonths: 0,
});
