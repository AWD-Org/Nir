// Transición de entrada al cambiar de sección (CSS, sin JavaScript extra).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="anim-rise">{children}</div>;
}
