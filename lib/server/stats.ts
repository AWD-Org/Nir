import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { dayKey, hourKey } from "@/lib/domain/dates";
import type { ButtonKey, SocialKey, Source } from "@/lib/domain/types";
import { col } from "./db";

interface Hit {
  tenantId: string;
  visit?: { source: Source; table?: number | null };
  clicks?: Partial<Record<ButtonKey, number>>;
  social?: Partial<Record<SocialKey, number>>;
}

/** Suma a los contadores del día con una sola escritura (increment). Sin datos del comensal. */
export async function recordHit({ tenantId, visit, clicks, social }: Hit, now = new Date()) {
  const date = dayKey(now);
  const inc = FieldValue.increment;
  const data: Record<string, unknown> = { tenantId, date };
  if (visit) {
    data.visits = inc(1);
    data.byHour = { [hourKey(now)]: inc(1) };
    data.bySource = { [visit.source]: inc(1) };
    data.byTable = { [visit.table ? String(visit.table) : "link"]: inc(1) };
  }
  if (clicks && Object.keys(clicks).length) {
    data.clicks = Object.fromEntries(Object.entries(clicks).map(([k, v]) => [k, inc(v ?? 0)]));
  }
  if (social && Object.keys(social).length) {
    data.social = Object.fromEntries(Object.entries(social).map(([k, v]) => [k, inc(v ?? 0)]));
  }
  if (!visit && !data.clicks && !data.social) return;
  await col.stats().doc(`${tenantId}_${date}`).set(data, { merge: true });
}
