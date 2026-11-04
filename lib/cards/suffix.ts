// Sin 0/O, 1/l/i para que se pueda dictar y no se confunda al leerlo.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function randomSuffix(length = 4): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export const CARD_CODE_RE = /^(\d{1,3})-([a-z0-9]{4})$/;

export function parseCardCode(code: string): { table: number; suffix: string } | null {
  const m = CARD_CODE_RE.exec(code);
  if (!m) return null;
  const table = Number(m[1]);
  if (table < 1 || table > 999) return null;
  return { table, suffix: m[2] };
}

export const cardId = (tenantId: string, table: number, suffix: string) => `${tenantId}_${table}-${suffix}`;

export function cardUrl(siteUrl: string, slug: string, table: number, suffix: string) {
  return `${siteUrl.replace(/\/$/, "")}/${slug}/${table}-${suffix}`;
}
