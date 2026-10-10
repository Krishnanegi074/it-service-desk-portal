# IT Service Desk Pre-Triage Portal

A full-stack incident intake and engineering triage application. It collects structured diagnostics, calculates ITIL priority deterministically, redacts common credentials, persists incidents, and creates resolver-ready requests in Jira Service Management.

- **Live legacy prototype:** https://triage-portal-dun.vercel.app
- **Repository:** https://github.com/Krishnanegi074/it-service-desk-portal
- **Current release:** `v2-fullstack`

The deployed URL currently shows the earlier Voiceflow-based prototype. The code in this repository is the replacement Next.js application and should be deployed to staging before replacing the legacy site.

## Current capabilities

- Guided VPN, email, SSO, application, and hardware diagnostic playbooks
- Separate employee reporting, ticket confirmation, ticket status, and engineer console routes
- Employee-friendly impact questions mapped to deterministic ITIL values
- Deterministic impact × urgency priority calculation
- Zod-validated incident API
- Server-side credential and token redaction
- PostgreSQL storage with an in-memory development fallback
- Engineer queue with server-side search, pagination, status, priority, and assignee filters
- Incident assignment, internal notes, priority attribution, completeness, and event history
- Persistent incident status transitions
- Supabase magic-link authentication with employee, engineer, and admin roles
- Server-enforced page and API authorization with production fail-closed behavior
- Supabase row-level security policies and per-user incident submission throttling
- Recursive credential redaction for private keys, connection strings, JWTs, and common provider tokens
- Administrator-only retention preview and audited purge controls
- Privacy-conscious intake completion tracking and an administrator pilot-outcomes dashboard
- Per-incident engineer feedback for routing accuracy and clarification contacts
- P1/P2 webhook dispatch with a safe local dry-run
- Jira Service Management request creation, reference storage, retry visibility, and webhook status sync
- Redacted structured JSON logging, runtime configuration readiness, and optional external error reporting
- Unit, end-to-end browser, responsive, and automated WCAG A/AA checks

## Architecture

```text
Browser
  ├── Supabase magic-link session
  ├── Guided diagnostic intake (employee+)
  └── Engineering console (engineer/admin)
          │
          ▼
Next.js route handlers
  ├── Validation and sanitization
  ├── ITIL priority engine
  ├── Incident persistence ──► PostgreSQL / in-memory fallback
  ├── Pilot outcome metrics ─► Aggregate admin dashboard
  ├── Ticketing adapter ─────► Jira Service Management
  ├── Jira status webhook ◄── Jira Automation
  └── P1/P2 escalation ──────► Optional outbound webhook
```

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- PostgreSQL via `pg`
- Supabase Auth via `@supabase/ssr`
- Zod validation
- Vitest
- Playwright and Axe

## Local setup

Requirements:

- Node.js 20 or newer
- npm
- PostgreSQL is optional for local development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

Primary routes:

| Route | Purpose |
|---|---|
| `/` | Service-desk landing page |
| `/report` | Employee diagnostic intake |
| `/tickets/:id` | Employee ticket status |
| `/console` | Engineer intake console |
| `/admin/pilot` | Administrator-only pilot outcome metrics |
| `/admin/retention` | Administrator-only data retention controls |

If `DATABASE_URL` is absent, incidents are stored in memory and are lost when the server restarts. If `OUTBOUND_WEBHOOK_URL` is absent, P1/P2 delivery uses the documented dry-run response.

`AUTH_DEMO_MODE=true` keeps local development usable without a Supabase project. It is ignored when `NODE_ENV=production`; production requests fail closed until Supabase is configured.

### Supabase authentication

1. Create a Supabase project and add its database connection string as `DATABASE_URL`.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the project Connect dialog.
3. Add the application URL and `/auth/callback` URL to the Supabase Auth redirect allow-list.
4. Run `npm run db:migrate` to create profiles, the auth trigger, and row-level security policies.
5. Provision users in Supabase Auth. New profiles default to the `employee` role.
6. Promote trusted staff with SQL such as `UPDATE app_users SET role = 'engineer' WHERE email = 'engineer@company.com';`.

Magic-link self-signup is disabled in the application. Only provisioned organization accounts can request a link.

### Persistent PostgreSQL storage

Add a real PostgreSQL or Supabase connection string to `.env.local`, then apply every pending migration:

```bash
npm run db:migrate
```

Migrations are applied in filename order and recorded in `schema_migrations`. The command is safe to run again because previously applied files are skipped. The application does not create or change production tables automatically.

### Jira Service Management

1. Create a Jira API token for a dedicated integration account that can raise requests in the target service project.
2. Set `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_SERVICE_DESK_ID`, and `JIRA_REQUEST_TYPE_ID`.
3. Set a long random `JIRA_WEBHOOK_SECRET`.
4. In Jira Automation, create an issue-transition rule that sends the issue payload to `https://YOUR_APP/api/integrations/jira/webhook` and includes `x-triage-webhook-secret` with the same secret.
5. Run `npm run db:migrate` so Jira issue keys and URLs can be stored.

