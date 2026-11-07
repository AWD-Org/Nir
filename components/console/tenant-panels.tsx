"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, Download, Eye, Loader2, Nfc, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Confirm } from "@/components/ui/confirm";
import { CONCEPT_LABELS } from "@/lib/domain/billing";
import { formatDate } from "@/lib/domain/dates";
import { parsePrice } from "@/lib/domain/money";
import type { Card, PaymentConcept, Tenant } from "@/lib/domain/types";
import { lockTag, nfcSupported, verifyUrl, writeUrl } from "@/lib/cards/nfc";
import { cardUrl } from "@/lib/cards/suffix";
import { SITE_URL } from "@/lib/domain/links";

/** La dirección de la tarjeta se arma con el dominio vigente, no con el que había al generarla. */
const urlOf = (c: Card) => cardUrl(SITE_URL, c.slug, c.table, c.suffix);
import { changeSlug, disableCard, generateCards, markCardWritten, recordDelivery, recordPayment, setStatus, viewAs } from "@/app/console/actions";

type R = { ok: true; data?: unknown } | { ok: false; error: string };
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const exec = (p: () => Promise<R>, ok: string, after?: () => void) =>
    start(async () => {
      const r = await p();
      if (!r.ok) return void toast.error(r.error);
      toast.success(ok);
      after?.();
      router.refresh();
    });
  return { pending, exec };
}

/* ---------- Estado de la cuenta ---------- */

export function StatusActions({ tenant, isSuper }: { tenant: Tenant; isSuper: boolean }) {
  const { pending, exec } = useAction();
  const router = useRouter();
  const [confirm, setConfirm] = useState<null | "suspended" | "cancelled">(null);
  const canActivate = ["preview", "suspended"].includes(tenant.status);
  return (
    <div className="flex flex-wrap gap-2">
      {canActivate && (
        <button className="btn-primary" disabled={pending || !tenant.billing.setupPaidAt} title={!tenant.billing.setupPaidAt ? "Registra primero el pago del alta" : undefined} onClick={() => exec(() => setStatus(tenant.id, "active"), "Cuenta activada; la página ya es pública")}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Activar cuenta
        </button>
      )}
      {["active", "due", "grace"].includes(tenant.status) && (
        <button className="btn-danger" disabled={pending} onClick={() => setConfirm("suspended")}>Suspender</button>
      )}
      {isSuper && tenant.status !== "cancelled" && (
        <button className="btn-ghost text-bad" disabled={pending} onClick={() => setConfirm("cancelled")}>Cancelar cuenta</button>
      )}
      <button
        className="btn-secondary"
        disabled={pending}
        onClick={async () => {
          const r = await viewAs(tenant.id);
          if (!r.ok) return void toast.error(r.error);
          router.push("/admin");
        }}
      >
        <Eye className="h-4 w-4" /> Entrar como el cliente
      </button>
      {!tenant.billing.setupPaidAt && canActivate && <p className="w-full text-sm text-ink-2">Para activar, registra primero el pago del alta (RN02).</p>}
      <Confirm
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={confirm === "cancelled" ? "¿Cancelar esta cuenta?" : "¿Suspender esta cuenta?"}
        description={confirm === "cancelled" ? "La página deja de mostrarse. Los datos se conservan 12 meses y después se borran." : "La página pública mostrará “Menú no disponible” y el admin queda en solo lectura. No se borra nada."}
        confirmLabel={confirm === "cancelled" ? "Cancelar cuenta" : "Suspender"}
        onConfirm={() => exec(() => setStatus(tenant.id, confirm!), confirm === "cancelled" ? "Cuenta cancelada" : "Cuenta suspendida")}
      />
    </div>
  );
}

/* ---------- Registrar pago (RF40) ---------- */

