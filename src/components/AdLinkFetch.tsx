import { useEffect, useRef, useState } from "react";
import { fetchAd } from "@/lib/fetch-ad.functions";

const BLOCKED = "This site blocks automatic reading. Select the ad text and use the Meriterande bookmarklet, or copy and paste it here.";

export function AdLinkFetch({ onText, autoUrl, autoFetch = true }: { onText: (t: string) => void; autoUrl?: string | undefined; autoFetch?: boolean }) {
  const [url, setUrl] = useState("");
  const done = useRef("");
  useEffect(() => {
    if (!autoUrl || done.current === autoUrl) return;
    done.current = autoUrl;
    setUrl(autoUrl);
    if (autoFetch) void go(autoUrl);
  }, [autoUrl, autoFetch]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(u = url) {
    if (!u.trim()) return;
    setBusy(true); setError(null);
    try {
      const r = await fetchAd({ data: { url: u } });
      if (r.ok) onText(r.text); else setError(r.error);
    } catch { setError(BLOCKED); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-foreground">Or paste a job ad link</span>
      <div className="flex gap-2">
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="https://arbetsformedlingen.se/platsbanken/annonser/..."
          className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-[15px] text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15" />
        <button type="button" onClick={() => go()} disabled={busy || !url.trim()}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground transition hover:opacity-90 disabled:opacity-60">
          {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />}
          {busy ? "Fetching..." : "Fetch"}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
