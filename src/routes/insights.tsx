import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Lock, Share2, Users } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { loadInsights } from "@/lib/insights.functions";
import { SiteHeader, SiteFooter } from "@/components/landing";
import { useAuth } from "@/lib/auth";
import { useSync, setShareInsights } from "@/lib/sync";

const T = "Career-centre insights — Meriterande";
const D = "Aggregated, anonymous skill-gap data from opted-in Meriterande users: common gaps, most-decoded roles and average fit scores.";
export const Route = createFileRoute("/insights")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Insights,
});

type Bar = { label: string; people: number; avg_score?: number };
type Data = { ready: false; joined?: number; needed?: number } | { ready: true; gaps: Bar[]; titles: Bar[]; avg_score: number | null };

function ColdStart({ joined, needed }: { joined: number; needed: number }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${window.location.origin}/insights`;
    const text = "Help unlock anonymous skill-gap insights for job seekers on Meriterande — sign in and opt in to share anonymous data.";
    try {
      if (navigator.share) { await navigator.share({ title: "Meriterande insights", text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`); setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { /* user cancelled */ }
  }
  return (
    <Gate icon={<Users className="h-6 w-6" />} title={`${joined} of ${needed} people have joined`} text={`Insights unlock at ${needed}. Thanks for being one of them!`}>
      <div className="mx-auto mt-5 h-3 max-w-md overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={needed} aria-valuenow={joined}>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(joined / needed) * 100}%` }} />
      </div>
      <button onClick={share} className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground">
        <Share2 className="h-4 w-4" /> {copied ? "Link copied!" : "Invite others to opt in"}
      </button>
    </Gate>
  );
}

function Insights() {
  const { user, ready } = useAuth();
  const sync = useSync();
  const [data, setData] = useState<Data | null>(null);
  const load = useServerFn(loadInsights);
  useEffect(() => {
    if (!user || !sync.shareInsights) return;
    load().then((d) => setData((JSON.parse(d) as Data) ?? { ready: false })).catch(() => setData({ ready: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sync.shareInsights]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <h1 className="text-5xl text-foreground sm:text-6xl">Career-centre <em className="text-primary">insights</em></h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Anonymous, aggregated skill-gap data. Individual data is never shown — each item needs at least 3 people, and nothing appears until at least 10 people have opted in.</p>
        <div className="mt-8">
          {!ready ? null : !user ? (
            <Gate icon={<Lock className="h-6 w-6" />} title="Sign in to see insights" text="Insights are available to signed-in users who share their own anonymous data.">
              <Link to="/auth" className="mt-4 inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">Sign in</Link>
            </Gate>
          ) : !sync.shareInsights ? (
            <Gate icon={<Users className="h-6 w-6" />} title="Opt in to see insights" text="Share anonymous skill-gap data (job title, fit score and gap names from your decodes — never your CV, name or email). You can turn this off any time, which deletes what you shared.">
              <button onClick={() => void setShareInsights(true)} className="mt-4 h-12 rounded-full bg-primary px-6 font-semibold text-primary-foreground">Share anonymous skill-gap data</button>
            </Gate>
          ) : !data ? <div className="skeleton h-48 rounded-3xl" /> : !data.ready ? (
            <ColdStart joined={Math.min(data.joined ?? 0, data.needed ?? 10)} needed={data.needed ?? 10} />
          ) : (
            <div className="space-y-5">
              <div className="glass rounded-3xl p-6"><p className="text-sm font-semibold text-muted-foreground">Average fit score</p><p className="text-6xl" style={{ fontFamily: "var(--font-display)" }}>{data.avg_score ?? "—"}<span className="text-xl text-muted-foreground"> / 100</span></p></div>
              <Bars title="Most common skill gaps" items={data.gaps} />
              <Bars title="Most-decoded job titles" items={data.titles} showScore />
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Gate({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/12 text-primary">{icon}</span>
      <h2 className="mt-4 text-3xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}

function Bars({ title, items, showScore }: { title: string; items: Bar[]; showScore?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.people));
  return (
    <div className="glass rounded-3xl p-6">
      <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
      {items.length === 0 ? <p className="text-muted-foreground">Not enough shared data yet.</p> : (
        <ul className="space-y-3">
          {items.map((b, i) => (
            <li key={b.label}>
              <div className="mb-1 flex justify-between gap-3 text-sm"><span className="font-medium capitalize">{b.label}</span><span className="text-muted-foreground">{b.people} people{showScore && b.avg_score != null ? ` · avg fit ${b.avg_score}` : ""}</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-muted"><motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${(b.people / max) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
