import { createFileRoute } from "@tanstack/react-router";
import { OG_IMAGE } from "@/lib/seo";
import { AdLinkFetch } from "@/components/AdLinkFetch";
import { useEffect, useState } from "react";
import { decodeAd, LANGS, COUNTRIES, countryOf, type DecodeResult } from "@/lib/decode.functions";
import { addJob } from "@/lib/tracker";
import { takePendingAd } from "@/lib/ad-store";
import { Link } from "@tanstack/react-router";
import { addRecentAd } from "@/lib/recent-ads";
import { AdPicker } from "@/components/AdPicker";
import { setLastSwedishVerdict } from "@/lib/interview-store";
import { LongProgress, TaskError, withDeadline } from "@/components/LongTask";
import { recommendAd, type CompareResult } from "@/lib/compare.functions";
import { CompareTable } from "@/components/CompareTable";
import { HighlightedAd } from "@/components/HighlightedAd";
import { downloadShareImage } from "@/components/share-image";
import { track } from "@/lib/analytics.functions";
import { SAMPLE_AD } from "@/lib/sample-ad";
import { CloseTheGap } from "@/components/CloseTheGap";
import { CvUpload } from "@/components/CvUpload";
import { useCvText } from "@/lib/cv-store";
import { motion, AnimatePresence } from "motion/react";
import { SiteHeader, Hero, HowItWorks, CareerCentres, SiteFooter } from "@/components/landing";
import { CoverLetter } from "@/components/CoverLetter";
import { SuccessStories } from "@/components/SuccessStories";
import { recordInsight } from "@/lib/sync";
import { addSeenPhrases } from "@/lib/progress";
import { BarChart3, GraduationCap } from "lucide-react";

