import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PublicView } from "@/components/public/public-view";
import { Unavailable } from "@/components/public/unavailable";
import { isPublic } from "@/lib/domain/constants";
import { getPublicPage, resolveSlug } from "@/lib/server/public-data";

// Página pública con ISR: se genera la primera vez y queda en caché hasta que el dueño publica.
export const revalidate = 86400;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const info = await resolveSlug(slug.toLowerCase());
  if (!info) return { info: null, page: null };
  const page = await getPublicPage(info.tenantId);
  return { info, page };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { info, page } = await load(slug);
  if (!info || !page || !isPublic(page.status)) {
    return { title: "Menú no disponible", robots: { index: false, follow: false } };
  }
  const description = `Carta, reseñas, redes y Wi-Fi de ${page.name}${page.profile.address ? ` · ${page.profile.address}` : ""}.`;
  return {
    title: { absolute: page.name },
    description,
    alternates: { canonical: `/${info.currentSlug}` },
    openGraph: {
      title: page.name,
      description,
      url: `/${info.currentSlug}`,
      images: page.coverImageId ? [{ url: `/img/${page.coverImageId}/full`, alt: page.name }] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const { info, page } = await load(slug);
  if (!info) notFound();
  if (!info.current) permanentRedirect(`/${info.currentSlug}`);
  if (!page || !isPublic(page.status)) return <Unavailable name={page?.name} />;
  return <PublicView page={page} />;
}
