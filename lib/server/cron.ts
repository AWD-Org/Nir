import "server-only";
import type { Session } from "./session";

export const SYSTEM: Session = { uid: "system", email: "cron@nir", name: "Tarea programada", role: "superadmin", tenantId: null };

/** Las rutas /api/cron/* solo responden con el secreto compartido con GitHub Actions. */
export function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}
