import { useSyncExternalStore } from "react";

// Last few decoded ads (this browser only) so compare mode can reuse them without pasting.
export type RecentAd = { title: string; company: string; text: string; at: string };
const KEY = "meriterande.recentAds.v1";
const EMPTY: RecentAd[] = [];
let cache: RecentAd[] | null = null;
const subs = new Set<() => void>();
function read(): RecentAd[] {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentAd[]; } catch { cache = []; }
  return cache;
}
export function addRecentAd(a: Omit<RecentAd, "at">) {
  const text = a.text.trim();
  if (text.length < 30) return;
  cache = [{ ...a, text: text.slice(0, 20000), at: new Date().toISOString() }, ...read().filter((x) => x.text !== text)].slice(0, 8);
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch {}
  subs.forEach((f) => f());
}
export function useRecentAds() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, read, () => EMPTY);
}
