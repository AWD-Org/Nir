import { TIMEZONE } from "./constants";

const parts = (d: Date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;

/** Día en la Ciudad de México como AAAAMMDD. */
export function dayKey(d = new Date()): string {
  const p = parts(d);
  return `${p.year}${p.month}${p.day}`;
}

/** Hora en la Ciudad de México como "00"–"23". */
export function hourKey(d = new Date()): string {
  return parts(d).hour.padStart(2, "0");
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

/** Suma meses de calendario, ajustando al último día del mes si hace falta (31 ene + 1 = 28/29 feb). */
export function addMonths(d: Date, months: number): Date {
  const r = new Date(d.getTime());
  const day = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + months);
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(day, last));
  return r;
}

export function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(iso));
}

/** AAAAMMDD de los últimos `n` días, del más antiguo al más reciente. */
export function lastDayKeys(n: number, now = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(addDays(now, -i)));
  return out;
}
