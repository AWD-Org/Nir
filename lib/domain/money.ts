const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2, minimumFractionDigits: 0 });

export function formatPrice(cents: number): string {
  if (cents % 100 === 0) return mxn.format(cents / 100).replace(/\.00$/, "");
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(cents / 100);
}

/** "85", "85.50", "$1,200" → centavos. Devuelve null si no es un precio válido. */
export function parsePrice(input: string): number | null {
  const clean = input.replace(/[$,\s]/g, "");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(parseFloat(clean) * 100);
}

export function centsToInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}
