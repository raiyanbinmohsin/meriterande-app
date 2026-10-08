CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp
AS $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
REVOKE EXECUTE ON FUNCTION public.get_insights() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_insights() TO service_role;