/** Fotos de muestra dibujadas (plato visto desde arriba) para comparar estilos de carta sin fotos reales. */
const PALETTES: Record<string, [string, string, string, string]> = {
  guac: ["#6E4A2F", "#8DB255", "#C9DD8A", "#E9C46A"],
  tinga: ["#3B2A22", "#C2562E", "#F2E3C6", "#7FA65A"],
  queso: ["#4A3424", "#E2A33B", "#F5D58B", "#8A4F1E"],
  mezcal: ["#1E2328", "#DCE3E8", "#A9C1CF", "#E07A2E"],
  jamaica: ["#2D2420", "#9E1B32", "#E25C6E", "#F4D9DE"],
  pan: ["#5B3B26", "#D99A4E", "#F3D19C", "#6B3E21"],
};

export function demoPhoto(id: string): string {
  const [table, food, light, garnish] = PALETTES[id] ?? PALETTES.guac;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'>
<defs><radialGradient id='l' cx='35%' cy='30%' r='80%'><stop offset='0' stop-color='white' stop-opacity='.18'/><stop offset='1' stop-color='black' stop-opacity='.35'/></radialGradient>
<radialGradient id='f' cx='45%' cy='40%'><stop offset='0' stop-color='${light}'/><stop offset='1' stop-color='${food}'/></radialGradient></defs>
<rect width='400' height='300' fill='${table}'/>
<path d='M0 70 L400 40 M0 150 L400 120 M0 230 L400 200' stroke='white' stroke-opacity='.05' stroke-width='18'/>
<ellipse cx='205' cy='162' rx='132' ry='128' fill='black' opacity='.35'/>
<circle cx='200' cy='150' r='125' fill='#F7F3EC'/><circle cx='200' cy='150' r='98' fill='#EFE9DF'/>
<circle cx='200' cy='150' r='72' fill='url(#f)'/>
<circle cx='176' cy='128' r='11' fill='${garnish}'/><circle cx='228' cy='170' r='9' fill='${garnish}'/><circle cx='222' cy='122' r='6' fill='${garnish}' opacity='.8'/>
<circle cx='182' cy='176' r='7' fill='${light}' opacity='.9'/>
<rect width='400' height='300' fill='url(#l)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
