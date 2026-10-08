import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Cloud, Database, LogOut, ShieldCheck, Trash2, BarChart3 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { acceptMerge, declineMerge, enableSyncWithoutMerge, useSync } from "@/lib/sync";
import { deleteMyAccount } from "@/lib/account.functions";
import { replaceJobs } from "@/lib/tracker";
import { setCvText } from "@/lib/cv-store";
import { setProgress } from "@/lib/progress";

/** Removes everything Meriterande saved in this browser (tracker, CV, progress, recent ads, interview hand-off). */
export function clearDeviceData() {
  try {
    for (const store of [localStorage, sessionStorage]) {
      Object.keys(store).filter((k) => k.startsWith("meriterande.")).forEach((k) => store.removeItem(k));
    }
  } catch {}
  replaceJobs([]); setCvText(""); setProgress({ roadmaps: {}, phrasesSeen: [], phrasesLearned: [] });
}

export function AccountMenu() {
  const { user, ready, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  if (!ready) return <span className="h-11 w-11" />;
  if (!user) {
    return (
      <Link to="/auth" className="glass inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-foreground transition hover:-translate-y-0.5">
        <Cloud className="h-4 w-4" /><span className="hidden whitespace-nowrap sm:inline xl:hidden 2xl:inline">Sign in to sync</span><span className="whitespace-nowrap sm:hidden xl:inline 2xl:hidden">Sign in</span>
      </Link>
    );
  }
  const initials = (user.email ?? "?").slice(0, 2).toUpperCase();
  const item = "flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-start text-sm font-medium text-foreground hover:bg-secondary";
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-label="Account menu" aria-expanded={open}
        className="grid h-11 w-11 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-soft ring-2 ring-sun/70 transition hover:scale-105">
        {initials}
      </button>
      {open && (
        <div className="absolute end-0 top-13 z-50 mt-2 w-64 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-lift">
          <p className="truncate px-3 py-2 text-xs text-muted-foreground">{user.email}</p>
          <Link to="/account" onClick={() => setOpen(false)} className={item}><Database className="h-4 w-4" /> My data</Link>
          <Link to="/insights" onClick={() => setOpen(false)} className={item}><BarChart3 className="h-4 w-4" /> Career-centre insights</Link>
          {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className={item}><ShieldCheck className="h-4 w-4" /> Review stories</Link>}
          <button className={item} onClick={async () => { setOpen(false); await supabase.auth.signOut(); navigate({ to: "/", replace: true }); }}><LogOut className="h-4 w-4" /> Sign out</button>
          <button className={item + " text-destructive"} onClick={() => { setOpen(false); setConfirm(true); }}><Trash2 className="h-4 w-4" /> Delete my account and data</button>
        </div>
      )}
      {confirm && <DeleteDialog onClose={() => setConfirm(false)} />}
    </div>
  );
}

export function DeleteDialog({ onClose }: { onClose: () => void }) {
  const del = useServerFn(deleteMyAccount);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [wipe, setWipe] = useState(true);
  const navigate = useNavigate();
  async function go() {
    setBusy(true); setErr(null);
    try {
      const r = await del();
      if (!r.ok) { setErr(r.error); return; }
      await supabase.auth.signOut();
      if (wipe) clearDeviceData();
      onClose();
      navigate({ to: "/", replace: true });
    } catch { setErr("Couldn't delete the account. Please try again."); } finally { setBusy(false); }
  }
  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 text-card-foreground shadow-lift">
        <h2 className="text-3xl">Delete your account?</h2>
        <p className="mt-2 text-muted-foreground">This permanently deletes your account and everything synced to it: tracker, CV, roadmap progress, anonymous insight data, stories and feedback you sent while signed in.</p>
        <label className="mt-4 flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5 accent-primary" checked={wipe} onChange={(e) => setWipe(e.target.checked)} />
          Also clear the data saved in this browser
        </label>
        {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button onClick={go} disabled={busy} className="h-12 rounded-full bg-destructive px-6 font-semibold text-destructive-foreground disabled:opacity-60">{busy ? "Deleting..." : "Delete everything"}</button>
          <button onClick={onClose} className="glass h-12 rounded-full px-6 font-semibold">Cancel</button>
        </div>
      </div>
    </div>, document.body);
}

export function SyncPrompt() {
  const { prompt } = useSync();
  const [busy, setBusy] = useState(false);
  if (!prompt) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 text-card-foreground shadow-lift">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/12 text-primary"><Cloud className="h-6 w-6" /></span>
        <h2 className="mt-4 text-3xl">Move your data to your account?</h2>
        <p className="mt-2 text-muted-foreground">We found a tracker, CV or roadmap progress saved on this device. Move it into your account to sync it across your devices. Your CV stays on this device unless you turn on "Save my CV to my account" in My data.</p>
        <div className="mt-6 flex flex-col gap-2">
          <button disabled={busy} onClick={async () => { setBusy(true); await acceptMerge(); setBusy(false); }} className="h-12 rounded-full bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Moving..." : "Move and sync"}</button>
          <button onClick={enableSyncWithoutMerge} className="glass h-12 rounded-full px-6 font-semibold">Use my account's data instead</button>
          <button onClick={declineMerge} className="h-11 rounded-full px-6 text-sm font-semibold text-muted-foreground">Not now — keep it on this device</button>
        </div>
      </div>
    </div>, document.body);
}
