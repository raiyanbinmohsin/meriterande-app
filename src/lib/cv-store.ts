import { useSyncExternalStore } from "react";

// Shared CV text so any tab/section can reuse the uploaded or pasted CV.
let cvText = "";
const subs = new Set<() => void>();

export function setCvText(v: string) {
  cvText = v;
  subs.forEach((f) => f());
}

export function useCvText(): [string, (v: string) => void] {
  const v = useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => cvText,
    () => "",
  );
  return [v, setCvText];
}
