import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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

function Reset() {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setMsg(error.message); else navigate({ to: "/" });
  }
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        <form onSubmit={submit} className="glass space-y-4 rounded-3xl p-6 sm:p-8">
          <h1 className="text-4xl">Set a new password</h1>
          <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (min 8 characters)" aria-label="New password"
            className="h-12 w-full rounded-2xl border border-input bg-background/70 px-4 text-[16px] outline-none focus:border-ring" />
          {msg && <p role="alert" className="text-sm text-destructive">{msg}</p>}
          <button disabled={busy} className="h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Saving..." : "Save password"}</button>
        </form>
      </main>
    </div>
  );
}
