import { Link, createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/landing";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: pageMeta("Privacy — Meriterande", "What Meriterande stores, where it's stored, and how to delete it. No account needed; your CV stays in your browser unless you choose to save it.") }),
  component: Privacy,
});

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-8 text-2xl font-semibold text-foreground">{children}</h2>;

function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 text-muted-foreground sm:py-16 [&_li]:mt-2 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:ps-5">
        <h1 className="text-5xl text-foreground">Privacy</h1>
        <p className="mt-3 text-lg">Short version: you don't need an account, your CV stays in your browser unless you choose otherwise, and you can delete everything at any time.</p>

        <H>Without an account</H>
        <ul>
          <li><strong>In your browser only:</strong> your tracker, recent decodes, roadmap progress and learned phrases are saved in this browser's local storage. Your CV is kept in memory and disappears when you close the tab.</li>
          <li><strong>Sent for processing, not stored:</strong> when you decode an ad, write a cover letter, build a roadmap or practise an interview, the text is sent to our server and to our AI provider to produce the answer. We don't save the ad or CV text.</li>
          <li><strong>Link reading:</strong> if you paste a link, our server fetches that page once to read the ad.</li>
        </ul>

        <H>With an optional account</H>
        <ul>
          <li><strong>Account:</strong> your email address and a securely hashed password.</li>
          <li><strong>Synced data:</strong> tracker cards, roadmap progress and learned phrases, so they follow you across devices.</li>
          <li><strong>CV:</strong> only stored if you turn on "Save my CV to my account" in My data. It's off by default, and turning it off deletes the stored CV.</li>
          <li><strong>Anonymous insights (opt-in):</strong> job title, fit score and gap names — never your name, email, CV or ad — shown only as totals once at least 10 people have joined.</li>
        </ul>

        <H>Other things we store</H>
        <ul>
          <li><strong>Usage counts:</strong> anonymous events such as "decode completed" with the page path and time. No user id, IP address or cookies.</li>
          <li><strong>Usage limits:</strong> to prevent abuse we keep a one-way scrambled code of your account or connection with the time of each AI request, for up to a day.</li>
          <li><strong>Stories and feedback:</strong> only what you write in those forms. Stories appear publicly only after review and with your consent.</li>
        </ul>

        <H>Where it's stored</H>
        <p className="mt-2">Account data is stored in our secure cloud database, protected so each person can only read their own data. AI requests are processed by our AI provider to generate answers and are not stored by us.</p>

        <H>How to delete it</H>
        <ul>
          <li><strong>Browser data:</strong> clear this site's data in your browser settings, or delete cards in the tracker.</li>
          <li><strong>Account data:</strong> open <Link to="/account" className="text-primary underline-offset-4 hover:underline">My data</Link> and choose "Delete my account and data". This permanently removes your account, synced data, CV, insight data, and any stories and feedback you sent while signed in — and can also clear this browser.</li>
          <li><strong>Download first:</strong> "Download my data" in My data gives you a copy.</li>
        </ul>

        <H>Contact</H>
        <p className="mt-2">Questions? Email <a href="mailto:raiyanbinmohsinshishir@gmail.com" className="text-primary underline-offset-4 hover:underline">raiyanbinmohsinshishir@gmail.com</a>.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
