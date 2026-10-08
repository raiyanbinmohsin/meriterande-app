import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, BookOpen } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/landing";
import { EXAMPLES, termBySlug } from "@/lib/dictionary-examples";
import { pageMeta, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/dictionary_/$term")({
  loader: ({ params }) => {
    const t = termBySlug(params.term);
    if (!t) throw notFound();
    return { t, ex: EXAMPLES[t.term] ?? null };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Term not found — Meriterande" }] };
    const { t } = loaderData;
    const title = `${t.term} meaning in Swedish job ads — Meriterande`;
    const desc = `"${t.term}" means ${t.english}. ${t.really}`.slice(0, 158);
    return { meta: pageMeta(title, desc), links: [{ rel: "canonical", href: `${SITE_URL}/dictionary/${params.term}` }] };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background"><SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-20 text-center"><h1 className="text-4xl text-foreground">Term not found</h1>
        <Link to="/dictionary" className="mt-6 inline-flex min-h-11 items-center font-semibold text-primary">Browse the dictionary →</Link></main>
      <SiteFooter /></div>
  ),
  component: TermPage,
});

function TermPage() {
  const { t, ex } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <Link to="/dictionary" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground"><ArrowLeft className="h-4 w-4" /> All terms</Link>
        <article className="glass mt-4 rounded-3xl p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Swedish job-ad term</p>
          <h1 className="mt-1 text-5xl text-foreground sm:text-6xl">{t.term}</h1>
          <p className="mt-2 text-lg font-semibold text-primary">{t.english}</p>
          <h2 className="mt-6 text-xl font-semibold text-foreground">What it really means for you</h2>
          <p className="mt-1 text-muted-foreground">{t.really}</p>
          {ex && (<>
            <h2 className="mt-6 text-xl font-semibold text-foreground">Example from a job ad</h2>
            <blockquote lang="sv" className="mt-2 rounded-2xl bg-secondary p-4 text-lg text-foreground">"{ex[0]}"</blockquote>
            <p className="mt-2 text-muted-foreground">{ex[1]}</p>
          </>)}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/learn" search={{ phrase: t.term }} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"><BookOpen className="h-4 w-4" /> Mini lesson</Link>
            <Link to="/" className="glass inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold">Decode a job ad</Link>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