export function PaymentForm({ tenantId }: { tenantId: string }) {
  const { pending, exec } = useAction();
  const [f, setF] = useState({ concept: "setup" as PaymentConcept, amount: "", method: "transfer", reference: "", paidAt: today() });
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const cents = parsePrice(f.amount);
        if (cents === null) return void toast.error("Escribe el monto, por ejemplo 1490.");
        exec(() => recordPayment(tenantId, { concept: f.concept, amountCents: cents, method: f.method, reference: f.reference, paidAt: f.paidAt }), "Pago registrado", () => setF((x) => ({ ...x, amount: "", reference: "" })));
      }}
    >
      <div>
        <label className="label" htmlFor="pay-concept">Concepto</label>
        <select id="pay-concept" className="field" value={f.concept} onChange={(e) => setF({ ...f, concept: e.target.value as PaymentConcept })}>
          {(Object.keys(CONCEPT_LABELS) as PaymentConcept[]).map((c) => <option key={c} value={c}>{CONCEPT_LABELS[c]}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="pay-amount">Monto (MXN)</label>
        <input id="pay-amount" className="field num" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
      </div>
      <div>
        <label className="label" htmlFor="pay-method">Método</label>
        <select id="pay-method" className="field" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
          <option value="transfer">Transferencia</option>
          <option value="stripe_link">Liga de pago</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="pay-date">Fecha de pago</label>
        <input id="pay-date" type="date" className="field" value={f.paidAt} onChange={(e) => setF({ ...f, paidAt: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="pay-ref">Folio o referencia</label>
        <input id="pay-ref" className="field" maxLength={80} value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <button className="btn-dark w-full sm:w-auto" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Registrar pago</button>
        <p className="hint">Mensualidad y anualidad extienden la vigencia; si se pagan antes de entregar tarjetas, cuentan desde la entrega.</p>
      </div>
    </form>
  );
}

/* ---------- Entrega de tarjetas (RF41) ---------- */

export function DeliveryForm({ tenantId, delivered }: { tenantId: string; delivered: string | null }) {
  const { pending, exec } = useAction();
  const [date, setDate] = useState(today());
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); exec(() => recordDelivery(tenantId, date), "Entrega registrada; el primer cobro queda a un mes"); }}>
      <div>
        <label className="label" htmlFor="del-date">Fecha de entrega</label>
        <input id="del-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <button className="btn-secondary" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}{delivered ? "Corregir entrega" : "Registrar entrega"}</button>
      {delivered && <p className="w-full text-sm text-ink-2">Entregadas el {formatDate(delivered)}.</p>}
    </form>
  );
}

/* ---------- Tarjetas (RF32–RF36, RF45) ---------- */

const CARD_STATUS: Record<Card["status"], string> = { produced: "Producida", delivered: "Entregada", disabled: "Desactivada" };

