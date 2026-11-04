/** Grano fotográfico sobre el fondo oscuro (SVG, sin imágenes). */
export function Grain({ className = "" }: { className?: string }) {
  return (
    <svg className={`pointer-events-none absolute inset-0 h-full w-full opacity-[0.07] mix-blend-overlay ${className}`} aria-hidden>
      <filter id="nir-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#nir-grain)" />
    </svg>
  );
}
