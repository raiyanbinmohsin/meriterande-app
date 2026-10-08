import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { OG_IMAGE } from "@/lib/seo";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/landing";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to sync — Meriterande" },
      { name: "description", content: "Optional account to sync your tracker, CV and roadmap progress across devices." },
      { property: "og:title", content: "Sign in to sync — Meriterande" },
      { property: "og:description", content: "Optional account to sync your tracker, CV and roadmap progress across devices." },
      { property: "og:type", content: "website" }, { property: "og:image", content: OG_IMAGE }, { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const input = "h-12 w-full rounded-2xl border border-input bg-background/70 px-4 text-[16px] text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/15";

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        setMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Check your inbox for a reset link." });
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin } });
        setMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Almost there — check your email and click the confirmation link to finish signing up." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) setMsg({ ok: false, text: error.message });
        else navigate({ to: "/" });
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-14 sm:py-20">
        <div className="glass rounded-3xl p-6 sm:p-8">
          <h1 className="text-4xl text-foreground">{mode === "up" ? "Create an account" : mode === "forgot" ? "Reset password" : "Sign in to sync"}</h1>
          <p className="mt-2 text-muted-foreground">Optional. Everything works without an account — signing in just syncs your tracker, CV and progress across devices.</p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input className={input} type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
            {mode !== "forgot" && <input className={input} type="password" required minLength={8} autoComplete={mode === "up" ? "new-password" : "current-password"} placeholder="Password (min 8 characters)" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="Password" />}
            {msg && <p role="alert" className={`rounded-2xl p-3 text-sm ${msg.ok ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>{msg.text}</p>}
            <button disabled={busy} className="h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground shadow-soft disabled:opacity-60">
              {busy ? "Please wait..." : mode === "up" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </button>
          </form>
          <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm">
            {mode === "in" ? <button className="min-h-11 font-semibold text-primary" onClick={() => setMode("up")}>No account? Sign up</button>
              : <button className="min-h-11 font-semibold text-primary" onClick={() => setMode("in")}>Have an account? Sign in</button>}
            {mode === "in" && <button className="min-h-11 text-muted-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>}
          </div>
          <Link to="/" className="mt-2 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline">Continue without an account</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
