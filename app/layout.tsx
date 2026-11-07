import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

const site = process.env.NEXT_PUBLIC_PUBLIC_URL || "https://amoxtli-nir.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Nir — Tarjetas NFC con carta digital para restaurantes y bares",
    template: "%s · Nir",
  },
  description:
    "Una tarjeta NFC en cada mesa abre tu carta, tus reseñas de Google, tus redes y el Wi-Fi. Tú cambias precios y agotados desde el celular. Un producto de AMOXTLI®.",
  applicationName: "AMOXTLI Nir",
  alternates: { canonical: "/", languages: { "es-MX": "/" } },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "AMOXTLI Nir",
    locale: "es_MX",
    title: "Nir — Tu carta, tus reseñas y tu Wi-Fi a un toque",
    description: "Tarjetas NFC por mesa con carta digital editable para restaurantes, bares y cafeterías.",
  },
  twitter: { card: "summary_large_image" },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#121214",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
