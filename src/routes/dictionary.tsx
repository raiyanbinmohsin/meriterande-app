import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { SiteHeader, Wordmark } from "@/components/landing";
import { TERMS } from "@/lib/dictionary";

const TITLE = "Swedish job-ad dictionary — Meriterande";
const DESC = "50+ common Swedish job-ad terms like meriterande, provanställning and löpande urval, with plain-English meaning and what they really mean for you.";

export const Route = createFileRoute("/dictionary")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DictionaryPage,
});

function DictionaryPage() {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const all = [...TERMS].sort((a, b) => a.term.localeCompare(b.term, "sv"));
    return s ? all.filter((t) => `${t.term} ${t.english} ${t.really}`.toLowerCase().includes(s)) : all;
  }, [q]);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative isolate overflow-hidden">
        <div className="mesh pointer-events-none absolute -inset-20 -z-10 opacity-70" />
        <div className="mx-auto max-w-3xl px-5 pb-8 pt-14 text-center sm:pt-20">
          <h1 className="text-5xl leading-none text-foreground sm:text-7xl">Swedish job-ad <em className="text-primary">dictionary</em></h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">{TERMS.length} terms you'll meet in Swedish job ads — and what they really mean for you.</p>
          <label className="glass mx-auto mt-8 flex h-14 max-w-xl items-center gap-3 rounded-full px-5">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search e.g. provanställning, pension, licence..."
              className="h-full w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/70" aria-label="Search terms" />
          </label>
        </div>
      </section>
      <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-5">
        {list.length === 0 && <p className="py-10 text-center text-muted-foreground">No terms match "{q}".</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t, i) => (
            <motion.article key={t.term} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.03 }} className="glass lift rounded-3xl p-5">
              <h2 className="text-2xl text-foreground">{t.term}</h2>
              <p className="text-sm font-semibold text-primary">{t.english}</p>
              <p className="mt-2 text-muted-foreground">{t.really}</p>
            </motion.article>
          ))}
        </div>
      </main>
      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        <div className="mb-3 flex justify-center opacity-80"><Wordmark /></div>
        Built at Lovable Buildathon, Uppsala University.
      </footer>
    </div>
  );
}
