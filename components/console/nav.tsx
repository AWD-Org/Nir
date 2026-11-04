"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/components/auth/auth-client";
import { Logo } from "@/components/ui/logo";

const LINKS = [
  { href: "/console", label: "Negocios" },
  { href: "/console/por-vencer", label: "Por vencer" },
  { href: "/console/auditoria", label: "Auditoría" },
];

export function ConsoleNav({ email, role }: { email: string; role: string }) {
  const path = usePathname();
  const router = useRouter();
  const on = (h: string) => (h === "/console" ? path === "/console" || path.startsWith("/console/negocios") : path.startsWith(h));
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-8">
        <Logo href="/console" sub="Consola" />
        <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto" aria-label="Consola">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={on(l.href) ? "page" : undefined} className={`whitespace-nowrap rounded-md px-3 py-2 text-[15px] font-medium ${on(l.href) ? "bg-paper text-ink" : "text-ink-2 hover:text-ink"}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-ink-2">
          <span className="hidden sm:inline">{email} · {role === "superadmin" ? "Superadmin" : "Ventas y soporte"}</span>
          <button
            className="btn-ghost min-h-9 px-3 text-sm"
            onClick={async () => {
              await logout();
              router.replace("/entrar");
            }}
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
