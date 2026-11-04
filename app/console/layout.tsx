import { ConsoleNav } from "@/components/console/nav";
import { Toaster } from "@/components/ui/toaster";
import { requireStaff } from "@/lib/server/session";

export const metadata = { title: { default: "Consola", template: "%s · Consola Nir" }, robots: { index: false, follow: false } };

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const s = await requireStaff();
  return (
    <div className="min-h-dvh">
      <ConsoleNav email={s.email} role={s.role} />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      <Toaster />
    </div>
  );
}
