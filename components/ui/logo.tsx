import Link from "next/link";

/** Marca de Nir: ondas de cercanía (NFC) en rosa AMOXTLI® + palabra "nir". */
export function NirMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
      <rect width="32" height="32" rx="8" fill="#FA1F6F" />
      <circle cx="11" cy="16" r="2.6" fill="#fff" />
      <path d="M16 10.5a7.8 7.8 0 0 1 0 11M20.5 7a12.6 12.6 0 0 1 0 18" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/", sub }: { href?: string; sub?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2" aria-label="Nir, inicio">
      <NirMark />
      <span className="text-[20px] font-semibold tracking-tight">nir</span>
      {sub && <span className="ml-1 rounded-md bg-ink px-1.5 py-0.5 text-[12px] font-medium text-white">{sub}</span>}
    </Link>
  );
}
