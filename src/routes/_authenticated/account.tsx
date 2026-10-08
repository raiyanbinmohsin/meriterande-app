import { createFileRoute, Link } from "@tanstack/react-router";
import { OG_IMAGE } from "@/lib/seo";
import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/landing";
import { DeleteDialog } from "@/components/AccountMenu";
import { useAuth } from "@/lib/auth";
import { useSync, setShareInsights, setSaveCv, acceptMerge } from "@/lib/sync";
import { useJobs } from "@/lib/tracker";
import { useCvText } from "@/lib/cv-store";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My data — Meriterande" },
      { name: "description", content: "See and manage the data synced to your Meriterande account." },
      { property: "og:title", content: "My data — Meriterande" },
      { property: "og:description", content: "See and manage the data synced to your Meriterande account." },
      { property: "og:type", content: "website" }, { property: "og:image", content: OG_IMAGE }, { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Account,
});

function Account() {
  const { user } = useAuth();
  const sync = useSync();
  const jobs = useJobs();
  const [cv] = useCvText();
  const prog = useProgress();
  const [del, setDel] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function exportJson() {
    const blob = new Blob([JSON.stringify({ email: user?.email, tracker: jobs, cv, progress: prog }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "meriterande-my-data.json"; a.click();
  }
  const row = "flex items-center justify-between gap-3 border-b border-border py-3 last:border-0";
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-12">
        <h1 className="text-5xl text-foreground">My data</h1>
        <p className="text-muted-foreground">Signed in as <strong className="text-foreground">{user?.email}</strong>.</p>
        <div className="glass rounded-3xl p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Sync</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sync.enabled ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{sync.enabled ? "On" : "Off on this device"}</span>
          </div>
          {sync.lastSync && <p className="text-sm text-muted-foreground">Last synced {new Date(sync.lastSync).toLocaleString()}</p>}
          {sync.error && <p className="text-sm text-destructive">{sync.error}</p>}
          {!sync.enabled && <button onClick={() => void acceptMerge()} className="mt-3 h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Move this device's data and sync</button>}
          <div className="mt-3">
            <div className={row}><span>Tracker cards</span><strong>{jobs.length}</strong></div>
            <div className={row}><span>CV</span><strong>{cv.trim() ? `${cv.trim().split(/\s+/).length} words` : "None"}</strong></div>
            <div className={row}><span>Roadmaps with progress</span><strong>{Object.keys(prog.roadmaps).length}</strong></div>
            <div className={row}><span>Swedish phrases learned</span><strong>{prog.phrasesLearned.length}</strong></div>
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Save my CV to my account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Off by default: your CV stays only in this browser. Turn it on to sync it across your devices. Turning it off deletes the CV from our servers. <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">Privacy</Link></p>
          <label className="mt-4 flex min-h-11 items-center gap-3 font-semibold">
            <input type="checkbox" className="h-5 w-5 accent-primary" checked={sync.saveCv} onChange={async (e) => setErr((await setSaveCv(e.target.checked)) ?? null)} />
            Save my CV to my account
          </label>
        </div>
        <div className="glass rounded-3xl p-6">
          <h2 className="text-2xl font-semibold">Share anonymous skill-gap data</h2>
          <p className="mt-1 text-sm text-muted-foreground">When on, each decode with a CV adds the job title, fit score and gap names — never your name, email, CV or the ad — to anonymous, aggregated <Link to="/insights" className="text-primary underline-offset-4 hover:underline">career-centre insights</Link>. Turning it off deletes what you shared.</p>
          <label className="mt-4 flex min-h-11 items-center gap-3 font-semibold">
            <input type="checkbox" className="h-5 w-5 accent-primary" checked={sync.shareInsights} onChange={async (e) => setErr((await setShareInsights(e.target.checked)) ?? null)} />
            Share anonymous skill-gap data
          </label>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={exportJson} className="glass inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold"><Download className="h-4 w-4" /> Download my data</button>
          <button onClick={() => setDel(true)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-destructive/10 px-6 font-semibold text-destructive"><Trash2 className="h-4 w-4" /> Delete my account and data</button>
        </div>
      </main>
      {del && <DeleteDialog onClose={() => setDel(false)} />}
      <SiteFooter />
    </div>
  );
}