export function CardsPanel({ tenant, cards }: { tenant: Tenant; cards: Card[] }) {
  const { pending, exec } = useAction();
  const [tables, setTables] = useState(String(Math.max(tenant.tables.length, 10)));
  const [confirm, setConfirm] = useState<{ card: Card; replace: boolean } | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [nfc, setNfc] = useState<{ card: Card; step: string } | null>(null);
  const live = cards.filter((c) => c.status !== "disabled");

  async function downloadPdf(list: Card[]) {
    setPdfBusy(true);
    try {
      const { buildCardsPdf } = await import("@/lib/cards/pdf");
      const bytes = await buildCardsPdf({
        name: tenant.name,
        logoImageId: tenant.profile.logoImageId,
        cards: list.map((c) => ({ table: c.table, url: urlOf(c) })),
        wifi: tenant.wifi.enabled ? { ssid: tenant.wifi.ssid, password: tenant.wifi.password } : null,
      });
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `nir-${tenant.slug}-tarjetas.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos generar el PDF.");
    } finally {
      setPdfBusy(false);
    }
  }

  async function writeNfc(card: Card) {
    if (!nfcSupported()) return void toast.error("El grabado NFC funciona en Chrome para Android.");
    const ctrl = new AbortController();
    try {
      setNfc({ card, step: "Acerca la tarjeta al celular para grabar." });
      await writeUrl(urlOf(card), ctrl.signal);
      setNfc({ card, step: "Grabada. Acércala otra vez para verificar." });
      const ok = await verifyUrl(urlOf(card), ctrl.signal);
      if (!ok) throw new Error("La tarjeta no tiene la dirección correcta. Vuelve a grabarla.");
      setNfc({ card, step: "Verificada. Acércala una última vez para bloquearla." });
      await lockTag(ctrl.signal);
      await markCardWritten(card.id);
      toast.success(`Mesa ${card.table}: grabada, verificada y bloqueada`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo grabar la tarjeta.");
    } finally {
      ctrl.abort();
      setNfc(null);
    }
  }

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); exec(() => generateCards(tenant.id, Number(tables)), "Tarjetas generadas"); }}>
        <div>
          <label className="label" htmlFor="tables">Mesas</label>
          <input id="tables" type="number" min={1} max={100} className="field num w-28" value={tables} onChange={(e) => setTables(e.target.value)} />
        </div>
        <button className="btn-dark" disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Generar tarjetas</button>
        <button type="button" className="btn-secondary" disabled={pdfBusy || live.length === 0} onClick={() => downloadPdf(live)}>
          {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PDF para imprenta
        </button>
        <p className="w-full text-sm text-ink-2">
          Incluidas en el alta: <span className="num">{tenant.billing.includedCards}</span> · vigentes: <span className="num">{live.length}</span>. Solo se crean tarjetas para mesas que no tengan una vigente.
        </p>
      </form>

      {nfc && (
        <div className="flex items-center gap-3 rounded-lg border border-brand/30 bg-brand-tint px-4 py-3" role="status">
          <Nfc className="h-5 w-5 text-brand-strong" />
          <p className="text-[15px]"><strong>Mesa {nfc.card.table}.</strong> {nfc.step}</p>
        </div>
      )}

      {cards.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink-2">
                <th className="px-3 py-2 font-medium">Mesa</th>
                <th className="px-3 py-2 font-medium">Dirección grabada</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">NFC</th>
                <th className="px-3 py-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id} className={`border-b border-line/70 last:border-0 ${c.status === "disabled" ? "text-ink-3" : ""}`}>
                  <td className="num px-3 py-2">{c.table}</td>
                  <td className="num px-3 py-2">{urlOf(c).replace(/^https?:\/\//, "")}</td>
                  <td className="px-3 py-2">{CARD_STATUS[c.status]}{c.disabledAt ? ` · ${formatDate(c.disabledAt)}` : ""}</td>
                  <td className="px-3 py-2">{c.writtenAt ? "Bloqueada" : "—"}</td>
                  <td className="px-3 py-2">
                    {c.status !== "disabled" && (
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost min-h-9 px-2 text-sm" disabled={!!nfc} onClick={() => writeNfc(c)} title="Grabar NFC (Chrome Android)"><Nfc className="h-4 w-4" />Grabar</button>
                        <button className="btn-ghost min-h-9 px-2 text-sm" onClick={() => downloadPdf([c])} title="PDF de esta tarjeta"><Download className="h-4 w-4" /></button>
                        <button className="btn-ghost min-h-9 px-2 text-sm" onClick={() => setConfirm({ card: c, replace: true })} title="Reponer"><RefreshCw className="h-4 w-4" /></button>
                        <button className="btn-ghost min-h-9 px-2 text-sm hover:text-bad" onClick={() => setConfirm({ card: c, replace: false })} title="Desactivar"><Ban className="h-4 w-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Confirm
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={confirm?.replace ? `¿Reponer la tarjeta de la mesa ${confirm.card.table}?` : `¿Desactivar la tarjeta de la mesa ${confirm?.card.table}?`}
        description={confirm?.replace ? "La tarjeta actual deja de funcionar al instante y se crea una nueva con otro código para grabar e imprimir. La reposición se cobra aparte." : "La tarjeta deja de funcionar al instante y muestra “Menú no disponible”. Queda en el historial."}
        confirmLabel={confirm?.replace ? "Reponer" : "Desactivar"}
        onConfirm={() => exec(() => disableCard(confirm!.card.id, confirm!.replace), confirm!.replace ? "Tarjeta repuesta" : "Tarjeta desactivada")}
      />
    </div>
  );
}

/* ---------- Cambio de slug (solo superadmin) ---------- */

export function SlugForm({ tenantId, slug }: { tenantId: string; slug: string }) {
  const { pending, exec } = useAction();
  const [value, setValue] = useState(slug);
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); exec(() => changeSlug(tenantId, value), "Dirección cambiada; la anterior redirige a la nueva"); }}>
      <div className="min-w-0 flex-1">
        <label className="label" htmlFor="slug-new">Nueva dirección</label>
        <input id="slug-new" className="field num" value={value} onChange={(e) => setValue(e.target.value.toLowerCase())} />
      </div>
      <button className="btn-secondary" disabled={pending || value === slug}>Cambiar</button>
      <p className="w-full text-sm text-ink-2">Las tarjetas grabadas con la dirección anterior siguen funcionando.</p>
    </form>
  );
}
