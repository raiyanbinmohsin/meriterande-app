import { EmptyBoardIllustration } from "@/components/illustrations";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { SiteHeader, Wordmark } from "@/components/landing";
import { COLUMNS, daysUntil, removeJob, streak, toCsv, updateJob, useJobs, type Column, type Job } from "@/lib/tracker";

const TITLE = "Application tracker — Meriterande";
const DESC = "Track your job applications on a simple kanban board: saved, applied, interview, offer and rejected. Stored privately in your browser.";

export const Route = createFileRoute("/tracker")({
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
  component: TrackerPage,
});

const DOT: Record<Column, string> = { Saved: "bg-muted-foreground", Applied: "bg-primary", Interview: "bg-sun", Offer: "bg-success", Rejected: "bg-destructive" };

type KindFilter = "all" | "job" | "thesis";
const KIND_LABEL: Record<string, string> = { job: "Job", thesis: "Thesis pitch" };
const KIND_BADGE: Record<string, string> = { job: "bg-primary/12 text-primary", thesis: "bg-sun/20 text-sun-foreground" };
const kindOf = (j: Job) => j.kind ?? "job";

function TrackerPage() {
  const jobs = useJobs();
  const [over, setOver] = useState<Column | null>(null);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const visible = jobs.filter((j) => kindFilter === "all" || kindOf(j) === kindFilter);
  const applied = jobs.filter((j) => j.appliedOn).length;
  const scored = jobs.filter((j) => j.score != null);
  const avg = scored.length ? Math.round(scored.reduce((n, j) => n + (j.score ?? 0), 0) / scored.length) : null;
  const rate = applied ? Math.round((jobs.filter((j) => j.reachedInterview).length / applied) * 100) : null;
  const s = streak(jobs);

  function exportCsv() {
    const url = URL.createObjectURL(new Blob(["\uFEFF" + toCsv(jobs)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "meriterande-applications.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative isolate overflow-hidden">
        <div className="mesh pointer-events-none absolute -inset-20 -z-10 opacity-60" />
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-12 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-5xl leading-none text-foreground sm:text-6xl">Application <em className="text-primary">tracker</em></h1>
              <p className="mt-3 text-muted-foreground">Saved only in this browser — no login.</p>
            </div>
            <button onClick={exportCsv} disabled={!jobs.length}
              className="glass inline-flex h-12 items-center gap-2 rounded-full px-5 font-semibold text-foreground transition hover:-translate-y-0.5 disabled:opacity-50">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Streak" value={`🔥 ${s}-day`} sub="application streak" />
            <Stat label="Total applied" value={String(applied)} />
            <Stat label="Average fit score" value={avg == null ? "—" : String(avg)} />
            <Stat label="Interview rate" value={rate == null ? "—" : `${rate}%`} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {!jobs.length && (
          <div className="glass mb-6 rounded-3xl p-6 text-center text-muted-foreground">
            <EmptyBoardIllustration className="mx-auto mb-3 h-28 w-auto" />
            No applications yet. <Link to="/" className="font-semibold text-primary underline-offset-4 hover:underline">Decode a job ad</Link> and click "Save to tracker".
          </div>
        )}
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
          {COLUMNS.map((col) => {
            const list = jobs.filter((j) => j.column === col);
            return (
              <section key={col}
                onDragOver={(e) => { e.preventDefault(); setOver(col); }}
                onDragLeave={() => setOver((o) => (o === col ? null : o))}
                onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text/plain"); if (id) updateJob(id, { column: col }); }}
                className={`glass flex min-h-[320px] w-[82vw] shrink-0 snap-start flex-col rounded-3xl p-3 transition sm:w-80 lg:w-auto ${over === col ? "ring-4 ring-ring/30" : ""}`}>
                <header className="mb-3 flex items-center gap-2 px-2 pt-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${DOT[col]}`} />
                  <h2 className="text-xl text-foreground">{col}</h2>
                  <span className="ms-auto rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground">{list.length}</span>
                </header>
                <div className="flex flex-1 flex-col gap-3">
                  {list.map((j) => <JobCard key={j.id} job={j} />)}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        <div className="mb-3 flex justify-center opacity-80"><Wordmark /></div>
        Built at Lovable Buildathon, Uppsala University.
      </footer>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-3xl p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl text-foreground sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const [open, setOpen] = useState(false);
  const left = job.deadline ? daysUntil(job.deadline) : null;
  const overdue = left != null && left < 0 && job.column !== "Offer" && job.column !== "Rejected";
  return (
    <article draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", job.id)}
      className={`cursor-grab rounded-2xl border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift active:cursor-grabbing ${overdue ? "border-destructive bg-destructive/10" : "border-border"}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground" style={{ fontFamily: "var(--font-sans)", letterSpacing: 0 }}>{job.title}</h3>
          <p className="truncate text-sm text-muted-foreground">{job.company}</p>
        </div>
        {job.score != null && <span className="rounded-full bg-primary/12 px-2.5 py-0.5 text-sm font-bold text-primary">{job.score}</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{job.verdict}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Saved {job.savedOn}</span>
        {left != null && (
          <span className={`rounded-full px-2 py-0.5 font-semibold ${left < 0 ? "bg-destructive/15 text-destructive" : left <= 3 ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {left < 0 ? `${-left} day${left === -1 ? "" : "s"} overdue` : left === 0 ? "Due today" : `${left} day${left === 1 ? "" : "s"} left`}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <select value={job.column} onChange={(e) => updateJob(job.id, { column: e.target.value as Column })} aria-label="Move to column"
          className="h-9 flex-1 rounded-full border border-input bg-background px-3 text-sm text-foreground lg:hidden">
          {COLUMNS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => setOpen(!open)} className="h-9 rounded-full px-3 text-sm font-semibold text-primary hover:bg-secondary">
          {open ? "Done" : "Notes & deadline"}
        </button>
        <button onClick={() => confirm("Remove this card?") && removeJob(job.id)} aria-label="Remove card"
          className="ms-auto grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground">Deadline
            <input type="date" value={job.deadline} onChange={(e) => updateJob(job.id, { deadline: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground" />
          </label>
          <label className="block text-xs font-semibold text-muted-foreground">Notes
            <textarea value={job.notes} onChange={(e) => updateJob(job.id, { notes: e.target.value })} rows={3}
              className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground" placeholder="Contact person, salary, follow-up..." />
          </label>
        </div>
      )}
      {!open && job.notes && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{job.notes}</p>}
    </article>
  );
}
