import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Copy, Building2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/landing";
import { reviewEmployerAd, type AdReview } from "@/lib/tools.functions";
import { SAMPLE_AD } from "@/lib/sample-ad";

const T = "For employers: is your job ad scaring off international talent? — Meriterande";
const D = "Paste your job ad and get a clarity score, unclear or exclusionary phrases with rewrites, a language-requirement check and a clearer version.";
export const Route = createFileRoute("/employers")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Employers,
});

function Highlighted({ ad, issues }: { ad: string; issues: AdReview["issues"] }) {
  const parts: { t: string; i?: number }[] = [];
  const hits = issues.map((x, i) => ({ i, at: ad.indexOf(x.phrase), len: x.phrase.length })).filter((h) => h.at >= 0).sort((a, b) => a.at - b.at);
  let pos = 0;
  for (const h of hits) { if (h.at < pos) continue; parts.push({ t: ad.slice(pos, h.at) }, { t: ad.slice(h.at, h.at + h.len), i: h.i }); pos = h.at + h.len; }
  parts.push({ t: ad.slice(pos) });
  return (
    <div className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-background/70 p-4 text-[15px] leading-relaxed">
      {parts.map((p, k) => p.i === undefined ? <span key={k}>{p.t}</span> :
        <mark key={k} title={issues[p.i]?.problem} className="rounded bg-warning/25 px-0.5 text-foreground">{p.t}<sup className="ms-0.5 font-bold text-warning">{p.i + 1}</sup></mark>)}
    </div>
  );
}

function Employers() {
  const [ad, setAd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<AdReview | null>(null);
  const [reviewed, setReviewed] = useState("");
  const [copied, setCopied] = useState(false);

  async function go() {
    setBusy(true); setErr(null); setRes(null);
    try {
      const r = await reviewEmployerAd({ data: { ad } });
      if (r.ok) { setRes(r.result); setReviewed(ad); } else setErr(r.error);
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong. Please try again."); } finally { setBusy(false); }
  }
  const tone = res && (res.language.verdict === "Clearly justified" || res.language.verdict === "No language requirement") ? "bg-success/15 text-success" : res?.language.verdict === "Unclear" ? "bg-accent text-accent-foreground" : "bg-destructive/12 text-destructive";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative isolate overflow-hidden">
        <div className="mesh pointer-events-none absolute -inset-20 -z-10 opacity-70" />
        <div className="mx-auto max-w-3xl px-5 pb-8 pt-14 text-center sm:pt-20">
          <p className="glass mx-auto mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"><Building2 className="h-4 w-4 text-primary" /> For employers</p>
          <h1 className="text-5xl leading-none text-foreground sm:text-7xl">Is your job ad scaring off <em className="text-primary">international talent?</em></h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">Get a clarity score, flagged phrases with rewrites, a language-requirement check and a clearer version of your ad.</p>
        </div>
      </section>
      <main className="mx-auto max-w-3xl space-y-5 px-4 pb-16">
        <div className="glass space-y-4 rounded-3xl p-6 sm:p-8">
          <textarea value={ad} onChange={(e) => setAd(e.target.value)} rows={10} placeholder="Paste your job ad (Swedish or English)..." aria-label="Your job ad"
            className="w-full rounded-2xl border border-input bg-background/70 p-4 text-[16px] leading-relaxed outline-none focus:border-ring focus:ring-4 focus:ring-ring/15" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={go} disabled={busy || ad.trim().length < 80} className="h-14 rounded-full bg-primary px-9 font-semibold text-primary-foreground shadow-lift disabled:opacity-60">{busy ? "Reviewing..." : "Review my ad"}</button>
            <button onClick={() => setAd(SAMPLE_AD)} className="h-14 rounded-full bg-accent px-7 font-semibold text-accent-foreground">Try an example</button>
          </div>
        </div>
        {busy && <div className="glass space-y-3 rounded-3xl p-6"><div className="skeleton h-10 w-24 rounded-full" /><div className="skeleton h-4 w-full rounded-full" /><div className="skeleton h-4 w-3/4 rounded-full" /></div>}
        {err && <p role="alert" className="rounded-3xl bg-destructive/10 p-5 text-destructive">{err}</p>}
        {res && (
          <motion.div initial="h" animate="s" variants={{ h: {}, s: { transition: { staggerChildren: 0.08 } } }} className="space-y-5">
            {[
              <div key="a" className="glass flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center">
                <p className="text-7xl text-primary" style={{ fontFamily: "var(--font-display)" }}>{res.score}<span className="text-2xl text-muted-foreground">/100</span></p>
                <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Ad clarity score</p><p className="mt-1">{res.summary}</p></div>
              </div>,
              <div key="b" className="glass rounded-3xl p-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Language requirement</p>
                <span className={`inline-block rounded-full px-4 py-1.5 text-xl ${tone}`} style={{ fontFamily: "var(--font-display)" }}>{res.language.verdict}</span>
                <p className="mt-2 text-muted-foreground">{res.language.reason}</p>
              </div>,
              <div key="c" className="glass rounded-3xl p-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Unclear or exclusionary phrases ({res.issues.length})</p>
                <Highlighted ad={reviewed} issues={res.issues} />
                <ol className="mt-4 space-y-3">
                  {res.issues.map((x, i) => (
                    <li key={i} className="rounded-2xl border border-border p-4">
                      <p className="font-semibold"><span className="text-warning">{i + 1}.</span> “{x.phrase}”</p>
                      <p className="mt-1 text-sm text-muted-foreground">{x.problem}</p>
                      <p className="mt-2 text-sm"><strong className="text-success">Try: </strong>{x.rewrite}</p>
                    </li>
                  ))}
                  {res.issues.length === 0 && <p className="text-muted-foreground">No problem phrases found.</p>}
                </ol>
              </div>,
              <div key="d" className="glass rounded-3xl p-6">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Clearer version</p>
                  <button onClick={async () => { await navigator.clipboard.writeText(res.rewritten); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="glass inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"><Copy className="h-4 w-4" />{copied ? "Copied ✓" : "Copy"}</button>
                </div>
                <div className="whitespace-pre-wrap rounded-2xl bg-background/70 p-4 leading-relaxed">{res.rewritten}</div>
              </div>,
            ].map((el, k) => <motion.div key={k} variants={{ h: { opacity: 0, y: 18 }, s: { opacity: 1, y: 0 } }}>{el}</motion.div>)}
          </motion.div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
