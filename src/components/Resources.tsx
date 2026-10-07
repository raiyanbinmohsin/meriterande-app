import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, ExternalLink } from "lucide-react";
import type { Resource } from "@/lib/learning";

export function ResourceCards({ items, compact }: { items: Resource[]; compact?: boolean }) {
  if (!items.length) return null;
  return (
    <div className={`grid gap-2 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {items.map((r) => (
        <a key={r.key + r.url} href={r.url} target="_blank" rel="noopener noreferrer"
          className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-[11px] font-bold text-primary">{r.short}</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
              <span className="truncate">{r.name}</span>
              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </span>
            <span className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold uppercase tracking-wide">
              <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-success">{r.cost}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground">{r.type}</span>
              <span className="whitespace-nowrap rounded-full bg-secondary px-1.5 py-0.5 text-secondary-foreground">✓ Trusted source</span>
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}

export function AnimatedNumber({ value }: { value: number }) {
  const [v, setV] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current, t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setV(Math.round(start + (value - start) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step); else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <motion.span key={value} initial={{ scale: 1 }} animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.6 }} className="inline-block tabular-nums">{v}</motion.span>;
}

export function LearnedButton({ on, onClick, points }: { on: boolean; onClick: () => void; points: number }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition ${on ? "bg-success/15 text-success" : "border border-border bg-background text-foreground hover:bg-secondary"}`}>
      {on ? <><Check className="h-4 w-4" /> Learned · +{points}</> : <>Mark as learned <span className="text-muted-foreground">+{points}</span></>}
    </button>
  );
}
