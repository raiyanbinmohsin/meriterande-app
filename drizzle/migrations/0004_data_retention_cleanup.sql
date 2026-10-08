CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.purge_expired_data()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  DELETE FROM public.analytics_events WHERE created_at < now() - interval '13 months';
  DELETE FROM public.feedback WHERE created_at < now() - interval '24 months';
  UPDATE public.stories SET ip_hash = NULL WHERE ip_hash IS NOT NULL AND created_at < now() - interval '48 hours';
  DELETE FROM public.rate_events WHERE created_at < now() - interval '24 hours';
$$;

REVOKE EXECUTE ON FUNCTION public.purge_expired_data() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('purge-expired-data', '15 * * * *', 'SELECT public.purge_expired_data()');