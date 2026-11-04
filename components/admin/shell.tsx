"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { BarChart3, BookOpen, ExternalLink, House, LogOut, Palette, Receipt, Eye } from "lucide-react";
import { logout } from "@/components/auth/auth-client";
import { NirMark } from "@/components/ui/logo";
import { StatusBadge } from "@/components/ui/status-badge";
import { isPublic } from "@/lib/domain/constants";
import { kitWhatsappUrl } from "@/lib/domain/links";
import type { TenantStatus } from "@/lib/domain/types";
import { exitViewAs } from "@/app/console/actions";

const NAV = [
  { href: "/admin", label: "Inicio", icon: House },
  { href: "/admin/carta", label: "Carta", icon: BookOpen },
  { href: "/admin/pagina", label: "Página", icon: Palette },
  { href: "/admin/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/admin/cuenta", label: "Cuenta", icon: Receipt },
];

export function AdminShell({
  tenant,
  readOnly,
  viewingAs,
  userEmail,
  children,
}: {
  tenant: { name: string; slug: string; status: TenantStatus };
  readOnly: boolean;
  viewingAs: boolean;
  userEmail: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  const live = isPublic(tenant.status);

  const signOut = () =>
    start(async () => {
      await logout();
      router.replace("/entrar");
      router.refresh();
    });

  return (
    <div className="min-h-dvh md:flex">
      {/* Barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <NirMark />
          <span className="text-lg font-semibold tracking-tight">nir</span>
        </div>
        <div className="px-5 pb-4">
          <p className="truncate font-semibold" title={tenant.name}>{tenant.name}</p>
          <div className="mt-1.5"><StatusBadge status={tenant.status} /></div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Secciones">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors ${
                active(href) ? "bg-paper text-ink" : "text-ink-2 hover:bg-paper hover:text-ink"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${active(href) ? "text-brand-strong" : ""}`} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line p-3">
          <Link
            href={live ? `/${tenant.slug}` : "/admin/vista-previa"}
            target="_blank"
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] text-ink-2 hover:bg-paper hover:text-ink"
          >
            {live ? <ExternalLink className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            {live ? "Ver mi página" : "Vista previa"}
          </Link>
          <button onClick={signOut} disabled={pending} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-[15px] text-ink-2 hover:bg-paper hover:text-ink">
            <LogOut className="h-[18px] w-[18px]" />
            Salir
          </button>
          <p className="truncate px-3 pt-1 text-xs text-ink-3" title={userEmail}>{userEmail}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        {/* Encabezado (móvil) */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
          <NirMark className="h-7 w-7" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight">{tenant.name}</p>
            <StatusBadge status={tenant.status} />
          </div>
          <Link href={live ? `/${tenant.slug}` : "/admin/vista-previa"} target="_blank" className="btn-secondary min-h-10 px-3 text-sm">
            {live ? "Ver página" : "Vista previa"}
          </Link>
        </header>

        {viewingAs && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-ink px-4 py-2.5 text-[15px] text-white md:px-8" role="status">
            <span>
              Viendo como <strong>{tenant.name}</strong>. Lo que cambies queda en la auditoría.
            </span>
            <form action={async () => { await exitViewAs(); router.replace("/console"); }}>
              <button className="rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25">Salir de la cuenta</button>
            </form>
          </div>
        )}
        {tenant.status === "preview" && !viewingAs && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand/20 bg-brand-tint px-4 py-3 md:px-8" role="status">
            <p className="text-[15px] text-ink">
              <strong>Tu página está en vista previa.</strong> Arma tu carta; se publica cuando instalemos tus tarjetas Nir.
            </p>
            <a href={kitWhatsappUrl(tenant.name)} target="_blank" rel="noopener" className="btn-primary min-h-10 text-sm">
              Pide tu kit Nir
            </a>
          </div>
        )}
        {readOnly && (
          <div className="border-b border-bad/20 bg-bad-tint px-4 py-3 text-[15px] text-bad md:px-8" role="status">
            <strong>Tu cuenta está {tenant.status === "cancelled" ? "cancelada" : "suspendida"}.</strong> Tu página no se muestra y el admin está en solo lectura. Registra tu pago con AMOXTLI® para reactivarla; tu información se conserva.
          </div>
        )}

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      {/* Barra inferior (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Secciones">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active(href) ? "text-brand-strong" : "text-ink-2"}`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
