import { createFileRoute } from "@tanstack/react-router";
import { TERMS } from "@/lib/dictionary";
import { slugOf } from "@/lib/dictionary-examples";
import { SITE_URL } from "@/lib/seo";

const PAGES = ["/", "/thesis", "/find", "/tracker", "/dictionary", "/learn", "/interview", "/employers", "/insights", "/privacy"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const urls = [...PAGES, ...TERMS.map((t) => `/dictionary/${slugOf(t.term)}`)];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join("\n")}\n</urlset>\n`;
        return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
      },
    },
  },
});
