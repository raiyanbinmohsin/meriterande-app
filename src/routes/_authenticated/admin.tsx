import { createFileRoute } from "@tanstack/react-router";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
    const { data } = await supabase.from("stories").select("*").order("created_at", { ascending: false });
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
          </>
        )}
      </main>
    </div>
  );
}
