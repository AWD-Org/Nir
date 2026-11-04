import type { ButtonKey, DayStats, SocialKey, Source } from "./types";

export interface StatsSummary {
  total: number;
  byDay: { date: string; visits: number }[];
  byHour: number[];
  byTable: { table: string; visits: number }[];
  bySource: Record<Source, number>;
  clicks: Record<ButtonKey, number>;
  social: Record<SocialKey, number>;
}

/** Suma los contadores diarios de un rango (RF24). */
export function summarize(days: string[], stats: DayStats[]): StatsSummary {
  const byDate = new Map(stats.map((s) => [s.date, s]));
  const byHour = Array.from({ length: 24 }, () => 0);
  const byTable: Record<string, number> = {};
  const bySource: Record<Source, number> = { nfc: 0, qr: 0, link: 0 };
  const clicks: Record<ButtonKey, number> = { menu: 0, reviews: 0, social: 0, wifi: 0 };
  const social: Record<SocialKey, number> = { instagram: 0, facebook: 0, tiktok: 0, whatsapp: 0 };
  let total = 0;
  for (const s of stats) {
    total += s.visits ?? 0;
    for (const [h, v] of Object.entries(s.byHour ?? {})) byHour[Number(h)] += v;
    for (const [t, v] of Object.entries(s.byTable ?? {})) byTable[t] = (byTable[t] ?? 0) + v;
    for (const [k, v] of Object.entries(s.bySource ?? {})) bySource[k as Source] += v ?? 0;
    for (const [k, v] of Object.entries(s.clicks ?? {})) clicks[k as ButtonKey] += v ?? 0;
    for (const [k, v] of Object.entries(s.social ?? {})) social[k as SocialKey] += v ?? 0;
  }
  return {
    total,
    byDay: days.map((d) => ({ date: d, visits: byDate.get(d)?.visits ?? 0 })),
    byHour,
    byTable: Object.entries(byTable)
      .map(([table, visits]) => ({ table, visits }))
      .sort((a, b) => (a.table === "link" ? 1 : b.table === "link" ? -1 : Number(a.table) - Number(b.table))),
    bySource,
    clicks,
    social,
  };
}
