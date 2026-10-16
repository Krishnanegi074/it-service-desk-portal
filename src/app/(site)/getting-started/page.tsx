import type { Metadata } from 'next';
import Link from 'next/link';
import { mailto, siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Getting started — Triage Portal',
  description: 'Three ways to start with Triage Portal: try the intake, run a pilot with one IT team, or self-host from GitHub.'
};

export default function GettingStartedPage() {
  return (
    <>
      <section className="page-hero" aria-labelledby="gs-title">
        <div className="rail">
          <span className="status"><i />Three ways to begin</span>
          <h1 id="gs-title">Pick how you want to <em>start.</em></h1>
          <p className="sub">Try the employee form yourself, run a measured pilot with one IT team, or host it on your own servers.</p>
        </div>
      </section>

      <section className="block" aria-label="Ways to start" style={{ paddingBlock: '72px 112px' }}>
        <div className="rail">
          <div className="paths">
            <article className="path">
              <span className="label">5 minutes</span>
              <h2>Try the intake</h2>
              <p>See what an employee sees: plain questions, a live completeness bar, and a ticket ID at the end.</p>
              <ol>
                <li>Sign in with the email your admin added.</li>
                <li>Open <b>Report an issue</b> and pick the closest problem type.</li>
                <li>Answer the two or three questions and submit.</li>
              </ol>
              <Link className="btn btn-primary" href="/report">Report a test issue</Link>
            </article>
            <article className="path featured">
              <span className="label">1 to 4 weeks</span>
              <h2>Run a pilot</h2>
              <p>Use it for real with one IT team and measure whether ticket quality improves before rolling out.</p>
              <ol>
                <li>Tell us your team size and which ticketing tool you use.</li>
                <li>We set up your workspace, add your people and connect Jira if you have it.</li>
                <li>Review the pilot dashboard together after two weeks.</li>
              </ol>
              <a className="btn btn-primary" href={mailto('Pilot request')}>Request a pilot</a>
            </article>
            <article className="path">
              <span className="label">For developers</span>
              <h2>Self-host</h2>
              <p>Run it on your own infrastructure. You need Node.js, PostgreSQL and a Supabase project for sign-in.</p>
              <ol>
                <li>Clone the repository and copy <code>.env.example</code> to <code>.env.local</code>.</li>
                <li>Run <code>npm ci</code>, then <code>npm run db:migrate</code>.</li>
                <li>Start with <code>npm run dev</code>, or deploy to Vercel.</li>
              </ol>
              <a className="btn btn-ghost" href={siteConfig.githubUrl} target="_blank" rel="noreferrer">Open the README</a>
            </article>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="pilot-steps">
        <div className="rail split">
          <div>
            <span className="label">Pilot checklist</span>
            <h2 className="h2" id="pilot-steps" style={{ marginTop: 18 }}>What a good pilot <em>looks like.</em></h2>
            <p className="lede">A pilot works best when it is small, real and measured. These are the steps we follow with every team.</p>
          </div>
          <ol className="steps" style={{ marginTop: 0 }}>
            <li><span className="n">01</span><div><h3>Pick one team</h3><p>An IT team of 2 to 10 engineers, and the employees they already support.</p></div></li>
            <li><span className="n">02</span><div><h3>Add people</h3><p>Admins add employees and promote engineers. Nobody can sign themselves up.</p></div></li>
            <li><span className="n">03</span><div><h3>Choose playbooks</h3><p>Start with the five included ones. Ask for a custom one if your desk sees something else often.</p></div></li>
            <li><span className="n">04</span><div><h3>Send the link</h3><p>Share the <b>Report an issue</b> link in your usual help channel or email signature.</p></div></li>
            <li><span className="n">05</span><div><h3>Review the numbers</h3><p>After two weeks, check completeness, time to assignment and follow-up questions on the pilot dashboard.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="block" style={{ borderBottom: 0 }}>
        <div className="rail">
          <div className="cta-band">
            <div><h2>Questions before you <em>start?</em></h2><p>Check pricing and security, or email us and we’ll reply within one working day.</p></div>
            <div className="ctas">
              <Link className="btn btn-primary" href="/pricing">See pricing</Link>
              <Link className="btn btn-ghost" href="/security">Read about security</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