Without Jira credentials, incident intake remains fully usable: delivery is stored as `pending`, visible to engineers, and can be sent from the incident drawer after configuration. An `Idempotency-Key` prevents a retried intake request from creating a second Jira request.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | No | PostgreSQL connection string; enables persistent storage |
| `APP_ENV` | Yes | Explicit environment: `development`, `test`, `staging`, or `production` |
| `APP_VERSION` | Deployments | Release or commit identifier included in health and error records |
| `OUTBOUND_WEBHOOK_URL` | No | Receives structured P1/P2 escalation events |
| `NEXT_PUBLIC_SUPABASE_URL` | Production | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production | Browser-safe Supabase publishable key |
| `AUTH_DEMO_MODE` | Local only | Enables a synthetic engineer session outside production |
| `AUTH_DEMO_ROLE` | Local only | Uses `engineer` (default) or `admin` for the synthetic session |
| `INCIDENT_RETENTION_DAYS` | No | Expiry window used by admin retention controls; defaults to 365 days |
| `JIRA_BASE_URL` | Jira | Jira site URL, for example `https://company.atlassian.net` |
| `JIRA_EMAIL` | Jira | Email address of the dedicated Jira integration account |
| `JIRA_API_TOKEN` | Jira | API token for that account |
| `JIRA_SERVICE_DESK_ID` | Jira | Target Jira Service Management service desk ID |
| `JIRA_REQUEST_TYPE_ID` | Jira | Target customer request type ID |
| `JIRA_WEBHOOK_SECRET` | Jira sync | Shared secret expected in the Jira Automation callback header |
| `ERROR_REPORTING_ENDPOINT` | Recommended | HTTPS endpoint receiving redacted structured server-error records |
| `ERROR_REPORTING_TOKEN` | Monitoring | Optional Bearer token for the error-reporting endpoint |

Never commit real credentials. Use `.env.local` for local values and the hosting provider's secret store for deployed environments.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build -- --webpack
```

Webpack is used in the verification command because it is more portable in restricted CI and sandbox environments. The default Next.js development command continues to use Turbopack.

## API

### `GET /api/incidents`

Engineer/admin only. Returns incidents ordered newest first. Supports `page`, `limit`, `q`, `status`, `priority`, and `assigneeId`; `limit` is capped at 100. The response includes pagination metadata.

### `POST /api/incidents`

Authenticated users only. Sanitizes and validates the payload, derives reporter identity from the verified session, calculates priority, saves the incident, attempts Jira delivery, and dispatches P1/P2 escalation. Send an `Idempotency-Key` header to return the original incident and delivery record on retries instead of creating duplicates. Each user is limited to 10 submissions per 10-minute process window.

### `PATCH /api/incidents/:id`

Engineer/admin only. Updates an incident to one of the canonical statuses:

- `open`
- `in_triage`
- `dispatched`
- `resolved`

Every real status transition writes an immutable audit event.

### `GET /api/incidents/:id`

Returns one incident to its reporter or to engineer/admin users.

### `GET /api/incidents/:id/events`

Returns an authorized incident's audit events ordered newest first. Internal notes are visible only to engineer/admin users.

### `PATCH /api/incidents/:id/assignment`

Engineer/admin only. Assigns or unassigns an incident and writes an audit event.

### `POST /api/incidents/:id/notes`

Engineer/admin only. Redacts secrets, adds an internal note, and writes an audit event.

### `GET|POST /api/incidents/:id/delivery`

Engineer/admin only. Reads the Jira delivery state or retries a pending/failed Jira delivery. A delivered request cannot be sent twice.

### `GET|PUT /api/incidents/:id/pilot-feedback`

Engineer/admin only. Reads or records whether the submitted routing was accurate and the number of employee clarification contacts required. One current feedback record is retained per incident.

### `POST /api/intake-sessions`

Authenticated users only. Records an anonymous intake session start or marks that session complete after an incident is created. It stores a random session ID and timestamps, not browsing activity or form contents. A started session is counted as abandoned only after it has remained incomplete for 15 minutes.

### `POST /api/integrations/jira/webhook`

Accepts Jira Automation status callbacks protected by `x-triage-webhook-secret`. Known Jira workflow states map to the portal's `open`, `in_triage`, `dispatched`, and `resolved` states.

### `GET /api/health`

Reports deployment environment, version, storage mode, dependency configuration, and readiness without exposing secret values. Staging and production return `503` when required database, Supabase, or Jira configuration is incomplete.

### `GET /api/admin/retention`

Administrator only. Returns the configured retention window, cutoff timestamp, and number of incidents eligible for deletion.

### `POST /api/admin/retention`

Administrator only. Permanently deletes expired incidents after receiving the exact confirmation phrase `PURGE_EXPIRED_INCIDENTS`. Related diagnostics, events, and integration deliveries are removed through foreign-key cascades, while a `retention_runs` audit record is preserved.

### `GET /api/admin/pilot`

Administrator only. Returns aggregate pilot measures: incident volume, completeness, assignment and resolution rates, median assignment time, Jira delivery failures, engineer feedback coverage, routing accuracy, clarification contacts, intake completion, and abandonment. Active intake sessions less than 15 minutes old are excluded from abandonment calculations.

## Current limitations

- A real PostgreSQL integration test requires a configured test database.
- Distributed production rate limiting requires a shared store; the current limiter is per application process.
- Retention purges are explicit administrator actions; scheduling them requires a protected production job in a later phase.
- Jira delivery and status sync require a Jira Service Management project, credentials, request type, and Automation rule; these cannot be provisioned by the repository.
- Attachments and employee status notifications are not implemented.
- Pilot metrics are operational signals; proving product value still requires a representative trial with a real internal IT team.

See [ROADMAP.md](./ROADMAP.md) for the implementation sequence and [docs/production-runbook.md](./docs/production-runbook.md) for staging, monitoring, migration, backup, restore, and rollback procedures.
