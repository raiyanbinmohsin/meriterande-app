# Meriterande

**Decode any Swedish job ad in 5 seconds — then close the gap.**

Meriterande turns a dense Swedish job advertisement into a plain-language,
structured answer: what the role actually is, which requirements are hard
requirements and which are nice-to-haves, whether the language requirement is
real, what the hidden signals mean (`meriterande`, `provanställning`,
`kollektivavtal`, `löpande urval`, `B-körkort`…), and — if you paste your CV —
how well you actually fit and what to do about the gaps.

Live: **https://meriterande-app.lovable.app**

<!-- Replace this placeholder with a real screenshot: public/og-image.jpg is the
     current social preview (1200x630). Save the app screenshot at
     docs/screenshot.png and update the path below. -->
![Meriterande — decoder showing a fit-score gauge, must-haves, Swedish-language verdict and hidden signals](docs/screenshot.png)

---

## The problem

International job seekers in Sweden read job ads they can't fully judge.
Swedish recruitment language is full of unwritten rules:

- `meriterande` reads like a requirement but usually means "a plus".
- `provanställning` is a probation period, `tillsvidareanställning` is permanent.
- `löpande urval` means the ad can close early if the right person applies.
- A `flytande svenska` line can be a genuine requirement or a lazy copy-paste.

Candidates either self-reject from jobs they could have won, or spend hours
applying to roles they were never going to get. Existing tools either parse a CV
against a job description, or translate the words — none of them explain what
the ad *means* in the Swedish labour market.

Meriterande answers three questions instead: **what do they really want, do I
fit, and what should I do next?**

## Features

### Decoder (the core)

- Paste an ad, paste a link, or drag-drop a CV (PDF via `pdfjs-dist`, `.docx`
  via `mammoth`) into an editable text area.
- Structured output: role summary, must-haves, nice-to-haves, a
  **Swedish-language verdict** (Required / Helpful / Not needed) with a quoted
  reason from the ad, and **hidden signals** explained in plain language.
- With a CV: **fit score 0–100** gauge, top 3 strengths, top 3 gaps, and a
  one-sentence angle for your application.
- **Roast mode** ("Brutally honest 🔥") — savage about the gap, never about you.
- Explanation language (12 languages, RTL for Arabic/Persian); quoted Swedish
  phrases are always kept in the original.
- Country selector: Sweden, Norway, Denmark, Finland, Germany, Netherlands —
  the prompts decode for that market.
- Link reader: fetches the page server-side, prefers embedded **schema.org
  JobPosting JSON-LD** (Teamtailor and many career sites), strips nav/footers.
  Sites that block automatic reading get a clear fallback message — never a
  raw error, and never a bypass.
- Share card (canvas export), **cover letter generator** (tone/length/language,
  `.docx` or copy), and a "Check salary statistics" link to the official
  statistics office for the selected country (SCB, SSB, Danmarks Statistik,
  Statistics Finland, Destatis, CBS). Salary numbers are never invented.

### Close the gap

- Hours-per-week slider, learning preference, target date → an honest verdict
  (**Apply now / Apply in ~X weeks / Long-term target**) that never pretends
  years of experience close in days.
- Five-milestone roadmap: goal, 2–4 tasks sized to your hours, checkboxes,
  proof-of-skill for the CV, projected fit score per milestone, fit-score chart
  and progress bar, and a downloadable PDF plan.
- **Verified learning resources**: the AI never writes a URL. It returns a skill
  name, a search query and which platforms fit; the app builds links from a
  hard-coded catalog of official docs, Microsoft Learn, Coursera, edX,
  freeCodeCamp, Kaggle Learn, MIT OCW, Elements of AI, YouTube, SFI, Duolingo,
  Google Scholar and arXiv.

### Compare, find, thesis

- **Compare up to 3 ads** side-by-side (fit, language, must-haves met, time to
  close) with a "apply to this one first, because…" recommendation; pick ads
  from your tracker or recent decodes instead of pasting.
- **/find**: search Platsbanken through the JobTech API with your CV attached
  and get an AI fit score and one-line reason per result.
- **/thesis**: three tailored thesis ideas for a programme + target company,
  with readiness gauges, a cold email, a LinkedIn note, interview prep and a
  prep roadmap.

### Practice and learn

- **/interview**: mock interview that asks your five prepared questions one at a
  time, scored out of 10 per answer with what was strong, what to improve and a
  stronger version built only from CV facts. Voice answers via the browser's
  speech recognition, with an English / Svenska toggle.
- **/learn**: micro-lessons for phrases found in your ads (meaning, sv-SE
  pronunciation via browser TTS, example sentence, 3-question quiz) plus a
  25-phrase starter deck of essential Swedish workplace terms.

### Track and contribute

- **/tracker**: local-first kanban (Saved / Applied / Interview / Offer /
  Rejected) with drag-and-drop, notes, deadlines ("X days left", overdue in
  red), streaks, stats, CSV export, and All / Jobs / Thesis pitches filters.
