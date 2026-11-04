import { NextResponse } from "next/server";
import { isPublic } from "@/lib/domain/constants";
import type { ButtonKey, SocialKey } from "@/lib/domain/types";
import { getPublicPage, resolveSlug } from "@/lib/server/public-data";
import { recordHit } from "@/lib/server/stats";

const BUTTONS: ButtonKey[] = ["menu", "reviews", "social", "wifi"];
const SOCIALS: SocialKey[] = ["instagram", "facebook", "tiktok", "whatsapp"];

function pick<K extends string>(obj: unknown, keys: K[]): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {};
  if (!obj || typeof obj !== "object") return out;
  for (const k of keys) {
    const v = (obj as Record<string, unknown>)[k];
    if (typeof v === "number" && v > 0) out[k] = Math.min(Math.floor(v), 20);
  }
  return out;
}

/** Visitas por enlace directo y clics en botones. Solo contadores; ningún dato del comensal. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const b = body as { slug?: unknown; visit?: unknown; clicks?: unknown; social?: unknown };
  if (typeof b.slug !== "string" || !/^[a-z0-9-]{3,40}$/.test(b.slug)) return new NextResponse(null, { status: 400 });

  const info = await resolveSlug(b.slug);
  if (!info) return new NextResponse(null, { status: 204 });
  const page = await getPublicPage(info.tenantId);
  if (!page || !isPublic(page.status)) return new NextResponse(null, { status: 204 });

  await recordHit({
    tenantId: info.tenantId,
    visit: b.visit === true ? { source: "link", table: null } : undefined,
    clicks: pick(b.clicks, BUTTONS),
    social: pick(b.social, SOCIALS),
  });
  return new NextResponse(null, { status: 204 });
}
