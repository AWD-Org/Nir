const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Identificador aleatorio corto, seguro para URLs (no adivinable). */
export function newId(prefix: string, length = 12): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += CHARS[b % CHARS.length];
  return `${prefix}_${out}`;
}