- **/employers**: paste your own ad and get an clarity score, exclusionary
  phrases highlighted with rewrites, and a clearer rewritten version.
- **/insights**: opt-in, aggregated skill-gap and fit data for career centres —
  shown only once 10 people have opted in, computed inside a security-definer
  function so raw events are never readable across users.
- **Success stories** with moderation (pending → admin-approved), never seeded
  with fake testimonials.
- **Dictionary** with 52 Swedish recruitment terms, tooltip-linked from decoded
  ads, and one SEO page per term (`/dictionary/meriterande`).
- **Bookmarklet** ("Add to browser") that opens Meriterande with the current
  page URL and your selected text; touch devices get manual bookmark steps.
- Optional accounts: email sign-up with confirmation, cross-device sync of
  tracker/CV/progress, data export and one-click account deletion.

## Tech stack and architecture

| Layer | Choice |
| --- | --- |
| Framework | TanStack Start v1 (React 19, file-based routing, SSR + server functions) |
| Build / runtime | Vite 8 + Nitro, deployed to an edge (Cloudflare Workers) target |
| Styling | Tailwind CSS v4 (theme tokens in `src/styles.css`), Radix UI primitives |
| State / data | TanStack Query, React Hook Form + Zod, localStorage-first client stores |
| Backend | Lovable Cloud (Postgres + auth + RLS) via `@supabase/supabase-js` |
| AI | Lovable AI Gateway (Responses API), strict JSON-schema outputs |
| Docs export | jsPDF (plan PDF), `docx` (cover letter), canvas (share cards) |
| Tests | Vitest + Testing Library (`src/test/rules.test.ts`) |

### Frontend

`src/routes/` is the route tree: `index.tsx` (decoder), `thesis.tsx`,
`tracker.tsx`, `find.tsx`, `dictionary.tsx` + `dictionary_.$term.tsx`,
`learn.tsx`, `interview.tsx`, `employers.tsx`, `insights.tsx`, `privacy.tsx`,
`auth.tsx`, `reset-password.tsx`, `sitemap[.]xml.ts`, and a
`_authenticated/` layout for `account.tsx` and `admin.tsx`. Shared UI lives in
`src/components/` (including `LongTask.tsx` for long generations,
`Resources.tsx`, `CompareTable.tsx`, `AccountMenu.tsx`, and the original SVG
illustrations in `illustrations.tsx`).

### Server functions

Every AI or network call is a `createServerFn` in `src/lib/*.functions.ts`:
`decodeAd`, `buildPlan`, `recommendAd`, `generatePitch` / `pitchForIdea` /
`extractSkills`, `findJobs`, `writeCoverLetter`, `interviewQuestions` /
`gradeAnswer` / `interviewSummary`, `microLesson`, `reviewEmployerAd`,
`fetchAd`, `submitStory`, `sendFeedback`, `logEvent`, `loadInsights`,
`exportMyServerData`, `deleteMyAccount`. Handlers run server-side, so the AI key
(`LOVABLE_API_KEY`) never reaches the browser, and each handler validates input
and applies rate limits before spending a request.

### AI gateway

`src/lib/ai.server.ts` is the single structured-JSON helper: one POST to
`https://ai.gateway.lovable.dev/v1/responses` with `store: false`, a strict
`json_schema` response format, and typed parsing. Prompts carry a `FACTS_ONLY`
rule — the model may use only facts present in the CV and the ad, must say
"not specified" instead of guessing, and must never invent requirements, URLs,
numbers or employers. Heavier tasks use `openai/gpt-6-astra`; the compare-mode
final step uses the faster `openai/gpt-6-luna`. Long generations (roadmap,
thesis, find) stream where the endpoint supports it.

### Long-running generations

Roadmap, compare and thesis runs show real progress: an elapsed timer, step
labels and an expected duration. If a request stalls, a client-side deadline
(`withDeadline`, 90 s) stops it and shows a friendly error with a **Try again**
button that keeps every input. A job queue was deliberately not used: worker
background jobs are not guaranteed to finish after the response is sent, so a
hard stop with retry is the more honest behaviour. Scheduled database work
(retention, below) does run as a real background job via `pg_cron`.

### Database and RLS

Application tables in `public`, each with row-level security:

| Table | Purpose | Who can read it |
| --- | --- | --- |
| `user_roles` | `admin` flag, assigned by an `auth.users` insert trigger reading `admin_emails` | own row; admins |
| `user_data` | synced tracker/CV/progress, `save_cv` opt-in with a `CHECK (save_cv or cv = '')` | owner only |
| `insight_events` | opt-in anonymous skill-gap events | owner; aggregates via `get_insights()` |
| `stories` | success stories, `status = pending|approved|rejected`, length CHECKs | approved rows public; admins all |
| `feedback` | "What should we build next?" messages | admins only |
| `analytics_events` | event name + path only | admins only |
| `rate_events` | hashed limit key, kind, timestamp | nobody (service role only) |
| `admin_emails` | admin-managed list feeding the role trigger | admins only |

