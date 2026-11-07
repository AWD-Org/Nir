// Grano fotográfico sobre el fondo oscuro: un mosaico pequeño que el navegador rasteriza una sola vez.
// Sin mezcla de capas, para que no se recalcule en cada cuadro al hacer scroll.
const TILE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function Grain({ className = "" }: { className?: string }) {
  return <div className={`pointer-events-none absolute inset-0 opacity-[0.05] ${className}`} style={{ backgroundImage: TILE, backgroundSize: "160px 160px" }} aria-hidden />;
}
