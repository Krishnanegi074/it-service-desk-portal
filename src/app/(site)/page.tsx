import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroField } from '@/components/site/HeroField';
import { LiveIntake } from '@/components/site/LiveIntake';
import { ProductShowcase } from '@/components/site/ProductShowcase';

export const metadata: Metadata = {
  title: 'Triage Portal — Every IT ticket, resolver-ready',
  description:
    'Guided IT incident intake that turns vague reports into secure, prioritized, resolver-ready tickets for small internal IT teams.'
};

export default function HomePage() {
  return (
    <>
  <section className="hero" aria-labelledby="hero-title">
    <HeroField />
    <div className="rail hero-grid">
      <div>
        <span className="status"><i />Now preparing a pilot with one internal IT team</span>
        <h1 id="hero-title">
          Every IT ticket,{' '}
          <em className="scribble">
            resolver&#8209;ready.
            <svg viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true"><path pathLength={1} d="M3 10 C 70 4, 150 2, 297 6 M 40 12 C 120 8, 200 8, 262 10" /></svg>
          </em>
        </h1>
        <p className="sub">Employees say “the VPN is broken.” Triage Portal asks the next useful question, sets priority the same way every time, strips out passwords, and hands your engineers one complete ticket.</p>
        <div className="ctas">
          <Link href="/report" className="btn btn-primary">
            Try the guided intake
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </Link>
          <Link href="/pricing" className="btn btn-ghost">See pricing</Link>
        </div>
        <p className="fine">Code on GitHub · Works with Jira Service Management · Runs without Jira too</p>
      </div>
      <LiveIntake />
    </div>
  </section>
  <div className="marquee" aria-label="Issue types covered">
    <div className="rail">
      <span className="label">Built for what fills your queue</span>
      <div className="track-wrap">
        <div className="track" aria-hidden="true">
          <span>VPN drops</span><span>Outlook won’t sync</span><span>SSO &amp; MFA errors</span><span>App crashes</span><span>Laptop won’t boot</span><span>Certificate warnings</span><span>Shared drive access</span>
          <span>VPN drops</span><span>Outlook won’t sync</span><span>SSO &amp; MFA errors</span><span>App crashes</span><span>Laptop won’t boot</span><span>Certificate warnings</span><span>Shared drive access</span>
        </div>
      </div>
    </div>
  </div>

  <section className="block" aria-labelledby="platform-title">
    <div className="rail">
      <span className="label">The handoff</span>
      <h2 className="h2" id="platform-title" style={{ marginTop: '18px', maxWidth: '18ch' }}>Employees describe it. Engineers receive it <em>complete.</em></h2>
      <p className="lede">Most tickets arrive missing the device, the network, or the exact error. Triage Portal sits between the person who has the problem and the team that fixes it.</p>

      <div className="flow">
        <div className="node">
          <span className="label">Employee</span>
          <p className="quote">“VPN keeps kicking me out after I log in.”</p>
          <p>Plain language. No ticket fields, no IT vocabulary.</p>
        </div>
        <div className="wire" aria-hidden="true"></div>
        <div className="node core">
          <span className="label"><b>Triage Portal</b></span>
          <h3>Asks, scores, cleans</h3>
          <div className="chips">
            <span className="chip">macOS 15</span><span className="chip">Home Wi‑Fi</span><span className="chip">AUTH_TIMEOUT</span>
            <span className="chip amber">Urgency 1 × Impact 3</span><span className="chip">1 secret redacted</span>
          </div>
        </div>
        <div className="wire" aria-hidden="true"></div>
        <div className="node">
          <span className="label">Engineer</span>
          <h3>One ticket, ready to work</h3>
          <div className="chips"><span className="pill p2">P2</span><span className="pill ok">100% complete</span><span className="chip">Jira ITSD‑482</span></div>
        </div>
      </div>
    </div>
  </section>

  <section className="block" id="how" aria-labelledby="how-title">
    <div className="rail split">
      <div>
        <span className="label">How it works</span>
        <h2 className="h2" id="how-title" style={{ marginTop: '18px' }}>Four steps. <em>Zero</em> back‑and‑forth.</h2>
        <ol className="steps">
          <li><span className="n">01</span><div><h3>Listen</h3><p>The employee describes the problem in their own words and picks what it’s closest to.</p></div></li>
          <li><span className="n">02</span><div><h3>Guide</h3><p>A playbook for that issue asks only the questions an engineer would ask first.</p></div></li>
          <li><span className="n">03</span><div><h3>Structure</h3><p>Impact and urgency map to a fixed P1–P4 matrix. Passwords and keys are removed before anything is saved.</p></div></li>
          <li><span className="n">04</span><div><h3>Hand off</h3><p>The ticket lands in the engineer queue and, if you use it, in Jira Service Management.</p></div></li>
        </ol>
      </div>

      <div className="annotated">
      <span className="note note-chat" aria-hidden="true">only what an engineer would ask
        <svg viewBox="0 0 46 40"><path d="M6 4 C 24 6, 38 14, 36 34 M 30 28 L 36 35 L 42 27"/></svg></span>
      <div className="window" role="img" aria-label="Example intake conversation ending in a P2 ticket">
        <div className="window-bar"><div className="dots"><i></i><i></i><i></i></div><span className="label">Report an issue · Network / VPN</span><span className="label">67%</span></div>
        <div className="chat">
          <div className="msg bot"><span className="label">Triage Portal</span>Which operating system are you using?</div>
          <div className="msg user">macOS</div>
          <div className="msg bot"><span className="label">Triage Portal</span>Are you on home Wi‑Fi, office Ethernet, or a mobile hotspot?</div>
          <div className="msg user">Home Wi‑Fi</div>
          <div className="msg bot"><span className="label">Triage Portal</span>What exact error message does the VPN display?</div>
          <div className="msg user">AUTH_TIMEOUT. password: Summer2026!</div>
          <div className="msg warn"><span className="label">Heads up</span>Never share passwords here. We removed it before saving your report.</div>
        </div>
        <div className="ticket">
          <div className="ticket-head"><span className="label">TK‑20261015‑014</span><span className="pill p2">P2 · High</span></div>
          <h4>VPN disconnects after authentication</h4>
          <dl className="kv">
            <div><dt>Device</dt><dd>macOS</dd></div>
            <div><dt>Network</dt><dd>Home Wi‑Fi</dd></div>
            <div><dt>Error</dt><dd>AUTH_TIMEOUT</dd></div>
          </dl>
        </div>
      </div>
      </div>
    </div>
  </section>

  <section className="block" id="playbooks" aria-labelledby="pb-title">
    <div className="rail">
      <div className="head-row">
        <div>
          <span className="label">Diagnostic playbooks</span>
          <h2 className="h2" id="pb-title" style={{ marginTop: '18px', maxWidth: '16ch' }}>Five playbooks. The <em>right</em> questions first.</h2>
        </div>
        <div style={{ display: 'grid', gap: '18px', justifyItems: 'start' }}><p className="lede" style={{ maxWidth: '40ch', marginTop: '0' }}>Each issue type has its own short script, written from what engineers ask on their first reply.</p><Link className="btn btn-ghost" href="/playbooks">Browse all 16 playbooks</Link></div>
      </div>
      <div className="cards">
        <article className="card"><span className="label">Network</span><h3>VPN</h3><ol><li>Operating system</li><li>Home, office, or hotspot</li><li>Exact VPN error</li></ol><div className="example">AUTH_TIMEOUT</div></article>
        <article className="card"><span className="label">Messaging</span><h3>Email</h3><ol><li>Operating system</li><li>Email application</li><li>Error or behaviour</li></ol><div className="example">Outlook · search empty</div></article>
        <article className="card"><span className="label">Identity</span><h3>SSO &amp; MFA</h3><ol><li>App you can’t reach</li><li>Sign‑in or MFA error</li></ol><div className="example">AADSTS50076</div></article>
        <article className="card"><span className="label">Software</span><h3>Applications</h3><ol><li>Operating system</li><li>Application name</li><li>Error or behaviour</li></ol><div className="example">Zoom · code 5003</div></article>
        <article className="card"><span className="label">Device</span><h3>Hardware</h3><ol><li>Operating system</li><li>Device or component</li><li>What it’s doing</li></ol><div className="example">Dock · no display</div></article>
      </div>
    </div>
  </section>

    <section className="block" id="product" aria-labelledby="prod-title">
    <div className="rail">
      <span className="label">Inside the product</span>
      <h2 className="h2" id="prod-title" style={{ marginTop: '18px', maxWidth: '17ch' }}>One good intake becomes your team’s <em>standard.</em></h2>
      <ProductShowcase />
    </div>
  </section>

  <section className="stakes" aria-labelledby="stakes-title">
    <div className="rail">
      <h2 id="stakes-title">Every vague ticket costs an engineer a <em>round trip.</em></h2>
      <div className="count"><span>“Which device?”</span><span>“Home or office?”</span><span>“What’s the exact error?”</span><span>“Is anyone else affected?”</span></div>
    </div>
  </section>

  <section className="block" aria-labelledby="reasons-title">
    <div className="rail">
      <span className="label">Why teams pick it</span>
      <h2 className="h2" id="reasons-title" style={{ marginTop: '18px' }}>Three reasons it <em>earns its place.</em></h2>
      <div className="reasons">
        <article><span className="label">Consistency</span><h3>Priority is a rule, not a mood.</h3><p>The same answers always give the same priority, and anyone can see why.</p></article>
        <article><span className="label">Safety</span><h3>Secrets never reach the queue.</h3><p>Redaction, roles, an audit trail and retention controls are built in from day one.</p></article>
        <article><span className="label">Fit</span><h3>Works with what you have.</h3><p>Use its own engineer console, or connect Jira Service Management when you’re ready.</p></article>
      </div>
    </div>
  </section>

  <section className="block" id="pilot" aria-labelledby="pilot-title">
    <div className="rail pilot">
      <div>
        <span className="label">Pilot</span>
        <h2 className="h2" id="pilot-title" style={{ marginTop: '18px' }}>Start with one team. <em>Measure</em> what changes.</h2>
        <p className="lede">The admin dashboard tracks six outcomes, so the pilot shows whether ticket quality really improves before anyone rolls it out wider.</p>
        <span className="stage-chip"><i></i>Current stage: staging setup and pilot preparation</span>
      </div>
      <div className="measures">
        <div className="measure"><span className="label">Quality</span><p>Diagnostic completeness</p></div>
        <div className="measure"><span className="label">Speed</span><p>Median time to assignment</p></div>
        <div className="measure"><span className="label">Accuracy</span><p>Routing accuracy</p></div>
        <div className="measure"><span className="label">Effort</span><p>Clarification contacts</p></div>
        <div className="measure"><span className="label">Reliability</span><p>Jira delivery health</p></div>
        <div className="measure"><span className="label">Adoption</span><p>Intake completion rate</p></div>
      </div>
    </div>
  </section>

  <section className="closing" id="close" aria-labelledby="close-title">
    <div className="rail">
      <h2 id="close-title">See a ticket arrive <em>complete.</em></h2>
      <p>Report a test issue as an employee, then open the console and pick it up as an engineer.</p>
      <div className="ctas">
        <Link href="/report" className="btn btn-primary">Try the guided intake</Link>
        <Link href="/pricing#plans" className="btn btn-ghost">See plans</Link>
      </div>
    </div>
  </section>

    </>
  );
}
