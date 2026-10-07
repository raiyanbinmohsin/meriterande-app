import { NoResultsIllustration } from "@/components/illustrations";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { MapPin, Search, Building2, CalendarDays } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/landing";
import { CvUpload } from "@/components/CvUpload";
import { useCvText } from "@/lib/cv-store";
import { findJobs, type FoundJob } from "@/lib/find.functions";
import { setPendingAd } from "@/lib/ad-store";
import { addJob } from "@/lib/tracker";

const TITLE = "Find jobs I fit — Meriterande";
const DESC = "Search Platsbanken for Swedish jobs and get a quick AI fit score for each one against your CV.";

export const Route = createFileRoute("/find")({
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
  component: FindPage,
});

function FindPage() {
  const [cv, setCv] = useCvText();
  const [keywords, setKeywords] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [jobs, setJobs] = useState<FoundJob[] | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (keywords.trim().length < 2) { setError("Please enter a keyword, e.g. \"data engineer\"."); return; }
    setLoading(true); setError(null); setJobs(null); setNote("");
    try {
      const r = await findJobs({ data: { keywords, city, cv } });
      if (r.ok) { setJobs(r.jobs); setNote(r.note); } else setError(r.error);
    } catch {
      setError("We couldn't reach Platsbanken right now. Please try again in a moment.");
    } finally { setLoading(false); }
  }

  function decodeFully(j: FoundJob) {
    setPendingAd(j.text);
    navigate({ to: "/", hash: "decode" });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative isolate overflow-hidden">
        <div className="mesh pointer-events-none absolute -inset-20 -z-10 opacity-70" />
        <div className="mx-auto max-w-3xl px-5 pb-6 pt-14 text-center sm:pt-20">
          <h1 className="text-5xl leading-none text-foreground sm:text-7xl">Find jobs <em className="text-primary">I fit</em></h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">Search Platsbanken and see a quick fit score for every result against your CV.</p>
        </div>
      </section>
      <main className="mx-auto max-w-3xl px-4 pb-20 sm:px-5">
        <form onSubmit={onSearch} className="glass space-y-5 rounded-3xl p-5 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-[1fr_0.7fr]">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-foreground">Keywords <span className="text-primary">*</span></span>
              <span className="flex h-12 items-center gap-2 rounded-full border border-input bg-background/70 px-4 focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="data engineer"
                  className="h-full w-full bg-transparent text-[16px] text-foreground outline-none placeholder:text-muted-foreground/60" />
              </span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-foreground">City (optional)</span>
              <span className="flex h-12 items-center gap-2 rounded-full border border-input bg-background/70 px-4 focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Stockholm"
                  className="h-full w-full bg-transparent text-[16px] text-foreground outline-none placeholder:text-muted-foreground/60" />
              </span>
            </label>
          </div>
          <div>
            <CvUpload onText={setCv} />
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-foreground">Your CV (for fit scores)</span>
              <textarea value={cv} onChange={(e) => setCv(e.target.value)} rows={5} placeholder="Your experience, skills, education..."
                className="w-full resize-y rounded-2xl border border-input bg-background/70 p-4 text-[16px] leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15" />
            </label>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="submit" disabled={loading}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-10 text-base font-semibold text-primary-foreground shadow-lift transition hover:-translate-y-0.5 disabled:opacity-60">
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />}
              {loading ? "Searching & scoring..." : "Find jobs"}
            </button>
            <p className="text-xs text-muted-foreground">Searches Swedish jobs on Arbetsförmedlingen's Platsbanken only.</p>
          </div>
        </form>

        {loading && (
          <div className="mt-8 space-y-3">
            {[0, 1, 2].map((k) => (
              <div key={k} className="glass rounded-3xl p-5">
                <div className="skeleton h-4 w-1/2 rounded-full" /><div className="skeleton mt-3 h-3 w-1/3 rounded-full" /><div className="skeleton mt-4 h-3 w-4/5 rounded-full" />
              </div>
            ))}
          </div>
        )}
        {error && <div role="alert" className="mt-8 rounded-3xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">{error}</div>}
        {jobs && (
          <section className="mt-10 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-4xl text-foreground">{jobs.length ? `${jobs.length} jobs` : "No jobs found"}</h2>
              {note && <p className="text-sm text-muted-foreground">{note}</p>}
            </div>
            {!jobs.length && <div className="glass rounded-3xl p-6 text-center text-muted-foreground"><NoResultsIllustration className="mx-auto mb-3 h-28 w-auto" />Try a broader keyword or remove the city.</div>}
            {jobs.map((j, i) => (
              <motion.article key={j.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: i * 0.06 }}
                className="glass lift flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:p-6">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
                  <span className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>{j.score ?? "—"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl leading-tight text-foreground">{j.title}</h3>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{j.employer}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{j.city}</span>
                    {j.published && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{j.published}</span>}
                  </div>
                  {j.reason && <p className="mt-2 text-foreground">{j.reason}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => decodeFully(j)} className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5">Decode fully</button>
                    {saved[j.id] ? (
                      <Link to="/tracker" className="inline-flex h-11 items-center rounded-full bg-success/15 px-5 text-sm font-semibold text-success">Saved ✓ View tracker</Link>
                    ) : (
                      <button onClick={() => { addJob({ title: j.title, company: j.employer, score: j.score, verdict: "Quick fit" }); setSaved({ ...saved, [j.id]: true }); }}
                        className="glass inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5">Save to tracker</button>
                    )}
                    <a href={j.url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold text-primary hover:underline">View on Platsbanken ↗</a>
                  </div>
                </div>
              </motion.article>
            ))}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
