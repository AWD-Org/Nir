import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line px-4 py-4 md:px-8"><Logo /></header>
      <main className="mx-auto max-w-[68ch] px-4 py-12 md:px-0">
        <h1 className="text-[34px] font-semibold leading-tight">{title}</h1>
        <p className="mt-2 text-ink-2">Versión {updated}</p>
        <div className="mt-8 space-y-5 text-[16px] leading-relaxed text-ink [&_h2]:mt-10 [&_h2]:text-[20px] [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{children}</div>
      </main>
      <footer className="border-t border-line px-4 py-6 text-center text-sm text-ink-2">
        <Link href="/" className="hover:text-ink">Nir</Link> · Desarrollado por AMOXTLI®
      </footer>
    </div>
  );
}
