-- schema_migrations is created by the migration runner (scripts/migrate.mjs), not by
-- a numbered migration, so earlier migrations never restricted it. On Supabase the
-- browser roles (anon, authenticated) receive default privileges on every table in
-- the public schema, which would let anyone holding the publishable key read or alter
-- the migration history. The runner connects as the table owner, which bypasses row
-- level security, so enabling it with no policies leaves the runner unaffected.
DO
$migration$
BEGIN
  EXECUTE 'ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY';

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.schema_migrations FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.schema_migrations FROM authenticated';
  END IF;
END
$migration$;
