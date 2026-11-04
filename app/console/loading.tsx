export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Cargando">
      <div className="skeleton h-9 w-48" />
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="skeleton h-[420px]" />
    </div>
  );
}
