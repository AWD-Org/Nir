export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-busy="true" aria-label="Cargando">
      <div className="skeleton h-9 w-56" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
      <div className="skeleton h-64" />
      <div className="skeleton h-40" />
    </div>
  );
}