const TITLE = "Meriterande — Decode job ads, close the gap";
const DESC = "Know what's required, what's 'meriterande', and whether you actually need Swedish. A job-ad decoder for international job seekers in Sweden.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" }, { property: "og:image", content: OG_IMAGE }, { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const LOADING = [
  "Translating Swedish bureaucracy...",
  "Looking up what 'meriterande' really means...",
  "Brewing a fika while we read...",
  "Separating krav from önskemål...",
  "Checking if you need a B-körkort...",
  "Reading between the lagom lines...",
];

// Official national statistics offices only — the app never generates salary numbers.
export const SALARY_SOURCES: Record<string, { name: string; url: string }> = {
  Sweden: { name: "Statistics Sweden (SCB Lönesök)", url: "https://www.scb.se/hitta-statistik/sverige-i-siffror/lonesok/" },
  Norway: { name: "Statistics Norway (SSB)", url: "https://www.ssb.no/en/arbeid-og-lonn/lonn-og-arbeidskraftkostnader/statistikk/lonn" },
  Denmark: { name: "Statistics Denmark (Danmarks Statistik)", url: "https://www.dst.dk/en/Statistik/emner/arbejde-og-indkomst/indkomst-og-loen/loen" },
  Finland: { name: "Statistics Finland", url: "https://stat.fi/en/statistics/pra" },
  Germany: { name: "the Federal Statistical Office (Destatis)", url: "https://www.destatis.de/EN/Themes/Labour/Earnings/_node.html" },
  Netherlands: { name: "Statistics Netherlands (CBS)", url: "https://www.cbs.nl/en-gb/labour-and-income" },
};

function Index() {
  const [ad, setAd] = useState("");
  const [cv, setCv] = useCvText();
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<string>("English");
  const [roast, setRoast] = useState(false);
  const [country, setCountry] = useState("Sweden");
  const [savedId, setSavedId] = useState<string | null>(null);
  const cInfo = countryOf(country);
  const [incoming, setIncoming] = useState<{ url?: string | undefined; text?: boolean }>({});

  useEffect(() => {
    const pend = takePendingAd();
    if (pend) { setAd(pend); return; }
    const sp = new URLSearchParams(window.location.search);
    const url = sp.get("url") ?? undefined, text = sp.get("text") ?? "";
    if (!url && !text) return;
    if (text) setAd(text);
    setIncoming({ url, text: !!text });
    window.history.replaceState(null, "", "/#decode");
    setTimeout(() => document.getElementById("decode")?.scrollIntoView({ behavior: "smooth" }), 300);
  }, []);
  const [compare, setCompare] = useState(false);
  const [decodedAd, setDecodedAd] = useState("");
  const [cStep, setCStep] = useState<{ step: number; done: number; total: number } | null>(null);
  const [extraAds, setExtraAds] = useState<string[]>(["", ""]);
  const [compareRes, setCompareRes] = useState<DecodeResult[] | null>(null);
  const [rec, setRec] = useState<CompareResult | null>(null);
  const [used, setUsed] = useState({ lang: "English", roast: false, country: "Sweden" });
  const rtl = used.lang === "Arabic" || used.lang === "Persian";

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  async function onDecode() {
    if (compare) return onCompare();
    if (ad.trim().length < 30) {
      setError("Please paste a job ad first (or try the example).");
      return;
    }
    setError(null);
    setResult(null);
    setCompareRes(null);
    setLoading(true);
    setMsgIdx(0);
    try {
      track("decode_started");
      const r = await decodeAd({ data: { ad, cv, lang, roast, country } });
      if (r.ok) {
        track("decode_completed");
        setUsed({ lang, roast, country });
        setResult(r.result);
        setDecodedAd(ad);
        addRecentAd({ title: r.result.job_title || "Untitled role", company: r.result.company || "", text: ad });
        setLastSwedishVerdict(country === "Sweden" ? r.result.swedish.verdict : "");
        setSavedId(null);
        if (country === "Sweden") addSeenPhrases(r.result.hidden_signals.map((h) => h.phrase));
        if (r.result.fit) void recordInsight(r.result.job_title, r.result.fit.score, r.result.fit.gaps);
        setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
      } else setError(r.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onCompare() {
    const ads = [ad, ...extraAds].map((x) => x.trim()).filter((x) => x.length >= 30);
    if (ads.length < 2) { setError("Paste at least two job ads to compare."); return; }
    if (cv.trim().length < 30) { setError("Add your CV so each ad can be scored against it."); return; }
    setError(null); setResult(null); setCompareRes(null); setRec(null); setLoading(true); setMsgIdx(0);
    try {
      setCStep({ step: 0, done: 0, total: ads.length });
      const rs = await withDeadline(Promise.all(ads.map((a) => decodeAd({ data: { ad: a, cv, lang, roast, country } }).then((r) => {
        setCStep((c) => c && { ...c, done: c.done + 1 }); return r;
      }))));
      const bad = rs.find((r) => !r.ok);
      if (bad && !bad.ok) { setError(bad.error); return; }
      const results = rs.map((r) => (r as { ok: true; result: DecodeResult }).result);
      setUsed({ lang, roast, country });
      setCompareRes(results);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
      setCStep((c) => c && { ...c, step: 1 });
      const rr = await withDeadline(recommendAd({ data: { lang, roast, rows: results.map((r, i) => ({
        label: `Ad ${i + 1}`, summary: r.role_summary, score: r.fit?.score ?? 0, swedish: r.swedish.verdict,
        met: r.fit?.must_haves_met ?? 0, total: r.must_haves.length, time: r.fit?.time_to_close ?? "", gaps: r.fit?.gaps ?? [],
      })) } }));
      if (rr.ok) setRec(rr.result); else setError(rr.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false); setCStep(null);
    }
  }

  async function onCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(toSummary(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero adj={cInfo.adj} country={cInfo.name} />
      <HowItWorks />
      <main id="decode" className="mx-auto max-w-3xl scroll-mt-24 px-4 pb-20 sm:px-5">
        <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="glass space-y-6 rounded-3xl p-5 sm:p-8">
          <div>
            <h2 className="text-3xl text-foreground sm:text-4xl">Decode a job ad</h2>
            <p className="mt-1 text-muted-foreground">Paste it, drop a link, or try the example.</p>
          </div>
          <AdLinkFetch autoUrl={incoming.url} autoFetch={!incoming.text} onText={(t) => { setAd(t); setError(null); }} />
          <Field label={compare ? "Job ad 1" : "Paste the job ad (Swedish or English)"} required value={ad} onChange={setAd} rows={9}
            placeholder="Vi söker en Data Engineer till vårt team i Stockholm..." />
          {!compare && country === "Sweden" && <HighlightedAd text={ad} />}
          {compare && (
            <AdPicker onPick={(text) => {
              const slots = [ad, ...extraAds];
              const free = slots.findIndex((x) => x.trim().length < 30);
              const i = free === -1 ? slots.length - 1 : free;
              if (i === 0) setAd(text); else setExtraAds(extraAds.map((y, j) => (j === i - 1 ? text : y)));
              setError(null);
            }} />
          )}
          {compare && extraAds.map((x, i) => (
            <Field key={i} label={`Job ad ${i + 2}${i === 1 ? " (optional)" : ""}`} required={i === 0} value={x} rows={6}
              onChange={(v) => setExtraAds(extraAds.map((y, j) => (j === i ? v : y)))} placeholder="Paste another job ad..." />
          ))}
          <div>
            <CvUpload onText={setCv} />
            <Field label="Paste your CV (optional, for a fit score)" value={cv} onChange={setCv} rows={5}
              placeholder="Your experience, skills, education..." />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="glass flex h-12 items-center gap-2 rounded-full ps-4 pe-2 text-sm font-semibold text-foreground">
              <span className="text-muted-foreground">Explain in</span>
              <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Explanation language"
                className="h-9 rounded-full bg-transparent pe-1 font-semibold text-foreground outline-none">
                {LANGS.map((l) => <option key={l} value={l} className="bg-popover text-popover-foreground">{l}</option>)}
              </select>
            </label>
            <label className="glass flex h-12 items-center gap-2 rounded-full ps-4 pe-2 text-sm font-semibold text-foreground">
              <span className="text-muted-foreground">Job market</span>
              <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Job market country"
                className="h-9 rounded-full bg-transparent pe-1 font-semibold text-foreground outline-none">
                {COUNTRIES.map((c) => <option key={c.name} value={c.name} className="bg-popover text-popover-foreground">{c.name}</option>)}
              </select>
            </label>
            <Toggle on={roast} onChange={setRoast} label="Brutally honest 🔥" />
            <Toggle on={compare} onChange={(v) => { setCompare(v); setError(null); }} label="Compare up to 3 ads" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={onDecode} disabled={loading}
              className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 text-base font-semibold text-primary-foreground shadow-lift transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60">
              {loading ? "Decoding..." : compare ? "Decode & compare" : "Decode"}
            </button>
            <button onClick={() => { setAd(SAMPLE_AD); setError(null); }} disabled={loading}
              className="inline-flex h-14 items-center justify-center rounded-full bg-accent px-7 text-base font-semibold text-accent-foreground transition hover:-translate-y-0.5 disabled:opacity-60">
              Try an example
            </button>
          </div>
        </motion.section>

        {loading && cStep && (
          <div className="mt-10">
            <LongProgress step={cStep.step} expected="30–60 seconds"
              steps={[`Decoding ads (${cStep.done}/${cStep.total})`, "Comparing and picking the best"]} />
          </div>
        )}
        {loading && <LoadingSkeleton msg={LOADING[msgIdx] ?? ""} msgKey={msgIdx} />}

        {error && !loading && compare ? (
          <div className="mt-10"><TaskError message={error} onRetry={onDecode} /></div>
        ) : error && (
          <motion.div role="alert" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-10 rounded-3xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">
            {error}
          </motion.div>
        )}

        {compareRes && (
          <motion.section id="results" dir={rtl ? "rtl" : "ltr"} className="mt-14 scroll-mt-24 space-y-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-4xl text-foreground">Compared</h2>
            <CompareTable results={compareRes} rec={rec} langName={countryOf(used.country).lang} />
          </motion.section>
        )}

        {result && (
          <motion.section id="results" dir={rtl ? "rtl" : "ltr"} className="mt-14 scroll-mt-24 space-y-5" initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}>
            <Item className="flex items-center justify-between gap-3">
              <h2 className="text-4xl text-foreground">Decoded</h2>
              <div className="flex flex-wrap gap-2">
                {savedId ? (
                  <Link to="/tracker" className="inline-flex h-11 items-center rounded-full bg-success/15 px-5 text-sm font-semibold text-success">Saved ✓ View tracker</Link>
                ) : (
                  <button onClick={() => setSavedId(addJob({ title: result.job_title || "Untitled role", company: result.company || "not specified", score: result.fit?.score ?? null, verdict: `${countryOf(used.country).lang}: ${result.swedish.verdict}`, adText: decodedAd }).id)}
                    className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:-translate-y-0.5">
                    Save to tracker
                  </button>
                )}
                <button onClick={() => { track("share_card_downloaded"); void downloadShareImage(result, rtl); }}
                  className="glass h-11 rounded-full px-5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5">
                  Share image
                </button>
                <button onClick={onCopy}
                  className="glass h-11 rounded-full px-5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5">
                  {copied ? "Copied ✓" : "Copy summary"}
                </button>
              </div>
            </Item>

            {result.roast && (
              <Item>
                <div className="rounded-3xl bg-accent p-6 text-accent-foreground shadow-soft sm:p-7">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em]">Roast card 🔥</p>
                  <p className="text-2xl leading-snug" style={{ fontFamily: "var(--font-display)" }}>{result.roast}</p>
                </div>
              </Item>
            )}
            {result.fit && <Item><FitCard fit={result.fit} /></Item>}
            {result.fit && cv.trim() && (
              <Item><CloseTheGap ad={ad} cv={cv} score={result.fit.score} gaps={result.fit.gaps} lang={used.lang} roast={used.roast} country={used.country} /></Item>
            )}

            {result.fit && cv.trim() && (
              <Item><CoverLetter ad={ad} cv={cv} localLang={countryOf(used.country).lang} /></Item>
            )}

            <Item><Card title="Role summary"><p className="text-[17px] leading-relaxed">{result.role_summary}</p></Card></Item>

            <Item><SwedishCard s={result.swedish} title={`${countryOf(used.country).lang} language`} /></Item>

            <Item className="grid gap-5 sm:grid-cols-2">
              <Card title="Must-haves"><List items={result.must_haves} dot="bg-primary" /></Card>
              <Card title="Nice-to-haves · meriterande"><List items={result.nice_to_haves} dot="bg-sun" /></Card>
            </Item>

            <Item>
              <Card title="Hidden signals">
                {result.hidden_signals.length === 0 ? (
                  <p className="text-muted-foreground">No special Swedish workplace phrases found.</p>
                ) : (
                  <dl className="space-y-4">
                    {result.hidden_signals.map((h, i) => (
                      <div key={i}>
                        <dt className="inline-block rounded-lg bg-accent px-2.5 py-0.5 text-sm font-semibold text-accent-foreground">{h.phrase}</dt>
                        <dd className="mt-1 text-muted-foreground">{h.explanation}</dd>
                        {used.country === "Sweden" && (
                          <Link to="/learn" search={{ phrase: h.phrase }} className="mt-1 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-primary">
                            <GraduationCap className="h-4 w-4" /> Mini lesson
                          </Link>
                        )}
                      </div>
                    ))}
                  </dl>
                )}
              </Card>
            </Item>

            {SALARY_SOURCES[used.country] && (
              <Item>
                <a href={SALARY_SOURCES[used.country]!.url} target="_blank" rel="noopener noreferrer"
                  className="glass lift flex items-center gap-4 rounded-3xl p-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sun/25 text-foreground"><BarChart3 className="h-6 w-6" /></span>
                  <span><span className="block text-lg font-semibold text-foreground">Check salary statistics ↗</span>
                    <span className="text-sm text-muted-foreground">Official salary data from {SALARY_SOURCES[used.country]!.name}. We don't estimate salaries.</span></span>
                </a>
              </Item>
            )}
          </motion.section>
        )}
      </main>
      <CareerCentres />
      <SuccessStories />
      <SiteFooter />
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`flex h-12 items-center gap-2.5 rounded-full px-4 text-sm font-semibold transition ${on ? "bg-primary text-primary-foreground shadow-soft" : "glass text-foreground"}`}>
      <span className={`relative h-5 w-9 rounded-full transition ${on ? "bg-primary-foreground/30" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full shadow-soft transition-all ${on ? "start-[18px] bg-primary-foreground" : "start-0.5 bg-muted-foreground"}`} />
      </span>
      {label}
    </button>
  );
}

function Item({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] } } }}>
      {children}
    </motion.div>
  );
}

