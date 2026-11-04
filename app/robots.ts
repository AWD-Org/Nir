import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/domain/links";

export default function robots(): MetadataRoute.Robots {
  const preview = process.env.CONTEXT && process.env.CONTEXT !== "production"; // Deploy Previews de Netlify
  return {
    rules: preview
      ? [{ userAgent: "*", disallow: "/" }]
      : [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/console", "/img/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
