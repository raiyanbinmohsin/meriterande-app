import { useEffect, useState } from "react";
import { RotateCcw, AlertCircle } from "lucide-react";

export const LONG_TASK_LIMIT_MS = 90_000;
export const TIMEOUT_MSG = "This is taking longer than usual (over 90 seconds). Your inputs are kept — please try again.";

/** Races a long AI call against a 90s limit so the UI never hangs. */
export function withDeadline<T>(p: Promise<T>, ms = LONG_TASK_LIMIT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(TIMEOUT_MSG)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

/** Elapsed time + step labels + expected duration. Pass `step` for real stages, or let it advance with time. */
export function LongProgress({ steps, expected, step, stepAt = 15 }: { steps: string[]; expected: string; step?: number; stepAt?: number }) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setSec(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(id);
  }, []);
  const cur = step ?? Math.min(steps.length - 1, Math.floor(sec / stepAt));
  return (
    <div role="status" aria-live="polite" className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 font-semibold text-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          {steps[cur]}…
        </span>
        <span className="tabular-nums text-sm font-semibold text-primary">{sec}s…</span>
      </div>
      <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-2 ${i < cur ? "text-success" : i === cur ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
            {i > 0 && <span className="text-muted-foreground">→</span>}{i < cur ? "✓ " : ""}{s}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-muted-foreground">Usually takes {expected}.</p>
    </div>
  );
}

export function TaskError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
      <span className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}</span>
      <button onClick={onRetry} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground">
        <RotateCcw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}
