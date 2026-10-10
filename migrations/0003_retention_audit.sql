CREATE TABLE IF NOT EXISTS retention_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retention_days INTEGER NOT NULL CHECK (retention_days BETWEEN 30 AND 3650),
  cutoff_at TIMESTAMPTZ NOT NULL,
  deleted_incidents INTEGER NOT NULL CHECK (deleted_incidents >= 0),
  actor_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS retention_runs_created_at_idx
  ON retention_runs (created_at DESC);

DO $migration$
BEGIN
  IF to_regnamespace('auth') IS NULL OR to_regprocedure('auth.uid()') IS NULL THEN
    RAISE NOTICE 'Supabase auth schema not found; skipping retention_runs RLS policy';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.retention_runs ENABLE ROW LEVEL SECURITY';

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.retention_runs FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.retention_runs FROM authenticated';
    EXECUTE 'GRANT SELECT ON TABLE public.retention_runs TO authenticated';
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS retention_runs_select_admin ON public.retention_runs';
  EXECUTE $policy$
    CREATE POLICY retention_runs_select_admin
    ON public.retention_runs FOR SELECT TO authenticated
    USING ((SELECT public.current_app_role()) = 'admin')
  $policy$;
END
$migration$;
