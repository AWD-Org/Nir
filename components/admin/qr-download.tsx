"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Check, Copy, Download, ExternalLink } from "lucide-react";

/** RF22: QR general del negocio para redes (no es un QR de mesa), con el enlace para copiar o abrir. */
export function QrDownload({ url, slug }: { url: string; slug: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    QRCode.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: "M", color: { dark: "#121214", light: "#FFFFFF" } }).then(setSrc);
  }, [url]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* se puede copiar a mano desde el texto */
    }
  };
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-32 w-32 shrink-0 rounded-lg border border-line bg-white p-1.5">
        {src && <img src={src} alt={`Código QR de ${url}`} className="h-full w-full" />}
      </div>
      <div className="min-w-0">
        <a href={url} target="_blank" rel="noopener" className="num inline-flex items-start gap-1.5 break-all text-[15px] text-ink underline-offset-4 hover:underline">
          {url.replace(/^https?:\/\//, "")}
          <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-3" />
        </a>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={copy} className="btn-secondary">
            {copied ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}
            {copied ? "Enlace copiado" : "Copiar enlace"}
          </button>
          <a href={src ?? undefined} download={`nir-${slug}-qr.png`} className="btn-secondary" aria-disabled={!src}>
            <Download className="h-4 w-4" /> Descargar QR
          </a>
        </div>
        <p className="hint">Para tus redes o tu puerta. Las mesas usan sus propias tarjetas.</p>
        <p aria-live="polite" className="sr-only">{copied ? "Enlace copiado" : ""}</p>
      </div>
    </div>
  );
}
