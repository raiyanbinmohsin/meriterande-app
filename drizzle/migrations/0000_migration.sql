create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.assign_admin_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = 'md-raiyan.bin-mohsin.4326@student.uu.se' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created_assign_admin after insert on auth.users
  for each row execute function public.assign_admin_role();

-- Synced personal data, one row per user
create table public.user_data (
  user_id uuid primary key,
  tracker jsonb not null default '[]'::jsonb,
  cv text not null default '',
  progress jsonb not null default '{}'::jsonb,
  share_insights boolean not null default false,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.user_data to authenticated;
grant all on public.user_data to service_role;
alter table public.user_data enable row level security;
create policy "Own data select" on public.user_data for select to authenticated using (auth.uid() = user_id);
create policy "Own data insert" on public.user_data for insert to authenticated with check (auth.uid() = user_id);
create policy "Own data update" on public.user_data for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own data delete" on public.user_data for delete to authenticated using (auth.uid() = user_id);

-- Anonymous skill-gap events (only from opted-in users)
create table public.insight_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  job_title text not null check (char_length(job_title) <= 200),
  fit_score integer check (fit_score between 0 and 100),
  gaps text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.insight_events to authenticated;
grant all on public.insight_events to service_role;
alter table public.insight_events enable row level security;
create policy "Own events select" on public.insight_events for select to authenticated using (auth.uid() = user_id);
create policy "Opted-in insert" on public.insight_events for insert to authenticated
  with check (auth.uid() = user_id and exists (select 1 from public.user_data d where d.user_id = auth.uid() and d.share_insights));
create policy "Own events delete" on public.insight_events for delete to authenticated using (auth.uid() = user_id);

create or replace function public.get_insights()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.user_data where share_insights;
  if n < 10 then return jsonb_build_object('ready', false); end if;
  return jsonb_build_object(
    'ready', true,
    'gaps', coalesce((select jsonb_agg(x) from (
      select g as label, count(distinct e.user_id) as people from public.insight_events e
      join public.user_data d on d.user_id = e.user_id and d.share_insights,
      lateral unnest(e.gaps) as raw, lateral (select lower(trim(raw)) as g) t
      group by g having count(distinct e.user_id) >= 3 order by 2 desc limit 10) x), '[]'::jsonb),
    'titles', coalesce((select jsonb_agg(x) from (
      select lower(trim(e.job_title)) as label, count(distinct e.user_id) as people,
        round(avg(e.fit_score))::int as avg_score from public.insight_events e
      join public.user_data d on d.user_id = e.user_id and d.share_insights
      group by 1 having count(distinct e.user_id) >= 3 order by 2 desc limit 10) x), '[]'::jsonb),
    'avg_score', (select round(avg(e.fit_score))::int from public.insight_events e
      join public.user_data d on d.user_id = e.user_id and d.share_insights where e.fit_score is not null)
  );
end $$;
revoke execute on function public.get_insights() from public, anon;
grant execute on function public.get_insights() to authenticated;

-- Success stories with manual approval
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  name text check (name is null or char_length(name) <= 80),
  role text not null check (char_length(role) between 2 and 120),
  story text not null check (char_length(story) between 20 and 1200),
  consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
grant select, insert on public.stories to anon;
grant select, insert, update, delete on public.stories to authenticated;
grant all on public.stories to service_role;
alter table public.stories enable row level security;
create policy "Submit pending story" on public.stories for insert to anon, authenticated
  with check (status = 'pending' and consent = true);
create policy "Read approved stories" on public.stories for select to anon, authenticated
  using (status = 'approved' or public.has_role(auth.uid(), 'admin'));
create policy "Admins update stories" on public.stories for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete stories" on public.stories for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));