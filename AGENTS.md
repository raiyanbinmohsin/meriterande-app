<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- AI calls go through createServerFn handlers in src/lib/*.functions.ts using the gateway Responses API with a strict JSON schema (newer tools share src/lib/ai.server.ts, imported dynamically inside handlers) — keeps the key server-side and output typed.
- Local-first data: tracker, CV and progress live in client stores (localStorage/memory); src/lib/sync.ts mirrors them to the user_data table only for signed-in users who accepted — the app must keep working with no account.
- Admin rights come only from public.user_roles (assigned by an auth.users trigger), checked via has_role — never from client state.
- Insights aggregation runs only in the security-definer get_insights() function with participant/k thresholds — raw events are never readable across users.
- Every table with a user_id references auth.users ON DELETE CASCADE; account deletion deletes the auth user (atomic) then verifies rows are gone — no partial deletes.
- Story submissions go only through the submitStory server function (honeypot + per-IP-hash/per-user daily limit, DB length checks); anon/authenticated have no INSERT on stories.
- Admin emails live in public.admin_emails (admin-managed); assign_admin_role reads it. get_insights() is executable only by service_role, called via the loadInsights server function after an opt-in check.
- Long AI generations (roadmap, compare, thesis) are wrapped client-side with withDeadline + LongProgress/TaskError from src/components/LongTask.tsx — a hard stop with retry instead of an indefinite spinner, since Worker background jobs are not guaranteed to finish.
- Every AI/fetch/feedback server handler first calls rateLimit(kind) from src/lib/rate-limit.server.ts (hashed user-or-IP key in rate_events, limits in src/lib/rate-limit.ts) — one shared, testable limiter.
- CV text reaches user_data only when save_cv is true (DB check constraint enforces cv = '' otherwise) — CVs are never stored server-side by default.
- Analytics go through logEvent (event name + path only, no user id/IP) into analytics_events; feedback only via sendFeedback — no client INSERT policies.
- Per-page social tags come from pageMeta()/OG_IMAGE in src/lib/seo.ts; dictionary term pages live at /dictionary/$term (dictionary_.$term.tsx) and are listed in the sitemap.xml server route.
