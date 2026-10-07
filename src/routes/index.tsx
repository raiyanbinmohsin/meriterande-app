import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { decodeAd, type DecodeResult } from "@/lib/decode.functions";
import { SAMPLE_AD } from "@/lib/sample-ad";
import { CloseTheGap } from "@/components/CloseTheGap";

const TITLE = "Meriterande — Decode any Swedish job ad in 5 seconds";
const DESC = "Know what's required, what's 'meriterande', and whether you actually need Swedish. A job-ad decoder for international job seekers in Sweden.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
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

function Index() {
  const [ad, setAd] = useState("");
  const [cv, setCv] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  async function onDecode() {
    if (ad.trim().length < 30) {
      setError("Please paste a job ad first (or try the example).");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    setMsgIdx(0);
    try {
      const r = await decodeAd({ data: { ad, cv } });
      if (r.ok) {
        setResult(r.result);
        setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
      } else setError(r.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-14 sm:pt-24">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
          <span className="h-2.5 w-2.5 rounded-full bg-sun" />
          Meriterande
        </div>
        <h1 className="text-4xl font-semibold leading-[1.05] text-foreground sm:text-6xl">
          Decode any Swedish job ad in 5 seconds.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Know what's required, what's <em>'meriterande'</em>, and whether you actually need Swedish.
        </p>

        <section className="mt-12 space-y-5 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-7">
          <Field label="Paste the job ad (Swedish or English)" required value={ad} onChange={setAd} rows={9}
            placeholder="Vi söker en Data Engineer till vårt team i Stockholm..." />
          <Field label="Paste your CV (optional, for a fit score)" value={cv} onChange={setCv} rows={5}
            placeholder="Your experience, skills, education..." />
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={onDecode} disabled={loading}
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
              {loading ? "Decoding..." : "Decode"}
            </button>
            <button onClick={() => { setAd(SAMPLE_AD); setError(null); }} disabled={loading}
              className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60">
              Try an example
            </button>
          </div>
        </section>

        {loading && (
          <div className="mt-10 flex items-center gap-4 rounded-3xl bg-secondary p-6 text-secondary-foreground animate-fade-up">
            <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary/25 border-t-primary" />
            <span key={msgIdx} className="font-medium animate-fade-up">{LOADING[msgIdx]}</span>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-10 rounded-3xl border border-destructive/30 bg-destructive/5 p-5 text-destructive">
            {error}
          </div>
        )}

        {result && (
          <section id="results" className="mt-12 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Decoded</h2>
              <button onClick={onCopy}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary">
                {copied ? "Copied ✓" : "Copy summary"}
              </button>
            </div>

            {result.fit && <FitCard fit={result.fit} />}
            {result.fit && cv.trim() && (
              <CloseTheGap ad={ad} cv={cv} score={result.fit.score} gaps={result.fit.gaps} />
            )}

            <Card title="Role summary"><p className="leading-relaxed">{result.role_summary}</p></Card>

            <SwedishCard s={result.swedish} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Card title="Must-haves"><List items={result.must_haves} dot="bg-primary" /></Card>
              <Card title="Nice-to-haves · meriterande"><List items={result.nice_to_haves} dot="bg-sun" /></Card>
            </div>

            <Card title="Hidden signals">
              {result.hidden_signals.length === 0 ? (
                <p className="text-muted-foreground">No special Swedish workplace phrases found.</p>
              ) : (
                <dl className="space-y-4">
                  {result.hidden_signals.map((h, i) => (
                    <div key={i}>
                      <dt className="inline-block rounded-lg bg-accent px-2 py-0.5 text-sm font-semibold text-accent-foreground">{h.phrase}</dt>
                      <dd className="mt-1 text-muted-foreground">{h.explanation}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Card>
          </section>
        )}
      </main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Built at Lovable Buildathon, Uppsala University.
      </footer>
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
        className="w-full resize-y rounded-2xl border border-input bg-background p-4 text-[15px] leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15" />
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft animate-fade-up">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground" style={{ fontFamily: "var(--font-sans)" }}>{title}</h3>
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

function SwedishCard({ s }: { s: DecodeResult["swedish"] }) {
  const tone = s.verdict === "Required" ? "bg-destructive/10 text-destructive"
    : s.verdict === "Helpful" ? "bg-accent text-accent-foreground"
    : s.verdict === "Not needed" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground";
  return (
    <Card title="Swedish language">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className={`w-fit rounded-full px-4 py-1.5 text-lg font-semibold ${tone}`}>{s.verdict}</span>
        <p className="text-muted-foreground">{s.reason}</p>
      </div>
    </Card>
  );
}

function FitCard({ fit }: { fit: NonNullable<DecodeResult["fit"]> }) {
  const r = 52, c = 2 * Math.PI * r;
  const color = fit.score >= 70 ? "stroke-success" : fit.score >= 45 ? "stroke-primary" : "stroke-warning";
  return (
    <Card title="Your fit">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={r} className="fill-none stroke-muted" strokeWidth="10" />
            <circle cx="60" cy="60" r={r} className={`fill-none ${color} transition-all duration-1000`} strokeWidth="10"
              strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - fit.score / 100)} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{fit.score}</span>
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
  return s + "\n\n— Decoded with Meriterande";
}
