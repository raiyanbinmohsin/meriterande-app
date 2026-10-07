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
