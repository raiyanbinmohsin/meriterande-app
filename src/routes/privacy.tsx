import { Link, createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/landing";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: pageMeta("Privacy — Meriterande", "Who is responsible for your data, what Meriterande stores, why, for how long, who processes it, and how to export or delete it.") }),
  component: Privacy,
});

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-8 text-2xl font-semibold text-foreground">{children}</h2>;
const MAIL = "raiyanbinmohsinshishir@gmail.com";
const A = "text-primary underline-offset-4 hover:underline";

function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 text-muted-foreground sm:py-16 [&_li]:mt-2 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:ps-5">
        <h1 className="text-5xl text-foreground">Privacy</h1>
        <p className="mt-2 text-sm">Last updated: 8 October 2026</p>
        <p className="mt-3 text-lg">Short version: you don't need an account, your CV stays in your browser unless you choose otherwise, and you can download or delete your data at any time.</p>

        <H>Who is responsible</H>
        <p className="mt-2">The data controller is <strong>Md Raiyan Bin Mohsin, Uppsala, Sweden</strong>. Contact: <a href={`mailto:${MAIL}`} className={A}>{MAIL}</a>.</p>

        <H>What we process and why</H>
        <ul>
          <li><strong>Decodes and AI tools you ask for</strong> (job ads, CV text, cover letters, roadmaps, thesis pitches, interview answers, employer reviews, job search): sent to our server and AI provider only to produce the answer you requested. Legal basis: <em>contract</em> — providing the service you ask for. Not stored by us.</li>
          <li><strong>Link reading:</strong> when you paste a link, our server fetches that page once to read the ad. Legal basis: <em>contract</em>.</li>
          <li><strong>Account</strong> (email address, securely hashed password) and <strong>synced data</strong> (tracker cards, roadmap progress, learned phrases). Legal basis: <em>consent</em> — you choose to create an account.</li>
          <li><strong>Saved CV:</strong> only if you turn on "Save my CV to my account". Off by default. Legal basis: <em>consent</em>.</li>
          <li><strong>Insights opt-in:</strong> for each decode with a CV we store the job title, fit score and gap names. These records are <strong>linked to your account</strong> until you opt out or delete your account (both delete them). Others only ever see anonymous totals, and only once at least 10 people have joined. Legal basis: <em>consent</em>.</li>
          <li><strong>Success stories:</strong> what you write in the form. Shown publicly only after review and with your consent. Legal basis: <em>consent</em>.</li>
          <li><strong>Feedback:</strong> your message, the page you sent it from and, if signed in, your account. Legal basis: <em>legitimate interests</em> — improving the app.</li>
          <li><strong>Usage limits and security:</strong> a one-way scrambled code of your account or IP address with the time of each AI or link request. Stories also keep a scrambled IP code to stop spam. Legal basis: <em>legitimate interests</em> — preventing abuse.</li>
          <li><strong>Usage counts:</strong> anonymous events such as "decode completed" with the page path and time. No user id, IP address or cookies. Legal basis: <em>legitimate interests</em>.</li>
        </ul>

        <H>In your browser</H>
        <p className="mt-2">Your tracker, recent decodes, roadmap progress, learned phrases and sign-in session are saved in this browser's local storage so the app works. Your CV is kept in memory and disappears when you close the tab. We use no tracking cookies and no advertising or third-party analytics.</p>

        <H>How long we keep it</H>
        <ul>
          <li><strong>Ads, CVs and AI answers you don't save:</strong> not stored.</li>
          <li><strong>Account, synced data, saved CV:</strong> until you delete them or your account. Turning off "Save my CV" deletes the stored CV.</li>
          <li><strong>Insight records:</strong> until you opt out or delete your account.</li>
          <li><strong>Stories:</strong> until you ask us to remove them or delete your account. The scrambled IP code is removed after 48 hours.</li>
          <li><strong>Feedback:</strong> 24 months, then deleted automatically.</li>
          <li><strong>Usage counts:</strong> 13 months, then deleted automatically.</li>
          <li><strong>Usage-limit records:</strong> 24 hours, then deleted automatically.</li>
          <li><strong>Browser data:</strong> until you clear it.</li>
        </ul>

        <H>Who processes it for us</H>
        <ul>
          <li><strong>Lovable Cloud</strong> — hosting, database and sign-in.</li>
          <li><strong>OpenAI, via the Lovable AI Gateway</strong> — AI processing of the text you send.</li>
          <li><strong>Cloudflare</strong> — edge hosting that delivers the app.</li>
        </ul>
        <p className="mt-2">AI processing and some hosting may happen outside the EEA (for example in the USA). This is covered by the providers' data processing terms and their safeguards for international transfers.</p>

        <H>Your rights</H>
        <p className="mt-2">Under the GDPR you have the right to:</p>
        <ul>
          <li><strong>Access</strong> your data and get a copy.</li>
          <li><strong>Rectification</strong> — correct data that is wrong.</li>
          <li><strong>Erasure</strong> — have your data deleted.</li>
          <li><strong>Restriction</strong> — limit how we use it.</li>
          <li><strong>Objection</strong> — object to processing based on legitimate interests.</li>
          <li><strong>Portability</strong> — receive your data in a machine-readable format.</li>
          <li><strong>Withdraw consent</strong> at any time, without affecting earlier processing.</li>
        </ul>
        <p className="mt-2">You can also complain to the Swedish data protection authority, <a href="https://www.imy.se" target="_blank" rel="noreferrer" className={A}>Integritetsskyddsmyndigheten (IMY)</a>.</p>

        <H>Export and delete</H>
        <ul>
          <li><strong>Download my data:</strong> in <Link to="/account" className={A}>My data</Link> you get one file with your email, tracker, CV, progress, stories, feedback and insight records.</li>
          <li><strong>Delete my account and data:</strong> in My data. This permanently removes your account, synced data, CV, insight records, and any stories and feedback sent while signed in — and can also clear this browser.</li>
          <li><strong>Without an account:</strong> clear this site's data in your browser settings. For stories or feedback sent while signed out, email us.</li>
        </ul>

        <H>Contact</H>
        <p className="mt-2">Questions or requests? Email <a href={`mailto:${MAIL}`} className={A}>{MAIL}</a>.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
