ALTER TABLE integration_deliveries
  ADD COLUMN IF NOT EXISTS external_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS integration_deliveries_provider_external_idx
  ON integration_deliveries (provider, external_id)
  WHERE external_id IS NOT NULL;
