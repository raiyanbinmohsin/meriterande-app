import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Story = { id: string; name: string | null; role: string; story: string };

export function SuccessStories() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [name, setName] = useState("");
  const [anon, setAnon] = useState(false);
  const [role, setRole] = useState("");
  const [story, setStory] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("stories").select("id, name, role, story").eq("status", "approved").order("created_at", { ascending: false }).limit(12)
      .then(({ data }) => setStories((data as Story[]) ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (role.trim().length < 2) return setErr("Tell us the role you landed.");
    if (story.trim().length < 20) return setErr("Your story needs at least 20 characters.");
    if (!consent) return setErr("Please tick the consent box.");
    setErr(null); setState("busy");
    const { error } = await supabase.from("stories").insert({ name: anon || !name.trim() ? null : name.trim().slice(0, 80), role: role.trim().slice(0, 120), story: story.trim().slice(0, 1200), consent: true });
    if (error) { setErr("Couldn't send your story. Please try again."); setState("idle"); return; }
    setState("sent");
  }
  const input = "h-12 w-full rounded-2xl border border-input bg-background/70 px-4 text-[16px] text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/15";

  return (
    <section className="mx-auto max-w-5xl px-5 pb-16 sm:pb-24">
      <motion.h2 initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center text-4xl text-foreground sm:text-5xl">Success stories</motion.h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">Real stories from people who used Meriterande. Every story is reviewed before it appears.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {stories && stories.length === 0 && (
          <div className="glass rounded-3xl p-8 text-center sm:col-span-2">
            <Quote className="mx-auto h-8 w-8 text-sun" />
            <p className="mt-3 text-2xl text-foreground" style={{ fontFamily: "var(--font-display)" }}>Be the first to share your story.</p>
          </div>
        )}
        {stories?.map((s) => (
          <motion.figure key={s.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass lift rounded-3xl p-6">
            <Quote className="h-6 w-6 text-sun" />
            <blockquote className="mt-2 text-foreground">{s.story}</blockquote>
            <figcaption className="mt-4 text-sm text-muted-foreground"><strong className="text-foreground">{s.name ?? "Anonymous"}</strong> · {s.role}</figcaption>
          </motion.figure>
        ))}
      </div>
      <form onSubmit={submit} className="glass mx-auto mt-8 max-w-2xl space-y-4 rounded-3xl p-6 sm:p-8">
        <h3 className="text-2xl font-semibold">Share your story</h3>
        {state === "sent" ? (
          <p className="rounded-2xl bg-success/15 p-4 text-success">Thank you! Your story was received and will appear after review.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} disabled={anon} aria-label="Your name" />
              <input className={input} placeholder="Role you landed *" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role you landed" />
            </div>
            <label className="flex min-h-11 items-center gap-2.5 text-sm"><input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="h-5 w-5 accent-primary" /> Post anonymously</label>
            <textarea className={input + " h-auto py-3"} rows={4} maxLength={1200} placeholder="Your short story *" value={story} onChange={(e) => setStory(e.target.value)} aria-label="Your story" />
            <label className="flex items-start gap-2.5 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" /> I agree that Meriterande may publish this story on its website after review.</label>
            {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
            <button disabled={state === "busy"} className="h-12 rounded-full bg-primary px-7 font-semibold text-primary-foreground shadow-soft disabled:opacity-60">{state === "busy" ? "Sending..." : "Send story"}</button>
          </>
        )}
      </form>
    </section>
  );
}