function LoadingSkeleton({ msg, msgKey }: { msg: string; msgKey: number }) {
  return (
    <div className="mt-10 space-y-4" aria-live="polite">
      <div className="glass flex items-center gap-4 rounded-3xl p-5">
        <span className="relative grid h-10 w-10 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <span className="h-3 w-3 rounded-full bg-primary" />
        </span>
        <AnimatePresence mode="wait">
          <motion.span key={msgKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
            className="font-medium text-foreground">{msg}</motion.span>
        </AnimatePresence>
      </div>
      <div className="glass rounded-3xl p-6">
        <div className="skeleton h-3 w-24 rounded-full" />
        <div className="mt-4 space-y-2.5"><div className="skeleton h-4 w-full rounded-full" /><div className="skeleton h-4 w-11/12 rounded-full" /><div className="skeleton h-4 w-2/3 rounded-full" /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((k) => (
          <div key={k} className="glass rounded-3xl p-6">
            <div className="skeleton h-3 w-20 rounded-full" />
            <div className="mt-4 space-y-2.5"><div className="skeleton h-4 w-full rounded-full" /><div className="skeleton h-4 w-4/5 rounded-full" /><div className="skeleton h-4 w-3/5 rounded-full" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field(p: { label: string; value: string; onChange: (v: string) => void; rows: number; placeholder: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-foreground">
        {p.label}{p.required && <span className="text-primary"> *</span>}
      </span>
      <textarea value={p.value} onChange={(e) => p.onChange(e.target.value)} rows={p.rows} placeholder={p.placeholder}
        className="w-full resize-y rounded-2xl border border-input bg-background/70 p-4 text-[16px] leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:bg-background focus:ring-4 focus:ring-ring/15" />
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass lift h-full rounded-3xl p-6 sm:p-7">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground" style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.14em" }}>{title}</h3>
      {children}
    </div>
  );
}

function List({ items, dot }: { items: string[]; dot: string }) {
  if (!items.length) return <p className="text-muted-foreground">Not specified</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3"><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} /><span>{t}</span></li>
      ))}
    </ul>
  );
}

function SwedishCard({ s, title = "Swedish language" }: { s: DecodeResult["swedish"]; title?: string }) {
  const tone = s.verdict === "Required" ? "bg-destructive/12 text-destructive"
    : s.verdict === "Very likely required" ? "bg-destructive/12 text-destructive"
    : s.verdict === "Helpful" ? "bg-accent text-accent-foreground"
    : s.verdict === "Not needed" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground";
  return (
    <Card title={title}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className={`w-fit rounded-full px-5 py-2 text-2xl ${tone}`} style={{ fontFamily: "var(--font-display)" }}>{s.verdict}</span>
        <p className="text-muted-foreground">{s.reason}</p>
      </div>
    </Card>
  );
}

function useCountUp(target: number, ms = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function FitCard({ fit }: { fit: NonNullable<DecodeResult["fit"]> }) {
  const r = 52, c = 2 * Math.PI * r;
  const v = useCountUp(fit.score);
  const color = fit.score >= 70 ? "stroke-success" : fit.score >= 45 ? "stroke-primary" : "stroke-warning";
  useEffect(() => {
    if (fit.score < 80) return;
    const t = setTimeout(() => {
      import("canvas-confetti").then(({ default: confetti }) =>
        confetti({ particleCount: 70, spread: 70, startVelocity: 32, origin: { y: 0.45 }, scalar: 0.8, disableForReducedMotion: true }));
    }, 1300);
    return () => clearTimeout(t);
  }, [fit.score]);
  return (
    <Card title="Your fit">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="relative h-40 w-40 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={r} className="fill-none stroke-muted" strokeWidth="10" />
            <circle cx="60" cy="60" r={r} className={`fill-none ${color}`} strokeWidth="10"
              strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
          </svg>
          <div dir="ltr" className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl tabular-nums" style={{ fontFamily: "var(--font-display)" }}>{v}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="grid w-full gap-5 sm:grid-cols-2">
          <div><p className="mb-2 font-semibold text-success">Strengths</p><List items={fit.strengths} dot="bg-success" /></div>
          <div><p className="mb-2 font-semibold text-warning">Gaps</p><List items={fit.gaps} dot="bg-warning" /></div>
          <p className="rounded-2xl bg-secondary p-4 text-secondary-foreground sm:col-span-2"><strong>Angle: </strong>{fit.angle}</p>
        </div>
      </div>
    </Card>
  );
}

function toSummary(r: DecodeResult) {
  const l = (a: string[]) => (a.length ? a.map((x) => `• ${x}`).join("\n") : "• Not specified");
  let s = `ROLE\n${r.role_summary}\n\nMUST-HAVES\n${l(r.must_haves)}\n\nMERITERANDE (NICE-TO-HAVE)\n${l(r.nice_to_haves)}\n\nSWEDISH: ${r.swedish.verdict}\n${r.swedish.reason}\n\nHIDDEN SIGNALS\n${r.hidden_signals.map((h) => `• ${h.phrase}: ${h.explanation}`).join("\n") || "• None"}`;
  if (r.fit) s += `\n\nFIT SCORE: ${r.fit.score}/100\nStrengths:\n${l(r.fit.strengths)}\nGaps:\n${l(r.fit.gaps)}\nAngle: ${r.fit.angle}`;
  if (r.roast) s += `\n\nROAST 🔥\n${r.roast}`;
  return s + "\n\n— Decoded with Meriterande";
}