`has_role()` is security-invoker with a fixed `search_path`, so admin checks
come from the database and never from client state. `get_insights()` is a
security-definer function executable only by the service role, called through
`loadInsights` after an opt-in check, and enforces participant/k thresholds
before returning anything.

### Rate limiting and input caps

`src/lib/rate-limit.ts` holds the hourly limits (20 decodes, 10 roadmaps,
20 compares, 15 thesis, 15 cover letters, 60 interview gradings, 40 lessons,
15 employer reviews, 15 searches, 30 link fetches, 5 feedback messages).
`src/lib/rate-limit.server.ts` builds the key as a SHA-256 hash of the user id
or the request IP, records one row in `rate_events`, and returns a friendly
"you've hit the limit" message. Inputs are capped at 15,000 characters for a job
ad and 20,000 for a CV, with a clear message rather than a silent truncation.
`pg_cron` runs `purge_expired_data()` at minute 15 of every hour.

### Retention

`purge_expired_data()` deletes analytics events older than 13 months, feedback
older than 24 months and rate-limit rows older than 24 hours, and nulls
`stories.ip_hash` after 48 hours. The function is `SECURITY DEFINER` with a
fixed `search_path` and is not executable by `anon` or `authenticated`.

## Privacy by design

- **Local-first.** The tracker, CV text and roadmap progress live in the
  browser (localStorage/memory). An account is optional and never required; the
  whole app works signed out.
- **CVs stay local by default.** Text reaches the database only when the user is
  signed in *and* has turned on "Save my CV to my account" — enforced by a
  `CHECK` constraint, not just by UI.
- **No cookies, no third-party analytics.** Six event names are counted
  (`decode_started`, `decode_completed`, `roadmap_generated`,
  `share_card_downloaded`, `tracker_card_saved`, `thesis_pitch_generated`) with
  the page path and nothing else — no user id, no IP, no fingerprint.
- **IPs are hashed** for rate limiting and story anti-spam, story IP hashes are
  nulled after 48 hours, and rate-limit rows expire within 24 hours.
- **AI requests are not retained** by the provider (`store: false`), and every
  AI feature is prompt-bound to facts the user supplied.
- **No bypassing site blocks.** The link reader refuses internal/private
  addresses, never works around LinkedIn or similar blocks, and tells the user
  to paste instead.
- **Export and delete.** "Download my data" returns the account's tracker/CV/
  progress, stories, feedback and insight events as JSON. "Delete my account and
  data" removes the auth user and every row that references it (all `user_id`
  columns are `ON DELETE CASCADE`), then verifies nothing remains and reports
  honestly if something failed.
- **Nothing invented for marketing.** No fake testimonials, user counts, company
  logos or AI-generated job requirements; stories appear only after manual
  approval.

## Run it locally

Requires Node.js 20+ (or Bun) and a Lovable Cloud project.

```sh
git clone <this-repository-url>
cd meriterande
npm install          # or: bun install
cp .env.example .env # fill in the values from your Lovable Cloud project
npm run dev          # http://localhost:8080
```

Environment variables (server-side and browser-side copies of the same
project):

| Variable | Used for |
| --- | --- |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | backend project URL |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable API key |
| `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` | project ref |
| `LOVABLE_API_KEY` | AI Gateway access (server only — never prefix with `VITE_`) |

Other scripts:

```sh
npm run build        # production build
npm run preview      # serve the production build
npm test             # vitest run (limits, JSON-LD extraction, deadline rules)
npm run lint         # eslint
npm run format       # prettier
```

Database migrations are in `drizzle/migrations/` (`0000` schema, `0001`
security hardening + cascades, `0002` locked definer functions, `0003` rate
limits/feedback/analytics, `0004` retention cleanup). Apply them through your
Lovable Cloud project rather than editing managed tables directly.

## Repo layout

```text
src/
  routes/        file-based routes (decoder, thesis, tracker, find, dictionary,
                 learn, interview, employers, insights, privacy, auth, admin)
  components/    UI: LongTask, Resources, CompareTable, CoverLetter, CvUpload,
                 AdLinkFetch, AccountMenu, FeedbackButton, illustrations
  lib/           *.functions.ts server functions, ai.server.ts, rate-limit*,
                 sync.ts, progress.ts, tracker.ts, dictionary.ts, learning.ts
  styles.css     Tailwind v4 theme tokens (light + dark)
drizzle/         migrations and snapshots
supabase/        backend config
public/          favicon, og-image.jpg, robots.txt
```

## License

MIT — see [LICENSE](LICENSE).

Built at Lovable Buildathon, Uppsala University.
