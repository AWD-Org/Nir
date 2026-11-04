import Link from "next/link";
import { formatDate } from "@/lib/domain/dates";
import type { AuditEntry } from "@/lib/domain/types";

export function AuditTable({ entries, names }: { entries: AuditEntry[]; names?: Map<string, string> }) {
  if (!entries.length) return <p className="px-4 py-6 text-ink-2">Sin acciones registradas.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-ink-2">
            <th className="px-4 py-2 font-medium">Fecha</th>
            <th className="px-4 py-2 font-medium">Usuario</th>
            {names && <th className="px-4 py-2 font-medium">Negocio</th>}
            <th className="px-4 py-2 font-medium">Acción</th>
            <th className="px-4 py-2 font-medium">Antes → después</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-line/70 align-top last:border-0">
              <td className="whitespace-nowrap px-4 py-2">{formatDate(e.at, true)}</td>
              <td className="px-4 py-2">{e.actorEmail}</td>
              {names && (
                <td className="px-4 py-2">
                  {e.tenantId ? <Link className="hover:underline" href={`/console/negocios/${e.tenantId}`}>{names.get(e.tenantId) ?? e.tenantId}</Link> : "—"}
                </td>
              )}
              <td className="num px-4 py-2">{e.action}</td>
              <td className="max-w-[380px] px-4 py-2">
                <details>
                  <summary className="cursor-pointer text-ink-2">Ver detalle</summary>
                  <pre className="num mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-paper p-2 text-[12px]">{JSON.stringify({ antes: e.before, despues: e.after }, null, 2)}</pre>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
