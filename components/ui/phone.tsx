/** Marco de teléfono para la vista previa en vivo (elemento firma de Nir). */
export function Phone({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-[300px] rounded-[2.5rem] border border-line-2 bg-ink p-2.5 shadow-[0_24px_60px_-20px_rgba(18,18,20,0.45)] ${className}`}>
      <div className="relative h-[600px] overflow-hidden rounded-[2rem] bg-white">
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" aria-hidden />
        <div className="h-full overflow-y-auto [scrollbar-width:none] [&_.min-h-dvh]:min-h-full">{children}</div>
      </div>
    </div>
  );
}
