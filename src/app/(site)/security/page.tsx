import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqList } from '@/components/site/FaqList';
import { mailto, siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Security — Triage Portal',
  description: 'How Triage Portal protects IT tickets: credential redaction, role-based access, row-level security, audit history and retention controls.'
};

const controls: { label: string; title: string; body: string; detail: string }[] = [
  {
    label: 'Before storage',
    title: 'Credential redaction',
    body: 'Every report is cleaned on the server before it is saved or sent to Jira.',
    detail: 'Private keys, database connection strings, URLs with embedded passwords, AWS, GitHub, GitLab, Slack, Stripe, npm and Google keys, bearer tokens, JWTs, and values written as “password: …” or “token=…”.'
  },
  {
    label: 'Sign-in',
    title: 'No passwords to leak',
    body: 'People sign in with a one-time email link. Only accounts your admin has added can request one.',
    detail: 'Self-signup is switched off. Sessions are verified on the server for every page and API request.'
  },
  {
    label: 'Access',
    title: 'Three roles, enforced twice',
    body: 'Employees see their own tickets. Engineers see the queue. Admins also see pilot metrics and retention.',
    detail: 'Roles are checked in the app and again in the database with row-level security, so a bug in one layer is not enough to expose data.'
  },
  {
    label: 'Accountability',
    title: 'Audit history',
    body: 'Status changes, assignments, internal notes, Jira deliveries and purges all leave a timestamped record with who did it.',
    detail: 'Internal notes stay internal: employees never see them, even on their own tickets.'
  },
  {
    label: 'Data lifecycle',
    title: 'Retention you control',
    body: 'Admins choose how long resolved tickets are kept, from 30 days to 10 years. The default is one year.',
    detail: 'Purges show a preview first and need an explicit confirmation. Each purge is itself recorded.'
  },
  {
    label: 'Abuse',
    title: 'Rate limits',
    body: 'Each person can submit a limited number of reports in a short window, which stops floods and scripted abuse.',
    detail: 'Jira deliveries are idempotent, so a retried submission never creates a duplicate request.'
  }
];

const faqs = [
  ['Where is our data stored?', 'Cloud plans use a managed PostgreSQL database and authentication service. Self-hosted teams keep everything on their own infrastructure. Tell us if you need a specific region and we’ll confirm what is possible before your pilot.'],
  ['Do you use our tickets to train AI?', 'No. The intake works with fixed rules, not a language model. If optional AI reading of free text is added later, it will be off by default and you will be asked first.'],
  ['What happens if someone pastes a password anyway?', 'The form warns them not to. If they still paste one in a recognised format, it is removed on the server before the ticket is saved. Phrases like “my password is …” are not yet caught, so the warning still matters.'],
  ['Can we review the code?', 'Yes. The full source is public on GitHub, including the redaction rules and database policies.'],
  ['How do we report a security issue?', 'Email us with “Security” in the subject. Please don’t open a public GitHub issue for a vulnerability.']
] as const;

export default function SecurityPage() {
  return (
    <>
      <section className="page-hero" aria-labelledby="sec-title">
        <div className="rail">
          <span className="status"><i />Code on GitHub · Inspect every rule</span>
          <h1 id="sec-title">IT tickets are sensitive. We treat them <em>that way.</em></h1>
          <p className="sub">Reports can contain device details, error logs and, by accident, passwords. Triage Portal is built so the dangerous parts never reach the queue, and everything else is only seen by the right people.</p>
        </div>
      </section>

      <section className="block" aria-label="Security controls" style={{ paddingBlock: '72px 112px' }}>
        <div className="rail">
          <div className="controls-grid">
            {controls.map(c => (
              <article className="control" key={c.title}>
                <span className="label">{c.label}</span>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
                <p className="detail">{c.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="flow-title">
        <div className="rail split">
          <div>
            <span className="label">What happens to a report</span>
            <h2 className="h2" id="flow-title" style={{ marginTop: 18 }}>From form to queue, <em>step by step.</em></h2>
            <ol className="steps">
              <li><span className="n">01</span><div><h3>Checked</h3><p>The signed-in session is verified and the report is validated against a strict schema.</p></div></li>
              <li><span className="n">02</span><div><h3>Cleaned</h3><p>Credentials and tokens are replaced with labelled placeholders like <code>[REDACTED_SECRET]</code>.</p></div></li>
              <li><span className="n">03</span><div><h3>Stored</h3><p>The cleaned ticket is saved with row-level security. The original text is never kept.</p></div></li>
              <li><span className="n">04</span><div><h3>Shared</h3><p>Only the cleaned ticket is sent to Jira, once, with its delivery recorded.</p></div></li>
            </ol>
          </div>
          <div className="window" role="img" aria-label="Example of a report before and after redaction">
            <div className="window-bar"><div className="dots"><i /><i /><i /></div><span className="label">Sanitizer</span><span className="pill ok">3 removed</span></div>
            <div className="panel">
              <div className="code">
                {'VPN fails after login\npassword: '}<span className="r">Summer2026!</span>
                {'\nAuthorization: Bearer '}<span className="r">eyJhbGciOi…</span>
                {'\ndb='}<span className="r">postgres://admin:hunter2@10.0.4.12</span>
              </div>
              <div className="arrow-down">↓ saved as</div>
              <div className="code">
                {'VPN fails after login\npassword: '}<span className="g">[REDACTED_SECRET]</span>
                {'\nAuthorization: '}<span className="g">[REDACTED_SECRET] [REDACTED_TOKEN]</span>
                {'\ndb='}<span className="g">[REDACTED_CONNECTION_STRING]</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="sfaq-title">
        <div className="rail">
          <span className="label">Security questions</span>
          <h2 className="h2" id="sfaq-title" style={{ marginTop: 18 }}>The ones IT teams <em>always ask.</em></h2>
          <FaqList items={faqs} />
        </div>
      </section>

      <section className="block" style={{ borderBottom: 0 }}>
        <div className="rail">
          <div className="cta-band">
            <div><h2>Want to check it <em>yourself?</em></h2><p>Read the redaction rules and database policies on GitHub, or send us your security questionnaire.</p></div>
            <div className="ctas">
              <a className="btn btn-primary" href={siteConfig.githubUrl} target="_blank" rel="noreferrer">View the source</a>
              <a className="btn btn-ghost" href={mailto('Security questionnaire')}>Send a questionnaire</a>
            </div>
          </div>
          <p className="early" style={{ marginTop: 18 }}>Also see our <Link href="/privacy" style={{ textDecoration: 'underline' }}>privacy notice</Link>.</p>
        </div>
      </section>
    </>
  );
}
