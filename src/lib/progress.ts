import { useSyncExternalStore } from "react";

// Local learning progress: roadmap checkboxes and Swedish phrases (seen in ads / learned).
export type RoadmapState = { title: string; done: Record<string, boolean>; learned: Record<number, boolean>; updated: string };
export type Progress = { roadmaps: Record<string, RoadmapState>; phrasesSeen: string[]; phrasesLearned: string[] };

const KEY = "meriterande.progress.v1";
const EMPTY: Progress = { roadmaps: {}, phrasesSeen: [], phrasesLearned: [] };
let cache: Progress | null = null;
const subs = new Set<() => void>();

function read(): Progress {
  if (cache) return cache;
  try { cache = { ...EMPTY, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Progress>) }; } catch { cache = { ...EMPTY }; }
  return cache;
}
export function getProgress() { return read(); }
export function setProgress(p: Progress) {
  cache = p;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
  subs.forEach((f) => f());
}
export function subscribeProgress(f: () => void) { subs.add(f); return () => { subs.delete(f); }; }
export function useProgress() { return useSyncExternalStore(subscribeProgress, read, () => EMPTY); }

export function saveRoadmap(key: string, s: Omit<RoadmapState, "updated">) {
  const p = read();
  setProgress({ ...p, roadmaps: { ...p.roadmaps, [key]: { ...s, updated: new Date().toISOString() } } });
}
const norm = (s: string) => s.trim().toLowerCase();
export function addSeenPhrases(list: string[]) {
  const p = read();
  const set = new Map(p.phrasesSeen.map((x) => [norm(x), x]));
  list.forEach((x) => { if (x.trim() && !set.has(norm(x))) set.set(norm(x), x.trim()); });
  if (set.size !== p.phrasesSeen.length) setProgress({ ...p, phrasesSeen: [...set.values()].slice(-60) });
}
export function markPhraseLearned(phrase: string) {
  const p = read();
  if (p.phrasesLearned.some((x) => norm(x) === norm(phrase))) return;
  setProgress({ ...p, phrasesLearned: [...p.phrasesLearned, phrase.trim()] });
}
export const isLearned = (p: Progress, phrase: string) => p.phrasesLearned.some((x) => norm(x) === norm(phrase));
