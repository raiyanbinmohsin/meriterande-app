import { createFileRoute } from "@tanstack/react-router";
import { OG_IMAGE } from "@/lib/seo";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/landing";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Review stories — Meriterande" },
      { name: "description", content: "Approve or reject submitted success stories." },
      { property: "og:title", content: "Review stories — Meriterande" },
      { property: "og:description", content: "Approve or reject submitted success stories." },
      { property: "og:type", content: "website" }, { property: "og:image", content: OG_IMAGE }, { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

type Row = { id: string; name: string | null; role: string; story: string; status: string; created_at: string };

function Admin() {
  const { isAdmin, ready } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState("pending");
  async function load() {
    const { data } = await supabase.from("stories").select("id, name, role, story, status, created_at").order("created_at", { ascending: false });
    setRows((data as Row[]) ?? []);
  }
  useEffect(() => { if (isAdmin) void load(); }, [isAdmin]);
  async function setStatus(id: string, status: string) {
    await supabase.from("stories").update({ status }).eq("id", id);
    void load();
  }
  async function remove(id: string) { await supabase.from("stories").delete().eq("id", id); void load(); }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-5xl">Review stories</h1>
        {ready && !isAdmin ? <p className="mt-6 text-muted-foreground">This page is for admins only.</p> : (
          <>
            <div className="glass mt-6 inline-flex rounded-full p-1">
              {["pending", "approved", "rejected"].map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`h-10 rounded-full px-4 text-sm font-semibold capitalize ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {t} ({rows.filter((r) => r.status === t).length})
                </button>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {rows.filter((r) => r.status === tab).length === 0 && <p className="text-muted-foreground">Nothing here.</p>}
              {rows.filter((r) => r.status === tab).map((r) => (
                <div key={r.id} className="glass rounded-3xl p-5">
                  <p className="text-sm text-muted-foreground"><strong className="text-foreground">{r.name ?? "Anonymous"}</strong> · {r.role} · {new Date(r.created_at).toLocaleDateString()}</p>
                  <p className="mt-2 whitespace-pre-wrap">{r.story}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {r.status !== "approved" && <button onClick={() => setStatus(r.id, "approved")} className="h-11 rounded-full bg-success/15 px-5 text-sm font-semibold text-success">Approve</button>}
                    {r.status !== "rejected" && <button onClick={() => setStatus(r.id, "rejected")} className="glass h-11 rounded-full px-5 text-sm font-semibold">Reject</button>}
                    <button onClick={() => remove(r.id)} className="h-11 rounded-full px-5 text-sm font-semibold text-destructive">Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <AdminEmails />
          </>
        )}
      </main>
    </div>
  );
}

function AdminEmails() {
  const [list, setList] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function load() {
    const { data } = await supabase.from("admin_emails").select("email").order("created_at");
    setList((data ?? []).map((r) => r.email));
  }
  useEffect(() => { void load(); }, []);
  async function add(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const v = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return setMsg("Enter a valid email.");
    const { error } = await supabase.from("admin_emails").insert({ email: v });
    if (error) setMsg("Couldn't add that email."); else { setEmail(""); setMsg("Added. They get admin rights when they sign up with this email."); void load(); }
  }
  async function remove(v: string) {
    const { error } = await supabase.from("admin_emails").delete().eq("email", v);
    if (error) setMsg("Couldn't remove that email."); else void load();
  }
  return (
    <section className="glass mt-10 rounded-3xl p-6">
      <h2 className="text-2xl font-semibold">Admin emails</h2>
      <p className="mt-1 text-sm text-muted-foreground">New accounts with these emails become admins when they sign up.</p>
      <ul className="mt-4 space-y-2">
        {list.map((v) => (
          <li key={v} className="flex items-center justify-between gap-3 rounded-2xl bg-background/60 px-4 py-2 text-sm">
            <span className="break-all">{v}</span>
            <button onClick={() => remove(v)} className="h-10 rounded-full px-4 font-semibold text-destructive">Remove</button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 flex flex-wrap gap-2">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" aria-label="Admin email"
          className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background/70 px-4 text-[16px] outline-none focus:border-ring" />
        <button className="h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground">Add</button>
      </form>
      {msg && <p className="mt-2 text-sm text-muted-foreground">{msg}</p>}
    </section>
  );
}
