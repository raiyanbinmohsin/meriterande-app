import { useSyncExternalStore } from "react";

export const COLUMNS = ["Saved", "Applied", "Interview", "Offer", "Rejected"] as const;
export type Column = (typeof COLUMNS)[number];
export type JobKind = "job" | "thesis";
export type Job = {
  id: string;
  kind: JobKind;
  title: string;
  company: string;
  score: number | null;
  verdict: string;
  savedOn: string; // YYYY-MM-DD
  column: Column;
  notes: string;
  deadline: string; // YYYY-MM-DD or ""
  appliedOn: string; // YYYY-MM-DD or ""
  reachedInterview: boolean;
  adText?: string; // original ad text (cards saved from now on)
};

const KEY = "meriterande.tracker.v1";
const EMPTY: Job[] = [];
let cache: Job[] | null = null;
const subs = new Set<() => void>();

export const today = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD local

function read(): Job[] {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Job[]; } catch { cache = []; }
  return cache;
}
function write(jobs: Job[]) {
  cache = jobs;
  try { localStorage.setItem(KEY, JSON.stringify(jobs)); } catch {}
  subs.forEach((f) => f());
}

export function useJobs() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, read, () => EMPTY);
}
export const getJobs = () => read();
export const replaceJobs = (jobs: Job[]) => write(jobs);
export function subscribeJobs(f: () => void) { subs.add(f); return () => { subs.delete(f); }; }

export function addJob(j: Pick<Job, "title" | "company" | "score" | "verdict"> & { kind?: JobKind; adText?: string }) {
  const job: Job = { kind: "job", ...j, id: crypto.randomUUID(), savedOn: today(), column: "Saved", notes: "", deadline: "", appliedOn: "", reachedInterview: false };
  write([job, ...read()]);
  // Analytics is best-effort: a stale chunk after a deploy must never surface as an error.
  void import("./analytics.functions").then((m) => m.track("tracker_card_saved")).catch(() => {});
  return job;
}

export function updateJob(id: string, patch: Partial<Job>) {
  write(read().map((j) => {
    if (j.id !== id) return j;
    const n = { ...j, ...patch };
    if (patch.column && patch.column !== "Saved" && patch.column !== "Rejected" && !n.appliedOn) n.appliedOn = today();
    if (patch.column === "Applied" && !j.appliedOn) n.appliedOn = today();
    if (patch.column === "Interview" || patch.column === "Offer") n.reachedInterview = true;
    return n;
  }));
}

export function removeJob(id: string) { write(read().filter((j) => j.id !== id)); }

export function daysUntil(date: string) {
  const d = new Date(date + "T00:00:00").getTime(), t = new Date(today() + "T00:00:00").getTime();
  return Math.round((d - t) / 86400000);
}

/** Consecutive days (ending today or yesterday) with at least one application. */
export function streak(jobs: Job[]) {
  const days = new Set(jobs.map((j) => j.appliedOn).filter(Boolean));
  let n = 0;
  const d = new Date(today() + "T00:00:00");
  if (!days.has(today())) d.setDate(d.getDate() - 1);
  while (days.has(d.toLocaleDateString("sv-SE"))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function toCsv(jobs: Job[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Title", "Company", "Status", "Fit score", "Verdict", "Saved on", "Applied on", "Deadline", "Notes"];
  return [head, ...jobs.map((j) => [j.title, j.company, j.column, j.score ?? "", j.verdict, j.savedOn, j.appliedOn, j.deadline, j.notes])]
    .map((r) => r.map(esc).join(",")).join("\n");
}
