// Provisional: mientras nir.amoxtli.tech no apunte a Netlify, los enlaces y QR usan la dirección de Netlify,
// que sí abre. Cuando el dominio funcione, se define NEXT_PUBLIC_PUBLIC_URL=https://nir.amoxtli.tech en Netlify.
export const SITE_URL = (process.env.NEXT_PUBLIC_PUBLIC_URL || "https://amoxtli-nir.netlify.app").replace(/\/$/, "");
const SALES = process.env.NEXT_PUBLIC_SALES_WHATSAPP || "5215500000000";

/** "Pide tu kit Nir" → WhatsApp de ventas con mensaje prellenado (RF01, RF21). */
export function kitWhatsappUrl(business?: string) {
  const text = business
    ? `Hola, quiero el kit de tarjetas Nir para ${business}.`
    : "Hola, quiero información del kit de tarjetas Nir para mi negocio.";
  return `https://wa.me/${SALES}?text=${encodeURIComponent(text)}`;
}

export const publicUrl = (slug: string) => `${SITE_URL}/${slug}`;
