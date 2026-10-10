CREATE TABLE IF NOT EXISTS intake_sessions (
  id UUID PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'started'
    CHECK (status IN ('started', 'completed')),
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CHECK (
    (status = 'started' AND completed_at IS NULL)
    OR (status = 'completed' AND completed_at IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS pilot_feedback (
  incident_id UUID PRIMARY KEY REFERENCES incidents(id) ON DELETE CASCADE,
  routing_accurate BOOLEAN NOT NULL,
  clarification_count INTEGER NOT NULL DEFAULT 0
    CHECK (clarification_count BETWEEN 0 AND 20),
  submitted_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS intake_sessions_status_started_idx
  ON intake_sessions (status, started_at);
CREATE INDEX IF NOT EXISTS intake_sessions_incident_idx
  ON intake_sessions (incident_id) WHERE incident_id IS NOT NULL;

DROP TRIGGER IF EXISTS pilot_feedback_set_updated_at ON pilot_feedback;
CREATE TRIGGER pilot_feedback_set_updated_at
BEFORE UPDATE ON pilot_feedback
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DO $migration$
BEGIN
  IF to_regnamespace('auth') IS NULL OR to_regprocedure('auth.uid()') IS NULL THEN
    RAISE NOTICE 'Supabase auth schema not found; skipping pilot measurement RLS policies';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.intake_sessions ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.pilot_feedback ENABLE ROW LEVEL SECURITY';

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.intake_sessions, public.pilot_feedback FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.intake_sessions, public.pilot_feedback FROM authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.pilot_feedback TO authenticated';
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS pilot_feedback_staff_all ON public.pilot_feedback';
  EXECUTE $policy$
    CREATE POLICY pilot_feedback_staff_all
    ON public.pilot_feedback FOR ALL TO authenticated
    USING ((SELECT public.current_app_role()) IN ('engineer', 'admin'))
    WITH CHECK ((SELECT public.current_app_role()) IN ('engineer', 'admin'))
  $policy$;
END
$migration$;
