export function Unavailable({ name }: { name?: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#F7F7F5] px-6 text-center text-[#141414]">
      <div className="max-w-sm">
        <svg viewBox="0 0 48 48" className="mx-auto mb-6 h-12 w-12 text-[#8A8A8A]" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M14 34a14 14 0 0 1 0-20M34 14a14 14 0 0 1 0 20M20 28a6 6 0 0 1 0-8M28 20a6 6 0 0 1 0 8" />
          <path d="M8 40 40 8" />
        </svg>
        <h1 className="text-2xl font-semibold">Menú no disponible</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[#5C5C5C]">
          {name ? `La página de ${name} no está disponible en este momento.` : "Esta página no está disponible en este momento."}{" "}
          Pide la carta a quien te atiende.
        </p>
      </div>
    </main>
  );
}
