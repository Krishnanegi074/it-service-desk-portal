-- Supabase-specific authentication and row-level security.
-- The migration remains safe on plain PostgreSQL by skipping this block when
-- the Supabase auth schema is not present.
DO $migration$
BEGIN
  IF to_regnamespace('auth') IS NULL OR to_regprocedure('auth.uid()') IS NULL THEN
    RAISE NOTICE 'Supabase auth schema not found; skipping auth trigger and RLS policies';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_users_auth_user_fk'
  ) THEN
    EXECUTE 'ALTER TABLE public.app_users
      ADD CONSTRAINT app_users_auth_user_fk
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID';
  END IF;

  EXECUTE $function$
    CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = ''
    AS $$
    BEGIN
      INSERT INTO public.app_users (id, email, full_name, role)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(NEW.email, '@', 1)),
        'employee'
      )
      ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          updated_at = NOW();
      RETURN NEW;
    END;
    $$
  $function$;

  EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users';
  EXECUTE 'CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user()';

  EXECUTE $backfill$
    INSERT INTO public.app_users (id, email, full_name, role)
    SELECT
      id,
      email,
      COALESCE(NULLIF(raw_user_meta_data ->> 'full_name', ''), split_part(email, '@', 1)),
      'employee'
    FROM auth.users
    WHERE email IS NOT NULL
    ON CONFLICT (id) DO NOTHING
  $backfill$;

  EXECUTE $function$
    CREATE OR REPLACE FUNCTION public.current_app_role()
    RETURNS TEXT
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = ''
    AS $$
      SELECT role
      FROM public.app_users
      WHERE id = (SELECT auth.uid())
    $$
  $function$;

  EXECUTE 'REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC';

  EXECUTE 'ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.diagnostic_answers ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.incident_events ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.integration_deliveries ENABLE ROW LEVEL SECURITY';

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.app_users, public.incidents,
      public.diagnostic_answers, public.incident_events,
      public.integration_deliveries FROM anon';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.app_users, public.incidents,
      public.diagnostic_answers, public.incident_events,
      public.integration_deliveries FROM authenticated';
    EXECUTE 'GRANT SELECT ON public.app_users TO authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.incidents TO authenticated';
    EXECUTE 'GRANT SELECT ON public.diagnostic_answers, public.incident_events TO authenticated';
    EXECUTE 'GRANT SELECT, UPDATE ON public.integration_deliveries TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated';
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS app_users_select_authorized ON public.app_users';
  EXECUTE $policy$
    CREATE POLICY app_users_select_authorized
    ON public.app_users FOR SELECT TO authenticated
    USING (
      id = (SELECT auth.uid())
      OR (SELECT public.current_app_role()) IN ('engineer', 'admin')
    )
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS incidents_select_authorized ON public.incidents';
  EXECUTE $policy$
    CREATE POLICY incidents_select_authorized
    ON public.incidents FOR SELECT TO authenticated
    USING (
      reporter_id = (SELECT auth.uid())
      OR (SELECT public.current_app_role()) IN ('engineer', 'admin')
    )
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS incidents_insert_own ON public.incidents';
  EXECUTE $policy$
    CREATE POLICY incidents_insert_own
    ON public.incidents FOR INSERT TO authenticated
    WITH CHECK (
      reporter_id = (SELECT auth.uid())
      AND status = 'open'
    )
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS incidents_update_staff ON public.incidents';
  EXECUTE $policy$
    CREATE POLICY incidents_update_staff
    ON public.incidents FOR UPDATE TO authenticated
    USING ((SELECT public.current_app_role()) IN ('engineer', 'admin'))
    WITH CHECK ((SELECT public.current_app_role()) IN ('engineer', 'admin'))
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS diagnostic_answers_select_authorized ON public.diagnostic_answers';
  EXECUTE $policy$
    CREATE POLICY diagnostic_answers_select_authorized
    ON public.diagnostic_answers FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.incidents
        WHERE incidents.id = diagnostic_answers.incident_id
      )
    )
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS incident_events_select_authorized ON public.incident_events';
  EXECUTE $policy$
    CREATE POLICY incident_events_select_authorized
    ON public.incident_events FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.incidents
        WHERE incidents.id = incident_events.incident_id
      )
    )
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS integration_deliveries_select_staff ON public.integration_deliveries';
  EXECUTE $policy$
    CREATE POLICY integration_deliveries_select_staff
    ON public.integration_deliveries FOR SELECT TO authenticated
    USING ((SELECT public.current_app_role()) IN ('engineer', 'admin'))
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS integration_deliveries_update_staff ON public.integration_deliveries';
  EXECUTE $policy$
    CREATE POLICY integration_deliveries_update_staff
    ON public.integration_deliveries FOR UPDATE TO authenticated
    USING ((SELECT public.current_app_role()) IN ('engineer', 'admin'))
    WITH CHECK ((SELECT public.current_app_role()) IN ('engineer', 'admin'))
  $policy$;
END
$migration$;

CREATE INDEX IF NOT EXISTS incidents_assigned_to_idx ON incidents (assigned_to);
