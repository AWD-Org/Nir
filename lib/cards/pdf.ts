"use client";

import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";

const MM = 72 / 25.4;
const CARD_W = 85.6 * MM;
const CARD_H = 54 * MM;

export interface PrintCard {
  table: number;
  url: string;
}

/** Texto seguro para las fuentes estándar del PDF (WinAnsi). */
const safe = (s: string) => s.normalize("NFC").replace(/[^\x20-\x7E -ÿ]/g, "");

async function webpToPng(src: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const bmp = await createImageBitmap(await res.blob());
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    c.getContext("2d")!.drawImage(bmp, 0, 0);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/**
 * RF34: PDF de QR por mesa listo para imprenta. Tarjetas de 85.6 × 54 mm en una hoja carta,
 * con logo, nombre, número de mesa, QR de respaldo (con ?s=qr) y la leyenda "Acerca tu celular".
 */
export async function buildCardsPdf(opts: { name: string; logoImageId: string | null; cards: PrintCard[]; wifi?: { ssid: string; password: string } | null }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Tarjetas Nir · ${safe(opts.name)}`);
  pdf.setCreator("AMOXTLI Nir");
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const logoPng = opts.logoImageId ? await webpToPng(`/img/${opts.logoImageId}/full`) : null;
  const logo = logoPng ? await pdf.embedPng(logoPng) : null;

  const pageW = 8.5 * 72;
  const pageH = 11 * 72;
  const cols = 2;
  const rows = 4;
  const gapX = 8 * MM;
  const gapY = 8 * MM;
  const marginX = (pageW - cols * CARD_W - (cols - 1) * gapX) / 2;
  const marginY = (pageH - rows * CARD_H - (rows - 1) * gapY) / 2;

  let page: PDFPage | null = null;
  for (let i = 0; i < opts.cards.length; i++) {
    const slot = i % (cols * rows);
    if (slot === 0) page = pdf.addPage([pageW, pageH]);
    const col = slot % cols;
    const row = Math.floor(slot / cols);
    const x = marginX + col * (CARD_W + gapX);
    const y = pageH - marginY - (row + 1) * CARD_H - row * gapY;
    const card = opts.cards[i];
    const qrPng = await QRCode.toDataURL(`${card.url}?s=qr`, { margin: 1, width: 600, errorCorrectionLevel: "M" });
    const qr = await pdf.embedPng(qrPng);
    drawCard(page!, { x, y, card, name: opts.name, logo, qr, bold, regular, wifi: opts.wifi ?? null });
  }
  return pdf.save();
}

function drawCard(
  page: PDFPage,
  o: { x: number; y: number; card: PrintCard; name: string; logo: PDFImage | null; qr: PDFImage; bold: PDFFont; regular: PDFFont; wifi: { ssid: string; password: string } | null },
) {
  const ink = rgb(0.07, 0.07, 0.08);
  const muted = rgb(0.35, 0.35, 0.38);
  // Línea de corte
  page.drawRectangle({ x: o.x, y: o.y, width: CARD_W, height: CARD_H, borderColor: rgb(0.8, 0.8, 0.82), borderWidth: 0.5 });

  const pad = 5 * MM;
  const qrSize = CARD_H - 2 * pad - 4 * MM;
  page.drawImage(o.qr, { x: o.x + CARD_W - pad - qrSize, y: o.y + pad + 4 * MM, width: qrSize, height: qrSize });
  page.drawText("o escanea", { x: o.x + CARD_W - pad - qrSize, y: o.y + pad, size: 6.5, font: o.regular, color: muted });

  let cursorY = o.y + CARD_H - pad;
  if (o.logo) {
    const h = 11 * MM;
    const w = (o.logo.width / o.logo.height) * h;
    page.drawImage(o.logo, { x: o.x + pad, y: cursorY - h, width: Math.min(w, 26 * MM), height: h });
    cursorY -= h + 2.5 * MM;
  }
  const name = safe(o.name);
  const maxW = CARD_W - 3 * pad - qrSize;
  let size = 10;
  while (o.bold.widthOfTextAtSize(name, size) > maxW && size > 6) size -= 0.5;
  page.drawText(name, { x: o.x + pad, y: cursorY - size, size, font: o.bold, color: ink, maxWidth: maxW });
  cursorY -= size + 2 * MM;

  page.drawText(`Mesa ${o.card.table}`, { x: o.x + pad, y: cursorY - 16, size: 16, font: o.bold, color: ink });

  // Ondas NFC + leyenda
  const by = o.y + pad + (o.wifi ? 7 * MM : 0);
  const cx = o.x + pad + 2;
  page.drawCircle({ x: cx, y: by + 3, size: 1.4, color: rgb(0.98, 0.12, 0.44) });
  for (const r of [4, 7]) {
    page.drawSvgPath(`M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r}`, { x: cx + 1.5, y: by + 3, borderColor: rgb(0.98, 0.12, 0.44), borderWidth: 1.1 });
  }
  page.drawText("Acerca tu celular", { x: o.x + pad + 12, y: by, size: 9, font: o.bold, color: ink });

  if (o.wifi) {
    page.drawText(safe(`Wi-Fi: ${o.wifi.ssid}`), { x: o.x + pad, y: o.y + pad + 3 * MM, size: 6.5, font: o.regular, color: muted, maxWidth: maxW });
    if (o.wifi.password) page.drawText(safe(`Clave: ${o.wifi.password}`), { x: o.x + pad, y: o.y + pad, size: 6.5, font: o.regular, color: muted, maxWidth: maxW });
  }
}
