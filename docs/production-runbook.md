# Production Runbook

This runbook is the release gate for the v2 portal. Do not replace the legacy public site until every staging check has recorded evidence.

## Environment boundaries

| Environment | `APP_ENV` | Data | Authentication | Purpose |
|---|---|---|---|---|
| Local | `development` | In-memory or developer database | Demo mode allowed | Daily development |
| Automated test | `test` | Isolated in-memory process | Synthetic admin | Deterministic CI journeys |
| Staging | `staging` | Separate non-production PostgreSQL project | Separate Supabase project | Release verification |
| Production | `production` | Production PostgreSQL project | Production Supabase project | Real users |

Never reuse a database, Supabase project, Jira token, webhook secret, or monitoring token across staging and production. Set `APP_VERSION` to the deployed commit SHA.

## Staging release

1. Create a staging database and Supabase project with point-in-time recovery or scheduled backups enabled.
2. Configure every variable in `.env.example` in the staging secret store. Keep `AUTH_DEMO_MODE` unset.
3. Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build -- --webpack`, and `npm run test:e2e` for the release commit.
4. Run `npm run db:migrate` against staging. Confirm each migration appears once in `schema_migrations`.
5. Deploy the same commit with `APP_ENV=staging` and its SHA in `APP_VERSION`.
6. Confirm `/api/health` returns HTTP 200, the expected version, PostgreSQL storage, and every required service as configured.
7. Test one provisioned employee and one engineer account. Create an incident, confirm one Jira request, update Jira status, assign it, add an internal note, and confirm employee access does not expose that note.
8. Confirm a deliberate test exception reaches the configured monitoring service with no credentials or request headers in its payload.

## Database migration safety

- Take or verify a restorable backup immediately before production migration.
- Run migrations as a dedicated deployment step before shifting traffic.
- Migrations in this repository are additive. Do not edit an already-applied migration; add a new numbered migration.
- Compare `schema_migrations` with the repository before and after the run.
- Abort the release if application health is not ready after migration.

## Backup and restore drill

This remains incomplete until performed against the selected hosted PostgreSQL provider.

1. Record the provider backup identifier, timestamp, retention period, and region.
2. Create a staging incident with a recognizable restore-drill marker and record its ID.
3. Capture a provider backup after the marker exists.
4. Delete the marker only in the isolated drill environment.
5. Restore the backup into a new database project, never over the active database.
6. Point a temporary staging deployment at the restored database.
7. Run `/api/health`, verify the marker incident and its events/delivery references, and execute the employee/engineer smoke journey.
8. Record recovery time, recovery point, operator, result, and any missing configuration.
9. Remove the temporary restored project after evidence has been retained.

## Rollback

1. Stop traffic promotion if health or smoke tests fail.
2. Redeploy the previous known-good application commit and verify its `APP_VERSION` through `/api/health`.
3. Prefer a forward database fix. Do not reverse a migration that may discard data.
4. If the database is corrupt, restore the pre-migration backup into a new database, verify it, then update the deployment secret and restart.
5. Disable Jira Automation callbacks only if they are contributing to the incident; retain delivery records for reconciliation.

## Monitoring and response

- Platform logs contain one JSON object per event with environment and release identifiers.
- `ERROR_REPORTING_ENDPOINT` receives only a redacted error message and route context; headers and request bodies are excluded.
- Alert on `/api/health` failures, HTTP 5xx rate, Jira delivery failures, and repeated authentication errors.
- Never paste raw production payloads into tickets. Use incident IDs, event IDs, timestamps, and redacted log records.
