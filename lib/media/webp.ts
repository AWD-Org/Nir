/** Verifica la firma de un archivo WebP: "RIFF" .... "WEBP". */
export function isWebp(buf: Uint8Array): boolean {
  return (
    buf.length > 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  );
}
