import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Single client-side auth listener; accounts are optional everywhere.
type AuthState = { user: User | null; ready: boolean; isAdmin: boolean };
let state: AuthState = { user: null, ready: false, isAdmin: false };
const SERVER: AuthState = { user: null, ready: false, isAdmin: false };
const subs = new Set<() => void>();
const set = (p: Partial<AuthState>) => { state = { ...state, ...p }; subs.forEach((f) => f()); };
let started = false;
const listeners = new Set<(event: string, user: User | null) => void>();

async function checkAdmin(user: User | null) {
  if (!user) return set({ isAdmin: false });
  const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
  set({ isAdmin: !!data });
}

export function startAuth() {
  if (started || typeof window === "undefined") return;
  started = true;
  supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user ?? null;
    const changed = user?.id !== state.user?.id;
    set({ user, ready: true });
    if (changed || event === "SIGNED_IN") void checkAdmin(user);
    if (changed) listeners.forEach((l) => l(event, user));
  });
  void supabase.auth.getSession().then(({ data }) => {
    if (!state.ready) { set({ user: data.session?.user ?? null, ready: true }); void checkAdmin(data.session?.user ?? null); if (data.session?.user) listeners.forEach((l) => l("INITIAL", data.session!.user)); }
  });
}
export function onUserChange(l: (event: string, user: User | null) => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export const getUser = () => state.user;

export function useAuth() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => state, () => SERVER);
}
