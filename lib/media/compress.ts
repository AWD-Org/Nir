"use client";

import { LIMITS } from "@/lib/domain/constants";

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    } catch {
      /* Safari antiguo: se usa <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

async function encode(src: ImageBitmap | HTMLImageElement, maxPx: number, maxBytes: number, square: boolean): Promise<Blob> {
  const sw = src.width;
  const sh = src.height;
  let sx = 0, sy = 0, cw = sw, ch = sh;
  if (square) {
    const side = Math.min(sw, sh);
    sx = (sw - side) / 2;
    sy = (sh - side) / 2;
    cw = ch = side;
  }
  let scale = Math.min(1, maxPx / Math.max(cw, ch));
  for (let attempt = 0; attempt < 8; attempt++) {
    const w = Math.max(1, Math.round(cw * scale));
    const h = Math.max(1, Math.round(ch * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, sx, sy, cw, ch, 0, 0, w, h);
    for (const q of [0.82, 0.72, 0.62, 0.5, 0.4]) {
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", q));
      if (!blob) throw new Error("Tu navegador no puede convertir la imagen.");
      if (blob.type !== "image/webp") throw new Error("Tu navegador no genera WebP. Usa Chrome o Safari actualizado.");
      if (blob.size <= maxBytes) return blob;
    }
    scale *= 0.8;
  }
  throw new Error("No pudimos reducir la imagen lo suficiente. Prueba con otra foto.");
}

/**
 * RF11: redimensiona y convierte a WebP en el navegador, en dos tamaños:
 * completa (1080 px, 150 KB) y miniatura (400 px, 40 KB). Si no cabe, baja la calidad.
 */
export async function compressImage(file: File, opts: { square?: boolean } = {}) {
  if (!file.type.startsWith("image/")) throw new Error("Elige un archivo de imagen.");
  if (file.size > 25 * 1024 * 1024) throw new Error("La foto pesa más de 25 MB.");
  const src = await loadBitmap(file);
  const full = await encode(src, LIMITS.fullImagePx, LIMITS.fullImageBytes, !!opts.square);
  const thumb = await encode(src, LIMITS.thumbImagePx, LIMITS.thumbImageBytes, true);
  if ("close" in src) src.close();
  return { full, thumb };
}
