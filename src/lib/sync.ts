import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { onUserChange, startAuth } from "./auth";
import { getJobs, replaceJobs, subscribeJobs, type Job } from "./tracker";
import { getCvText, setCvText, subscribeCv } from "./cv-store";
import { getProgress, setProgress, subscribeProgress, type Progress } from "./progress";

type Remote = { tracker: Job[]; cv: string; progress: Progress; share_insights: boolean; save_cv: boolean; updated_at: string };
type SyncState = { prompt: boolean; enabled: boolean; shareInsights: boolean; saveCv: boolean; lastSync: string | null; error: string | null };
let st: SyncState = { prompt: false, enabled: false, shareInsights: false, saveCv: false, lastSync: null, error: null };
const SERVER = st;
const subs = new Set<() => void>();
const set = (p: Partial<SyncState>) => { st = { ...st, ...p }; subs.forEach((f) => f()); };
export const useSync = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => st, () => SERVER);

let user: User | null = null;
let remote: Remote | null = null;
let applying = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let started = false;
const mergedKey = (id: string) => `meriterande.synced.${id}`;

function localHasData() {
  const p = getProgress();
  return getJobs().length > 0 || getCvText().trim().length > 0 || Object.keys(p.roadmaps).length > 0 || p.phrasesLearned.length > 0 || p.phrasesSeen.length > 0;
}
function apply(r: Remote) {
  applying = true;
  try {
    replaceJobs(Array.isArray(r.tracker) ? r.tracker : []);
    if (r.cv) setCvText(r.cv);
    setProgress({ ...{ roadmaps: {}, phrasesSeen: [], phrasesLearned: [] } as Progress, ...(r.progress ?? {}) });
  } finally { applying = false; }
}
function merge(r: Remote | null): Omit<Remote, "share_insights" | "save_cv" | "updated_at"> {
  const local = getJobs(), lp = getProgress();
  if (!r) return { tracker: local, cv: getCvText(), progress: lp };
  const ids = new Set(local.map((j) => j.id));
  const rp: Progress = { ...{ roadmaps: {}, phrasesSeen: [], phrasesLearned: [] } as Progress, ...(r.progress ?? {}) };
  const uniq = (a: string[]) => [...new Map(a.map((x) => [x.toLowerCase(), x])).values()];
  return {
    tracker: [...local, ...(r.tracker ?? []).filter((j) => !ids.has(j.id))],
    cv: getCvText().trim() ? getCvText() : r.cv,
    progress: { roadmaps: { ...rp.roadmaps, ...lp.roadmaps }, phrasesSeen: uniq([...rp.phrasesSeen, ...lp.phrasesSeen]), phrasesLearned: uniq([...rp.phrasesLearned, ...lp.phrasesLearned]) },
  };
}
async function fetchRemote(): Promise<Remote | null> {
  if (!user) return null;
  const { data } = await supabase.from("user_data").select("tracker, cv, progress, share_insights, save_cv, updated_at").eq("user_id", user.id).maybeSingle();
  return (data as unknown as Remote) ?? null;
}
async function push() {
  if (!user || !st.enabled) return;
  const row = { user_id: user.id, tracker: getJobs() as never, cv: st.saveCv ? getCvText().slice(0, 20000) : "", progress: getProgress() as never, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("user_data").upsert(row, { onConflict: "user_id" });
  if (error) set({ error: "Couldn't sync right now — your data is still saved on this device." });
  else set({ lastSync: row.updated_at, error: null });
}
function schedule() { if (applying || !st.enabled) return; clearTimeout(timer); timer = setTimeout(() => void push(), 1200); }

async function onSignedIn(u: User) {
  user = u;
  remote = await fetchRemote();
  set({ shareInsights: !!remote?.share_insights, saveCv: !!remote?.save_cv });
  let merged = false;
  try { merged = localStorage.getItem(mergedKey(u.id)) === "1"; } catch {}
  if (localHasData() && !merged) { set({ prompt: true }); return; }
  if (remote) apply(remote);
  set({ enabled: true, lastSync: remote?.updated_at ?? null });
  if (!remote) void push();
}

/** User accepted: move local data into the account, then keep syncing. */
export async function acceptMerge() {
  const m = merge(remote);
  applying = true;
  try { replaceJobs(m.tracker); if (m.cv) setCvText(m.cv); setProgress(m.progress); } finally { applying = false; }
  try { if (user) localStorage.setItem(mergedKey(user.id), "1"); } catch {}
  set({ prompt: false, enabled: true });
  await push();
}
/** User declined: keep this device's data local and don't sync this session. */
export function declineMerge() { set({ prompt: false, enabled: false }); }
export function enableSyncWithoutMerge() {
  if (remote) apply(remote);
  try { if (user) localStorage.setItem(mergedKey(user.id), "1"); } catch {}
  set({ prompt: false, enabled: true });
}

/** CV text is stored on the server only when the signed-in user turns this on; off removes it. */
export async function setSaveCv(v: boolean) {
  if (!user) return;
  const { error } = await supabase.from("user_data").upsert({ user_id: user.id, save_cv: v, cv: v ? getCvText().slice(0, 20000) : "" }, { onConflict: "user_id" });
  if (!error) set({ saveCv: v });
  return error ? "Couldn't update this setting." : null;
}

export async function setShareInsights(v: boolean) {
  if (!user) return;
  const { error } = await supabase.from("user_data").upsert({ user_id: user.id, share_insights: v }, { onConflict: "user_id" });
  if (!error) {
    set({ shareInsights: v });
    if (!v) await supabase.from("insight_events").delete().eq("user_id", user.id);
  }
  return error ? "Couldn't update this setting." : null;
}

/** Anonymous skill-gap event — only stored for signed-in users who opted in. */
export async function recordInsight(jobTitle: string, score: number | null, gaps: string[]) {
  if (!user || !st.shareInsights) return;
  await supabase.from("insight_events").insert({ user_id: user.id, job_title: (jobTitle || "not specified").slice(0, 200), fit_score: score, gaps: gaps.slice(0, 5).map((g) => g.slice(0, 120)) });
}

export function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  startAuth();
  onUserChange((_e, u) => {
    if (u) void onSignedIn(u);
    else { user = null; remote = null; set({ enabled: false, prompt: false, shareInsights: false, saveCv: false, lastSync: null }); }
  });
  subscribeJobs(schedule); subscribeCv(schedule); subscribeProgress(schedule);
  window.addEventListener("focus", async () => {
    if (!st.enabled || !user) return;
    const r = await fetchRemote();
    if (r && st.lastSync && r.updated_at > st.lastSync) { apply(r); set({ lastSync: r.updated_at }); }
  });
}
