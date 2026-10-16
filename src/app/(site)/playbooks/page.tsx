import type { Metadata } from 'next';
import Link from 'next/link';
import { PlaybookLibrary } from '@/components/site/PlaybookLibrary';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Playbook library — Triage Portal',
  description: 'Short, plain-language diagnostic scripts for VPN, email, SSO, application and hardware issues, with more on the way.'
};

export default function PlaybooksPage() {
  return (
    <>
      <section className="page-hero" aria-labelledby="pb-title">
        <div className="rail">
          <span className="status"><i />5 included today · more coming with the pilot</span>
          <h1 id="pb-title">Start with the questions engineers ask <em>first.</em></h1>
          <p className="sub">Each playbook is a short, plain-language script for one kind of IT problem. Employees answer two or three questions, and your engineers get the details they would have chased.</p>
          <PlaybookLibrary />
        </div>
      </section>

      <section className="block" aria-labelledby="anat-title">
        <div className="rail">
          <span className="label">Anatomy of a playbook</span>
          <h2 className="h2" id="anat-title" style={{ marginTop: 18 }}>Four parts. <em>Every</em> playbook.</h2>
          <div className="anatomy">
            <div><span className="label">01 · Trigger</span><h3>What’s it closest to?</h3><p>The employee picks an issue type, like <code>VPN</code>, in plain words.</p></div>
            <div><span className="label">02 · Questions</span><h3>Two or three, no more</h3><p>Only what an engineer would ask on their first reply.</p></div>
            <div><span className="label">03 · Priority</span><h3>Impact × urgency</h3><p>Answers map to a fixed matrix, so <code>U1 × I3 → P2</code> every time.</p></div>
            <div><span className="label">04 · Ticket</span><h3>Fields filled in</h3><p>Device, error and scope land in the queue, with passwords removed.</p></div>
          </div>
        </div>
      </section>

      <section className="block" style={{ borderBottom: 0 }}>
        <div className="rail">
          <div className="cta-band">
            <div><h2>Missing the one your team <em>needs?</em></h2><p>Tell us the issue your desk sees most. Pilot teams’ requests are built first, and the setup service writes playbooks just for your company.</p></div>
            <div className="ctas">
              <a className="btn btn-primary" href={siteConfig.requestPlaybookUrl} target="_blank" rel="noreferrer">Request a playbook</a>
              <Link className="btn btn-ghost" href="/pricing#setup">See the setup service</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
