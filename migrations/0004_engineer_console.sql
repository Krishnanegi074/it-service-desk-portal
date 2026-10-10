CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS incidents_title_search_idx
  ON incidents USING GIN (LOWER(title) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS incidents_summary_search_idx
  ON incidents USING GIN (LOWER(summary) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS incidents_status_created_idx
  ON incidents (status, created_at DESC);
CREATE INDEX IF NOT EXISTS incidents_assignee_created_idx
  ON incidents (assigned_to, created_at DESC);

DO $migration$
BEGIN
  IF to_regnamespace('auth') IS NULL OR to_regprocedure('auth.uid()') IS NULL THEN
    RAISE NOTICE 'Supabase auth schema not found; skipping internal-note RLS policy update';
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS incident_events_select_authorized ON public.incident_events';
  EXECUTE $policy$
    CREATE POLICY incident_events_select_authorized
    ON public.incident_events FOR SELECT TO authenticated
    USING (
      (SELECT public.current_app_role()) IN ('engineer', 'admin')
      OR (
        event_type <> 'note_added'
        AND EXISTS (
          SELECT 1 FROM public.incidents
          WHERE incidents.id = incident_events.incident_id
        )
      )
    )
  $policy$;
END
$migration$;
