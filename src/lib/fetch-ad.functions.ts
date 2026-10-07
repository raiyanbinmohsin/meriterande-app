import { createServerFn } from "@tanstack/react-start";

const BLOCKED = "This site blocks automatic reading. Please copy and paste the ad text instead.";
const MAX = 15000;

function decodeEntities(s: string) {
  return s
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function htmlToText(html: string) {
  let h = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|svg|nav|footer|header|aside|form|iframe|template)\b[\s\S]*?<\/\1>/gi, " ");
  const main = h.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? h.match(/<article\b[\s\S]*?<\/article>/i)?.[0];
  if (main && main.length > 500) h = main;
  return decodeEntities(
    h.replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section)\b[^>]*>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "\n• ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isPrivateHost(host: string) {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  return h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") ||
    /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) ||
    h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80");
}

export const fetchAd = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => ({ url: String(d?.url ?? "").trim().slice(0, 2000) }))
  .handler(async ({ data }): Promise<{ ok: true; text: string } | { ok: false; error: string }> => {
    try {
      let url: URL;
      try { url = new URL(/^https?:\/\//i.test(data.url) ? data.url : `https://${data.url}`); }
      catch { return { ok: false, error: "That doesn't look like a valid link." }; }
      if (!/^https?:$/.test(url.protocol) || isPrivateHost(url.hostname)) return { ok: false, error: "That doesn't look like a valid link." };

      const pb = url.hostname.endsWith("arbetsformedlingen.se") && url.pathname.match(/\/platsbanken\/annonser\/(\d+)/);
      if (pb) {
        const r = await fetch(`https://jobsearch.api.jobtechdev.se/ad/${pb[1]}`, { headers: { accept: "application/json" } });
        if (!r.ok) return { ok: false, error: BLOCKED };
        const j = (await r.json()) as { headline?: string; employer?: { name?: string }; description?: { text?: string } };
        const text = [j.headline, j.employer?.name && `Employer: ${j.employer.name}`, j.description?.text].filter(Boolean).join("\n\n").trim();
        return text.length < 100 ? { ok: false, error: BLOCKED } : { ok: true, text: text.slice(0, MAX) };
      }

      const r = await fetch(url.toString(), {
        redirect: "follow",
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          accept: "text/html,application/xhtml+xml",
          "accept-language": "sv-SE,sv;q=0.9,en;q=0.8",
        },
      });
      if (!r.ok || !(r.headers.get("content-type") ?? "").includes("html")) return { ok: false, error: BLOCKED };
      const html = (await r.text()).slice(0, 2_000_000);
      const text = htmlToText(html);
      if (text.length < 300) return { ok: false, error: BLOCKED };
      return { ok: true, text: text.slice(0, MAX) };
    } catch {
      return { ok: false, error: BLOCKED };
    }
  });
