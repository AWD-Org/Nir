import { contrast, isHex, readableOn } from "@/lib/domain/contrast";
import type { TemplateId, TenantTheme } from "@/lib/domain/types";

export interface TemplateDef {
  id: TemplateId;
  name: string;
  description: string;
  defaults: { primaryColor: string; accentColor: string };
  displayFont: string;
  bodyFont: string;
  radius: string;
  uppercaseDisplay: boolean;
}

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  noche: {
    id: "noche",
    name: "Noche",
    description: "Fondo oscuro con tu color; para bares y cantinas.",
    defaults: { primaryColor: "#14161A", accentColor: "#E8B83A" },
    displayFont: "'Big Shoulders Display', 'Arial Narrow', sans-serif",
    bodyFont: "'Instrument Sans Variable', system-ui, sans-serif",
    radius: "0px",
    uppercaseDisplay: true,
  },
  mercado: {
    id: "mercado",
    name: "Mercado",
    description: "Papel cálido con banda de color; para fondas, cocinas y cafeterías.",
    defaults: { primaryColor: "#7A2E1F", accentColor: "#7A2E1F" },
    displayFont: "'Young Serif', Georgia, serif",
    bodyFont: "'Instrument Sans Variable', system-ui, sans-serif",
    radius: "999px",
    uppercaseDisplay: false,
  },
  claro: {
    id: "claro",
    name: "Claro",
    description: "Blanco y limpio, botones con borde de tu color; para cafés y brunch.",
    defaults: { primaryColor: "#1F4D3A", accentColor: "#C2410C" },
    displayFont: "'Schibsted Grotesk Variable', system-ui, sans-serif",
    bodyFont: "'Schibsted Grotesk Variable', system-ui, sans-serif",
    radius: "14px",
    uppercaseDisplay: false,
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);

const MERCADO_PAPER = "#F6F1E7";

export interface ResolvedTheme {
  template: TemplateDef;
  bg: string;
  text: string;
  muted: string;
  surface: string;
  line: string;
  headerBg: string;
  headerText: string;
  buttonBg: string;
  buttonText: string;
  buttonBorder: string;
  accent: string;
}

/** Convierte la elección del dueño en colores concretos para la página pública. */
export function resolveTheme(theme: TenantTheme): ResolvedTheme {
  const template = TEMPLATES[theme.templateId] ?? TEMPLATES.claro;
  const p = isHex(theme.primaryColor) ? theme.primaryColor : template.defaults.primaryColor;
  const a = isHex(theme.accentColor) ? theme.accentColor : template.defaults.accentColor;
  if (template.id === "noche") {
    const text = readableOn(p);
    const dark = text === "#FFFFFF";
    return {
      template,
      bg: p,
      text,
      muted: dark ? "rgba(255,255,255,0.72)" : "rgba(17,17,17,0.72)",
      surface: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      line: dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)",
      headerBg: p,
      headerText: text,
      buttonBg: a,
      buttonText: readableOn(a),
      buttonBorder: a,
      accent: a,
    };
  }
  if (template.id === "mercado") {
    return {
      template,
      bg: MERCADO_PAPER,
      text: "#211A14",
      muted: "#5E5248",
      surface: "#FFFDF8",
      line: "#E2D8C6",
      headerBg: p,
      headerText: readableOn(p),
      buttonBg: p,
      buttonText: readableOn(p),
      buttonBorder: p,
      accent: a,
    };
  }
  return {
    template,
    bg: "#FFFFFF",
    text: "#141414",
    muted: "#5C5C5C",
    surface: "#F7F7F5",
    line: "#E6E6E3",
    headerBg: "#FFFFFF",
    headerText: "#141414",
    buttonBg: "#FFFFFF",
    buttonText: p,
    buttonBorder: p,
    accent: a,
  };
}

/** Combinaciones bloqueadas por falta de contraste (RF15). Lista vacía = se puede guardar. */
export function themeIssues(theme: TenantTheme): string[] {
  const issues: string[] = [];
  if (!isHex(theme.primaryColor) || !isHex(theme.accentColor)) {
    return ["Usa colores en formato #RRGGBB."];
  }
  const r = resolveTheme(theme);
  if (theme.templateId === "noche") {
    if (contrast(r.buttonBg, r.bg) < 3) {
      issues.push("El acento casi no se distingue del fondo. Elige un acento más claro o un fondo más oscuro.");
    }
  }
  if (theme.templateId === "mercado") {
    if (contrast(r.accent, r.bg) < 4.5) {
      issues.push("El acento no se lee sobre el papel de la plantilla. Usa un tono más oscuro para los precios.");
    }
  }
  if (theme.templateId === "claro") {
    if (contrast(r.buttonText, r.bg) < 4.5) {
      issues.push("El color principal no se lee sobre blanco. Usa un tono más oscuro.");
    }
    if (contrast(r.accent, r.bg) < 4.5) {
      issues.push("El acento no se lee sobre blanco. Usa un tono más oscuro.");
    }
  }
  return issues;
}
