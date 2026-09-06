// Generates /robots.txt — allows crawlers and points them to the sitemap.
import { getSiteUrl } from "@/lib/site";

export default function robots() {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Don't waste crawl budget on API routes.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
