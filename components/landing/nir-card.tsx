"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { SITE_URL } from "@/lib/domain/links";

/** La tarjeta física de mesa (85.6 × 54 mm): frente con mesa y NFC, reverso con QR. */
export function NirCard({ side = "front", table = 12, className = "" }: { side?: "front" | "back"; table?: number; className?: string }) {
  return (
    <div className={`relative aspect-[85.6/54] select-none [container-type:inline-size] overflow-hidden rounded-[6%/9.5%] bg-[#F3F0E9] text-[#141416] shadow-[0_1px_0_rgba(255,255,255,.6)_inset,0_30px_60px_-25px_rgba(0,0,0,.8)] ${className}`}>
      {side === "front" ? <Front table={table} /> : <Back table={table} />}
    </div>
  );
}

function Front({ table }: { table: number }) {
  return (
    <div className="flex h-full flex-col justify-between p-[7%]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-[0.5em] text-[clamp(6px,2.7cqw,15px)]">
          <span className="flex aspect-square w-[2.4em] items-center justify-center rounded-[0.35em] bg-[#141416] font-semibold text-[#F3F0E9]">C</span>
          <span className="font-medium leading-tight">Cantina<br />El Ejemplo</span>
        </div>
        <svg viewBox="0 0 32 32" className="w-[13%]" aria-hidden fill="none">
          <circle cx="10" cy="16" r="3" fill="#FA1F6F" />
          <path d="M15.5 9.5a9 9 0 0 1 0 13M20.5 5.5a14.5 14.5 0 0 1 0 21" stroke="#FA1F6F" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-[clamp(14px,8.5cqw,46px)] font-semibold leading-none tracking-tight">Mesa {table}</p>
        <p className="mt-[0.4em] text-[clamp(5px,2.3cqw,13px)] text-[#141416]/65">Acerca tu celular · carta, reseñas y Wi-Fi</p>
      </div>
    </div>
  );
}

function Back({ table }: { table: number }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    QRCode.toString(`${SITE_URL}/ejemplo/${table}-k7m2?s=qr`, { type: "svg", margin: 0, color: { dark: "#141416", light: "#0000" } }).then(setSvg);
  }, [table]);
  return (
    <div className="flex h-full items-center gap-[7%] p-[7%]">
      <div className="aspect-square h-full" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="text-[clamp(6px,2.7cqw,15px)] leading-snug">
        <p className="font-semibold">¿Sin NFC?</p>
        <p className="text-[#141416]/65">Escanea el código con la cámara.</p>
        <p className="mt-[1em] font-mono text-[#141416]/50">Mesa {table}</p>
      </div>
    </div>
  );
}
