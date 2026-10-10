CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  department TEXT,
  role TEXT NOT NULL DEFAULT 'employee'
    CHECK (role IN ('employee', 'engineer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE,
  reporter_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  urgency SMALLINT NOT NULL CHECK (urgency BETWEEN 1 AND 4),
  impact SMALLINT NOT NULL CHECK (impact BETWEEN 1 AND 4),
  priority VARCHAR(2) NOT NULL CHECK (priority IN ('P1', 'P2', 'P3', 'P4')),
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_triage', 'dispatched', 'resolved')),
  readiness_score NUMERIC(5,2) NOT NULL CHECK (readiness_score BETWEEN 0 AND 100),
  reporter JSONB NOT NULL,
  technical_context JSONB NOT NULL,
  assigned_to UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade databases that used the prototype's runtime-created incidents table.
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS reporter_id UUID REFERENCES app_users(id) ON DELETE SET NULL;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES app_users(id) ON DELETE SET NULL;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS diagnostic_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  slot_key TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (incident_id, slot_key)
);

CREATE TABLE IF NOT EXISTS incident_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'status_changed', 'assigned', 'note_added', 'delivery_attempted')),
  from_status VARCHAR(20),
  to_status VARCHAR(20),
  actor_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (incident_id, provider)
);

CREATE INDEX IF NOT EXISTS incidents_created_at_idx ON incidents (created_at DESC);
CREATE INDEX IF NOT EXISTS incidents_priority_status_idx ON incidents (priority, status);
CREATE INDEX IF NOT EXISTS incidents_reporter_id_idx ON incidents (reporter_id);
CREATE UNIQUE INDEX IF NOT EXISTS incidents_idempotency_key_idx ON incidents (idempotency_key);
CREATE INDEX IF NOT EXISTS incident_events_incident_created_idx ON incident_events (incident_id, created_at DESC);
CREATE INDEX IF NOT EXISTS integration_deliveries_retry_idx ON integration_deliveries (status, next_attempt_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_users_set_updated_at ON app_users;
CREATE TRIGGER app_users_set_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS incidents_set_updated_at ON incidents;
CREATE TRIGGER incidents_set_updated_at
BEFORE UPDATE ON incidents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS integration_deliveries_set_updated_at ON integration_deliveries;
CREATE TRIGGER integration_deliveries_set_updated_at
BEFORE UPDATE ON integration_deliveries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
