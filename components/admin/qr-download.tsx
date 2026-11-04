"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

/** RF22: QR general del negocio para redes (no es un QR de mesa). */
export function QrDownload({ url, slug }: { url: string; slug: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: "M", color: { dark: "#121214", light: "#FFFFFF" } }).then(setSrc);
  }, [url]);
  return (
    <div className="flex items-center gap-4">
      <div className="h-28 w-28 shrink-0 rounded-lg border border-line bg-white p-1.5">
        {src && <img src={src} alt={`Código QR de ${url}`} className="h-full w-full" />}
      </div>
      <div className="min-w-0">
        <p className="num truncate text-sm text-ink-2">{url.replace(/^https?:\/\//, "")}</p>
        <a href={src ?? undefined} download={`nir-${slug}-qr.png`} className="btn-secondary mt-3" aria-disabled={!src}>
          <Download className="h-4 w-4" /> Descargar QR
        </a>
        <p className="hint">Para tus redes o tu puerta. Las mesas usan sus propias tarjetas.</p>
      </div>
    </div>
  );
}
