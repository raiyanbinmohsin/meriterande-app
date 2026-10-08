-- 1. Cascade FKs to auth.users
DELETE FROM public.user_data WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.insight_events WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users);
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_data ADD CONSTRAINT user_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.insight_events ADD CONSTRAINT insight_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Stories: server-only inserts, limits, rate-limit columns
DROP POLICY IF EXISTS "Submit pending story" ON public.stories;
REVOKE INSERT ON public.stories FROM anon, authenticated;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS ip_hash text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.stories ADD CONSTRAINT stories_story_len CHECK (length(story) BETWEEN 1 AND 1200);
ALTER TABLE public.stories ADD CONSTRAINT stories_name_len CHECK (name IS NULL OR length(name) <= 80);
ALTER TABLE public.stories ADD CONSTRAINT stories_role_len CHECK (length(role) BETWEEN 1 AND 120);
CREATE INDEX IF NOT EXISTS stories_ip_created ON public.stories (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS stories_user_created ON public.stories (user_id, created_at);
DROP POLICY IF EXISTS "Read approved stories" ON public.stories;
CREATE POLICY "Anon read approved stories" ON public.stories FOR SELECT TO anon USING (status = 'approved');
CREATE POLICY "Read approved or admin" ON public.stories FOR SELECT TO authenticated USING (status = 'approved' OR public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.stories FROM anon;
GRANT SELECT (id, name, role, story, status, created_at) ON public.stories TO anon;

-- 3. Admin emails
CREATE TABLE public.admin_emails (
  email text PRIMARY KEY CHECK (email = lower(email) AND length(email) <= 254),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.admin_emails TO authenticated;
GRANT ALL ON public.admin_emails TO service_role;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read admin emails" ON public.admin_emails FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add admin emails" ON public.admin_emails FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins remove admin emails" ON public.admin_emails FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.admin_emails (email) VALUES ('md-raiyan.bin-mohsin.4326@student.uu.se');

-- 4. Functions with fixed search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

CREATE OR REPLACE FUNCTION public.assign_admin_role()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
begin
  if exists (select 1 from public.admin_emails where email = lower(new.email)) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;

CREATE OR REPLACE FUNCTION public.get_insights()
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $function$
declare n int;
begin
  select count(*) into n from public.user_data where share_insights;
  if n < 10 then return jsonb_build_object('ready', false, 'joined', n, 'needed', 10); end if;
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
end $function$;

REVOKE EXECUTE ON FUNCTION public.assign_admin_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_insights() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_insights() TO authenticated, service_role;