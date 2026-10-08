import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/landing";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Meriterande" },
      { name: "description", content: "Choose a new password for your Meriterande account." },
      { property: "og:title", content: "Set a new password — Meriterande" },
      { property: "og:description", content: "Choose a new password for your Meriterande account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

type Phase = "checking" | "ready" | "invalid";

function Reset() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;
    const ok = () => { if (!done) { done = true; setPhase("ready"); } };
    const bad = () => { if (!done) { done = true; setPhase("invalid"); } };
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) ok();
    });
    (async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const errDesc = url.searchParams.get("error_description") || hash.get("error_description");
      if (errDesc) return bad();
      const code = url.searchParams.get("code");
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          window.history.replaceState(null, "", url.pathname);
          return error ? bad() : ok();
        }
        const at = hash.get("access_token"), rt = hash.get("refresh_token");
        if (at && rt) {
          const { error } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
          window.history.replaceState(null, "", url.pathname);
          return error ? bad() : ok();
        }
        // The client may already have consumed the link (detectSessionInUrl) — give the event a moment.
        await new Promise((r) => setTimeout(r, 1500));
        const { data } = await supabase.auth.getSession();
        return data.session && hash.get("type") === "recovery" ? ok() : data.session && done ? undefined : bad();
      } catch { bad(); }
    })();
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setMsg(error.message); else navigate({ to: "/" });
  }
  async function resend(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) setMsg("Couldn't send the email. Please check the address and try again."); else setSent(true);
  }
  const input = "h-12 w-full rounded-2xl border border-input bg-background/70 px-4 text-[16px] outline-none focus:border-ring";
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        {phase === "checking" && <div className="glass rounded-3xl p-8 text-center text-muted-foreground">Checking your reset link…</div>}
        {phase === "invalid" && (
          <form onSubmit={resend} className="glass space-y-4 rounded-3xl p-6 sm:p-8">
            <h1 className="text-4xl">Link invalid or expired</h1>
            <p className="text-muted-foreground">This password reset link doesn't work any more. Reset links can only be used once and expire after a while. Request a new one below.</p>
            {sent ? (
              <p className="rounded-2xl bg-success/15 p-4 text-success">If an account exists for that email, a new reset link is on its way.</p>
            ) : (
              <>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" aria-label="Email" className={input} />
                {msg && <p role="alert" className="text-sm text-destructive">{msg}</p>}
                <button disabled={busy} className="h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Sending..." : "Send a new reset email"}</button>
              </>
            )}
          </form>
        )}
        {phase === "ready" && (
          <form onSubmit={submit} className="glass space-y-4 rounded-3xl p-6 sm:p-8">
            <h1 className="text-4xl">Set a new password</h1>
            <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (min 8 characters)" aria-label="New password" className={input} />
            {msg && <p role="alert" className="text-sm text-destructive">{msg}</p>}
            <button disabled={busy} className="h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Saving..." : "Save password"}</button>
          </form>
        )}
      </main>
    </div>
  );
}
