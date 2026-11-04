import "@fontsource/big-shoulders-display/800";
import "@fontsource-variable/instrument-sans";
import "@fontsource/young-serif";
import "@fontsource-variable/schibsted-grotesk";
import Link from "next/link";
import { PublicView } from "@/components/public/public-view";
import { getDraft } from "@/lib/server/db";
import { buildPublicPage } from "@/lib/domain/publish";
import { requireOwner } from "@/lib/server/session";

export const metadata = { title: "Vista previa", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** RF20: la página tal como la verá el comensal, privada mientras la cuenta no esté activa. */
export default async function Page() {
  const { tenant } = await requireOwner();
  const page = buildPublicPage(tenant, await getDraft(tenant.id));
  return (
    <div className="relative">
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-ink px-4 py-2 text-sm text-white">
        <span>Vista previa privada · solo tú la ves</span>
        <Link href="/admin" className="rounded-md bg-white/15 px-3 py-1 font-medium hover:bg-white/25">Volver al admin</Link>
      </div>
      <PublicView page={page} mode="preview" />
    </div>
  );
}
