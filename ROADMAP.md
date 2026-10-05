# Engineering Roadmap: IT Pre-Triage Engine

## 1. Completed
- [x] Responsive portal landing page with incident reporting instructions.
- [x] Integration of Voiceflow Webchat Runtime SDK via client bundle.
- [x] Conversational diagnostic flow collecting OS, network type, and error string.
- [x] In-chat standardized incident card synthesis (`IT Triage Summary`).
- [x] Continuous deployment pipeline on Vercel.
- [x] Audit and credibility hardening (clarified prototype status and external dependencies).

---

## 2. In Progress
- [ ] Initializing `v2-fullstack` branch with Next.js 15 (App Router), TypeScript, and Tailwind CSS.
- [ ] Designing normalized relational database schema for incidents and users in PostgreSQL.

---

## 3. Planned Deliverables

### P0: Core Reliability & Engineering Depth (Target: v2 MVP)
- **Deterministic Priority Engine:** Implement strict ITIL Impact × Urgency matrix in pure TypeScript with unit tests (replacing LLM-guessed priorities).
- **Rule-Based Diagnostic Playbooks:** Transition conversational slot filling into version-controlled application code.
- **Relational Storage:** Deploy PostgreSQL (via Neon or Supabase) with tables for `incidents`, `users`, `diagnostic_answers`, and `audit_logs`.
- **Secret & PII Sanitizer:** Server-side regex filtering to scrub credentials and tokens before persistence.
- **Basic Engineer Workspace:** Authenticated view allowing technicians to review triage cards, inspect collected metadata, and filter by status.

### P1: Enterprise Integration & User Experience
- **Jira Service Management Adapter:** Resilient API client syncing structured triage payloads into upstream Jira projects.
- **Employee Incident Portal:** Magic-link authentication for employees to view submitted tickets and live resolution states.
- **Dynamic Status Verification:** Direct polling to an external status API to display actual corporate service health.
- **Accessible Non-Chat Alternative:** WCAG-compliant structured static form matching conversational playbooks.

### P2: Advanced Infrastructure & Telemetry
- **Incident Deduplication:** Time-window clustering to detect localized outages and group child incidents.
- **Asynchronous Queueing:** BullMQ / Redis worker implementation for retryable, rate-limited ITSM delivery.
- **Attachment Sandboxing:** Secure pre-signed upload pipeline with MIME-type verification for error screenshots.
