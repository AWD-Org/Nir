import "server-only";
import { col, nowTs } from "./db";
import type { Session } from "./session";

/** RF44: toda acción de AMOXTLI® sobre un negocio deja rastro (usuario, acción, fecha, antes y después). */
export async function logAudit(
  s: Session,
  tenantId: string | null,
  action: string,
  before: Record<string, unknown> | null = null,
  after: Record<string, unknown> | null = null,
) {
  await col.audit().add({
    actorUid: s.uid,
    actorEmail: s.email,
    actorRole: s.role,
    tenantId,
    action,
    before: before ? JSON.parse(JSON.stringify(before)) : null,
    after: after ? JSON.parse(JSON.stringify(after)) : null,
    at: nowTs(),
  });
}
