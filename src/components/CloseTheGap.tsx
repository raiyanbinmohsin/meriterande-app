import { useState } from "react";
import { buildPlan, type PlanResult } from "@/lib/plan.functions";

const STYLES = ["Courses", "Building projects", "Reading docs", "Videos"];
const TARGETS = ["7 days", "14 days", "1 month", "2 months", "6 months"];

export function CloseTheGap({ ad, cv, score, gaps }: { ad: string; cv: string; score: number; gaps: string[] }) {
  const [hours, setHours] = useState(8);
  const [styles, setStyles] = useState<string[]>(["Building projects"]);
  const [target, setTarget] = useState("1 month");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  async function onBuild() {
    setLoading(true); setError(null); setPlan(null); setDone({});
    try {
      const r = await buildPlan({ data: { ad, cv, score, gaps, hours, styles, target } });
      if (r.ok) setPlan(r.result); else setError(r.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  }

  const total = plan?.milestones.reduce((n, m) => n + m.tasks.length, 0) ?? 0;
  const checked = Object.values(done).filter(Boolean).length;
  const pct = total ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft animate-fade-up">
      <h3 className="mb-1 text-2xl font-semibold">Close the gap</h3>
      <p className="mb-5 text-muted-foreground">A personalized roadmap from your current fit of {score}/100.</p>

      <div className="space-y-5">
        <label className="block">
          <span className="mb-2 flex justify-between text-sm font-semibold">
            <span>Hours per week I can invest</span><span className="text-primary">{hours} h</span>
          </span>
          <input type="range" min={2} max={40} value={hours} onChange={(e) => setHours(+e.target.value)} className="w-full accent-primary" />
        </label>
        <div>
          <span className="mb-2 block text-sm font-semibold">How I learn best</span>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => {
              const on = styles.includes(s);
              return (
                <button key={s} type="button" onClick={() => setStyles(on ? styles.filter((x) => x !== s) : [...styles, s])}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-secondary"}`}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <span className="mb-2 block text-sm font-semibold">Target application date</span>
          <div className="flex flex-wrap gap-2">
            {TARGETS.map((t) => (
              <button key={t} type="button" onClick={() => setTarget(t)}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${target === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-secondary"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onBuild} disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-primary px-8 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />}
          {loading ? "Building your plan..." : plan ? "Rebuild my plan" : "Build my plan"}
        </button>
      </div>

      {error && <div role="alert" className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">{error}</div>}

      {plan && (
        <div className="mt-8 space-y-6">
          <Verdict plan={plan} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-[200px] flex-1">
              <div className="mb-1.5 flex justify-between text-sm font-semibold"><span>Progress</span><span>{checked}/{total} tasks · {pct}%</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${pct}%` }} /></div>
            </div>
            <button onClick={() => downloadPdf(plan, score, done)}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-secondary">Download plan</button>
          </div>
          <Chart start={score} points={plan.milestones.map((m) => ({ label: m.horizon, v: m.projected_score }))} />
          <ol className="relative space-y-6 border-l-2 border-border pl-6">
            {plan.milestones.map((m, mi) => (
              <li key={mi} className="relative">
                <span className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-4 border-card bg-primary" />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">{m.horizon}</p>
                  <span className="rounded-full bg-secondary px-3 py-0.5 text-sm font-semibold text-secondary-foreground">Fit → {m.projected_score}</span>
                </div>
                <p className="mt-1 font-semibold">{m.goal}</p>
                <ul className="mt-3 space-y-2">
                  {m.tasks.map((t, ti) => {
                    const k = `${mi}-${ti}`;
                    return (
                      <li key={k}>
                        <label className="flex cursor-pointer gap-3">
                          <input type="checkbox" checked={!!done[k]} onChange={(e) => setDone({ ...done, [k]: e.target.checked })} className="mt-1 h-4 w-4 shrink-0 accent-primary" />
                          <span className={done[k] ? "text-muted-foreground line-through" : ""}>{t}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p className="rounded-xl bg-accent p-3 text-accent-foreground"><strong>Resource: </strong>{m.resource_type}</p>
                  <p className="rounded-xl bg-secondary p-3 text-secondary-foreground"><strong>Proof for CV: </strong>{m.proof}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function verdictText(p: PlanResult) {
  return p.verdict.label === "Apply in ~X weeks" ? `Apply in ~${p.verdict.weeks ?? "?"} weeks` : p.verdict.label;
}

function Verdict({ plan }: { plan: PlanResult }) {
  const tone = plan.verdict.label === "Apply now" ? "bg-success/15 text-success"
    : plan.verdict.label === "Long-term target" ? "bg-warning/15 text-warning" : "bg-accent text-accent-foreground";
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <span className={`inline-block rounded-full px-4 py-1.5 text-lg font-semibold ${tone}`}>{verdictText(plan)}</span>
      <p className="mt-3">{plan.verdict.reasoning}</p>
      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div><p className="mb-1 font-semibold text-success">Can be closed</p><ul className="list-disc space-y-1 pl-5">{plan.can_close.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div><p className="mb-1 font-semibold text-warning">Can't be closed quickly</p>
          {plan.cannot_close.length ? <ul className="list-disc space-y-1 pl-5">{plan.cannot_close.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="text-muted-foreground">Nothing major.</p>}
        </div>
      </div>
    </div>
  );
}

function Chart({ start, points }: { start: number; points: { label: string; v: number }[] }) {
  const all = [{ label: "Now", v: start }, ...points];
  const W = 600, H = 200, px = 40, py = 24;
  const x = (i: number) => px + (i * (W - 2 * px)) / (all.length - 1);
  const y = (v: number) => H - py - (v / 100) * (H - 2 * py);
  const d = all.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.v)}`).join(" ");
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="mb-2 text-sm font-semibold">Projected fit score</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[0, 50, 100].map((g) => (
          <g key={g}><line x1={px} x2={W - px} y1={y(g)} y2={y(g)} className="stroke-border" strokeDasharray="4 4" />
            <text x={px - 8} y={y(g) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">{g}</text></g>
        ))}
        <path d={d} className="fill-none stroke-primary" strokeWidth={3} strokeLinejoin="round" />
        {all.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.v)} r={5} className={i ? "fill-primary" : "fill-sun"} />
            <text x={x(i)} y={y(p.v) - 10} textAnchor="middle" className="fill-foreground text-[12px] font-semibold">{p.v}</text>
            <text x={x(i)} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-[11px]">{p.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

async function downloadPdf(plan: PlanResult, score: number, done: Record<string, boolean>) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const M = 50, W = doc.internal.pageSize.getWidth() - 2 * M, B = doc.internal.pageSize.getHeight() - M;
  let yy = M;
  const write = (t: string, size = 11, bold = false, gap = 4) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size);
    for (const line of doc.splitTextToSize(t, W) as string[]) {
      if (yy + size > B) { doc.addPage(); yy = M; }
      doc.text(line, M, yy + size); yy += size * 1.35;
    }
    yy += gap;
  };
  write("Close the gap — Meriterande", 20, true, 8);
  write(`Current fit: ${score}/100`, 11);
  write(`Verdict: ${verdictText(plan)}`, 13, true);
  write(plan.verdict.reasoning, 11, false, 8);
  if (plan.can_close.length) { write("Can be closed", 11, true, 0); plan.can_close.forEach((x) => write(`- ${x}`, 10, false, 0)); yy += 6; }
  if (plan.cannot_close.length) { write("Can't be closed quickly", 11, true, 0); plan.cannot_close.forEach((x) => write(`- ${x}`, 10, false, 0)); yy += 6; }
  plan.milestones.forEach((m, mi) => {
    yy += 6;
    write(`${m.horizon.toUpperCase()}  ·  projected fit ${m.projected_score}/100`, 13, true, 0);
    write(m.goal, 11, false, 2);
    m.tasks.forEach((t, ti) => write(`${done[`${mi}-${ti}`] ? "[x]" : "[ ]"} ${t}`, 10, false, 0));
    write(`Resource: ${m.resource_type}`, 10, false, 0);
    write(`Proof for CV: ${m.proof}`, 10, false, 4);
  });
  doc.save("meriterande-plan.pdf");
}
