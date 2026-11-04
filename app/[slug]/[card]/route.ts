import { after, NextResponse, type NextRequest } from "next/server";
import { parseCardCode } from "@/lib/cards/suffix";
import { isPublic } from "@/lib/domain/constants";
import { getCardIndex, getPublicPage, resolveSlug } from "@/lib/server/public-data";
import { recordHit } from "@/lib/server/stats";

export const dynamic = "force-dynamic";

/**
 * Toque de tarjeta: nir.amoxtli.tech/{slug}/{mesa}-{sufijo} (con ?s=qr en el QR impreso).
 * Valida la tarjeta con el mapa en caché (0 lecturas), suma la visita (1 escritura) y
 * redirige a la página del negocio, que se sirve desde caché.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; card: string }> }) {
  const { slug: rawSlug, card } = await params;
  const slug = rawSlug.toLowerCase();
  const unavailable = () => noStore(NextResponse.redirect(new URL("/no-disponible", req.url), 302));

  const code = parseCardCode(card.toLowerCase());
  if (!code) return unavailable();

  const info = await resolveSlug(slug);
  if (!info) return unavailable();
  if (!info.current) {
    // RF37: el slug anterior sigue funcionando y lleva al nuevo.
    const url = new URL(`/${info.currentSlug}/${card}`, req.url);
    url.search = req.nextUrl.search;
    return noStore(NextResponse.redirect(url, 308));
  }

  const [cards, page] = await Promise.all([getCardIndex(info.tenantId), getPublicPage(info.tenantId)]);
  const status = cards[`${code.table}-${code.suffix}`];
  if (!status || status === "disabled" || !page || !isPublic(page.status)) return unavailable();

  const source = req.nextUrl.searchParams.get("s") === "qr" ? "qr" : "nfc";
  after(() => recordHit({ tenantId: info.tenantId, visit: { source, table: code.table } }).catch((e) => console.error("hit", e)));

  return noStore(NextResponse.redirect(new URL(`/${slug}#t`, req.url), 302));
}

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store");
  return res;
}
