# Engineering Roadmap

## Product objective

Create a resolver-ready ticket quality layer for small internal IT teams: employees submit structured diagnostics, the portal calculates priority consistently, Jira receives one complete ticket, and engineers manage the handoff from a protected console.

## Phase 0 — Repository stabilization

- [x] Ignore dependencies, build output, coverage, logs, and local secrets
- [x] Add lint, type-check, test, and build verification
- [x] Unify the incident status contract
- [x] Persist incident status changes through the storage layer
- [x] Replace hardcoded reporter data with form input
- [x] Preserve a valid zero readiness score
- [x] Display submission errors to the user
- [x] Add an environment template and current README
- [x] Add GitHub Actions verification
- [ ] Deploy the v2 application to a staging URL

## Phase 1 — Database foundation

- [x] Add version-controlled PostgreSQL migrations
- [x] Add `users`, `incidents`, `diagnostic_answers`, `incident_events`, and `integration_deliveries`
- [x] Add timestamps, ownership, assignment, indexes, and pagination
- [x] Add audit events for incident transitions
- [x] Add idempotency protection for incident creation
- [ ] Add PostgreSQL integration tests

## Phase 2 — Employee intake

- [x] Separate `/report`, success, ticket-status, and `/console` routes
- [x] Add VPN, email, SSO, application, and hardware playbooks
- [x] Derive impact and urgency from employee-friendly questions
- [x] Display a ticket ID and submission summary
- [x] Add accessible loading, error, empty, and success states

## Phase 3 — Authentication and security

- [x] Add Supabase email magic-link authentication
- [x] Add employee, engineer, and admin roles
- [x] Protect console pages and API routes server-side
- [x] Add row-level security and baseline rate limiting
- [x] Expand secret redaction and add retention controls
- [x] Add verified cookie sessions and actor attribution for status changes

## Phase 4 — Engineer console

- [x] Add search, pagination, assignment, and status filters
- [x] Add internal notes and incident event history
- [x] Show priority attribution and diagnostic completeness
- [x] Add manual retry for failed deliveries

## Phase 5 — Jira Service Management

- [x] Define a generic ticketing adapter contract
- [x] Implement Jira issue creation and field mapping
- [x] Add idempotent delivery, retries, and failure visibility
- [x] Store Jira issue references
- [x] Synchronize Jira status through a webhook

## Phase 6 — Production readiness

- [x] Add end-to-end employee and engineer tests
- [x] Add structured logging and error monitoring
- [x] Separate development, staging, and production environments
- [ ] Verify backup, restore, migration, and rollback procedures
- [x] Add automated accessibility and responsive checks for critical journeys
- [ ] Complete manual keyboard and assistive-technology review

## Phase 7 — Pilot

- [x] Add privacy-conscious intake completion and abandonment measurement
- [x] Add engineer feedback for routing accuracy and clarification contacts
- [x] Add an administrator dashboard for completeness, assignment time, routing, delivery, and workflow outcomes
- [ ] Pilot with one internal IT team
- [ ] Collect a representative pilot sample and review the outcome measures with the team
- [ ] Use pilot evidence to choose the next integration or automation feature
