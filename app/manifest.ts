import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AMOXTLI Nir",
    short_name: "Nir",
    description: "Administra tu carta, tus enlaces y tus tarjetas Nir.",
    start_url: "/admin",
    display: "standalone",
    background_color: "#F4F4F6",
    theme_color: "#121214",
    lang: "es-MX",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
