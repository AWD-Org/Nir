import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Toaster } from "@/components/ui/toaster";
import { getUser } from "@/lib/server/db";
import { isStaffRole, requireSession } from "@/lib/server/session";
import { Wizard } from "./wizard";

export const metadata = { title: "Crea tu negocio", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ paso?: string }> }) {
  const s = await requireSession("/admin/bienvenida");
  if (isStaffRole(s.role)) redirect("/console");
  const { paso } = await searchParams;
  // Con negocio ya creado solo se muestran los pasos de logo y portada; nunca otro alta.
  if (s.tenantId && paso !== "logo" && paso !== "portada") redirect("/admin");
  const user = await getUser(s.uid);
  return (
    <div className="min-h-dvh">
      <header className="px-5 py-5 sm:px-8"><Logo href="/admin/bienvenida" /></header>
      <main className="mx-auto max-w-[520px] px-5 pb-16 pt-4">
        <Wizard needsTerms={!user?.termsAcceptedAt} initialStep={s.tenantId ? (paso === "portada" ? 2 : 1) : 0} />
      </main>
      <Toaster />
    </div>
  );
}
