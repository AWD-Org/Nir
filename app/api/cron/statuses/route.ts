import { NextResponse } from "next/server";
import { nextAutoStatus } from "@/lib/domain/status";
import type { Tenant } from "@/lib/domain/types";
import { logAudit } from "@/lib/server/audit";
import { authorized, SYSTEM } from "@/lib/server/cron";
import { col, fromFs, nowTs } from "@/lib/server/db";
import { publishTenant } from "@/lib/server/publish";

export const dynamic = "force-dynamic";

/** Cron diario (RN09): mueve cada cuenta entre activa, por vencer, gracia, suspendida y cancelada. */
export async function POST(req: Request) {
  if (!authorized(req)) return new NextResponse(null, { status: 401 });
  const snap = await col.tenants().where("status", "in", ["active", "due", "grace", "suspended"]).get();
  const changes: { id: string; from: string; to: string }[] = [];
  for (const d of snap.docs) {
    const t = fromFs<Tenant>({ id: d.id, ...d.data() });
    const next = nextAutoStatus(t.status, t.billing.paidUntil);
    if (!next) continue;
    await d.ref.update({ status: next, updatedAt: nowTs() });
    await logAudit(SYSTEM, t.id, "status.auto", { status: t.status }, { status: next });
    await publishTenant(t.id);
    changes.push({ id: t.id, from: t.status, to: next });
  }
  return NextResponse.json({ checked: snap.size, changes });
}
