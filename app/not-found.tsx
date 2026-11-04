import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="num text-sm text-ink-2">404</p>
      <h1 className="mt-2 text-2xl font-semibold">No encontramos esta página</h1>
      <p className="mt-2 max-w-sm text-ink-2">Revisa la dirección o vuelve al inicio.</p>
      <Link href="/" className="btn-secondary mt-6">
        Ir al inicio
      </Link>
    </main>
  );
}
