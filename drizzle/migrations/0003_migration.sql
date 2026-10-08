-- Rate limit log (hashed caller key only; server-only access)
create table public.rate_events (
  id bigint generated always as identity primary key,
  key_hash text not null,
  kind text not null,
  created_at timestamptz not null default now()
);
create index rate_events_lookup on public.rate_events (key_hash, kind, created_at);
grant all on public.rate_events to service_role;
alter table public.rate_events enable row level security;

-- Feedback
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 3 and 1000),
  page text check (char_length(page) <= 200),
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
grant select, delete on public.feedback to authenticated;
grant all on public.feedback to service_role;
alter table public.feedback enable row level security;
create policy "Admins read feedback" on public.feedback for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete feedback" on public.feedback for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Privacy-friendly analytics: event name + page path only, no user id, no IP
create table public.analytics_events (
  id bigint generated always as identity primary key,
  name text not null check (name in ('decode_started','decode_completed','roadmap_generated','share_card_downloaded','tracker_card_saved','thesis_pitch_generated')),
  path text check (char_length(path) <= 200),
  created_at timestamptz not null default now()
);
grant select on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;
alter table public.analytics_events enable row level security;
create policy "Admins read analytics" on public.analytics_events for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- CV is stored server-side only when the signed-in user opts in
alter table public.user_data add column save_cv boolean not null default false;
update public.user_data set cv = '' where not save_cv;
alter table public.user_data add constraint cv_only_when_opted_in check (save_cv or cv = '');
alter table public.user_data add constraint cv_length check (char_length(cv) <= 20000);