import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-5 py-5 sm:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-6 sm:pt-12">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
      <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 py-6 text-sm text-ink-2">
        <Link href="/terminos" className="hover:text-ink">Términos</Link>
        <Link href="/privacidad" className="hover:text-ink">Privacidad</Link>
        <span>Desarrollado por AMOXTLI®</span>
      </footer>
    </div>
  );
}
