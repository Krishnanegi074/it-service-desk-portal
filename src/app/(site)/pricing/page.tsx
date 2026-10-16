import type { Metadata } from 'next';
import Link from 'next/link';
import { PricingPlans } from '@/components/site/PricingPlans';
import { FaqList } from '@/components/site/FaqList';

export const metadata: Metadata = {
  title: 'Pricing — Triage Portal',
  description: 'One flat price for the whole IT team. Self-host free, start free in the cloud, or get it set up for you.'
};

const rows: [string, string, string, string][] = [
  ['Engineers', 'Unlimited', 'Up to 3', 'Unlimited'],
  ['Employees who can report', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['Guided playbooks', '✓', '✓', '✓'],
  ['P1–P4 priority with explanation', '✓', '✓', '✓'],
  ['Password and key redaction', '✓', '✓', '✓'],
  ['Jira Service Management sync', '✓', '–', '✓'],
  ['P1/P2 instant alerts', '✓', '–', '✓'],
  ['Pilot outcomes dashboard', '✓', '–', '✓'],
  ['Ticket history', 'You decide', '90 days', 'Unlimited'],
  ['Hosting and updates', 'You', 'Us', 'Us'],
  ['Support', 'GitHub', 'GitHub', 'Email, next working day']
];

const faqs = [
  ['Why don’t you charge per engineer?', 'Per-engineer pricing makes teams ration access, so the people who need the queue can’t see it. One team price keeps it simple to approve and simple to budget.'],
  ['Is self-hosted really free?', 'Yes. The code is public on GitHub. You run it on your own servers and look after updates yourselves. You can move to the cloud later and keep your tickets.'],
  ['Do employees count towards the limit?', 'No. Anyone in your company can report an issue on every plan. Limits only apply to engineers on Cloud Starter.'],
  ['What happens to our data?', 'Passwords and keys are removed before anything is saved. Each company’s data is kept separate, and admins can set how long tickets are kept.'],
  ['What does the setup service include?', 'We connect your Jira, write playbooks for the issues your team sees most, set up single sign-on, train your staff, and stay on hand for 30 days.']
] as const;

const cell = (v: string) => (v === '✓' ? <span className="y" aria-label="Included">✓</span> : v === '–' ? <span className="n" aria-label="Not included">–</span> : v);

export default function PricingPage() {
  return (
    <>
      <section className="page-hero" aria-labelledby="pr-title">
        <div className="rail">
          <span className="status"><i />Early-access pricing, set with our first pilot teams</span>
          <h1 id="pr-title">One price for the <em>whole</em> IT team.</h1>
          <p className="sub">No per-agent fees. Self-host free forever, start free in the cloud, and pay for setup only if you want our help.</p>
        </div>
      </section>

      <PricingPlans />

      <section className="block" aria-labelledby="cmp-title">
        <div className="rail">
          <span className="label">Compare plans</span>
          <h2 className="h2" id="cmp-title" style={{ marginTop: 18 }}>What’s in <em>each plan.</em></h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th scope="col">Feature</th><th scope="col">Self-hosted</th><th scope="col">Cloud Starter</th><th scope="col">Cloud Team</th></tr></thead>
              <tbody>
                {rows.map(([f, a, b, c]) => (
                  <tr key={f}><td>{f}</td><td>{cell(a)}</td><td>{cell(b)}</td><td>{cell(c)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="addon-title">
        <div className="rail">
          <div className="head-row">
            <div><span className="label">Coming next</span><h2 className="h2" id="addon-title" style={{ marginTop: 18 }}>Add-ons on the <em>roadmap.</em></h2></div>
            <p className="lede" style={{ maxWidth: '40ch', marginTop: 0 }}>Pilot teams decide which of these we build first. Prices will be set when each one is ready.</p>
          </div>
          <div className="addons">
            <article className="addon"><span className="pill soon">Planned</span><h3>More ticketing tools</h3><p>Connect ServiceNow, Freshservice or Zendesk instead of Jira.</p></article>
            <article className="addon"><span className="pill soon">Planned</span><h3>Report from Slack or Teams</h3><p>Employees start a report from the chat app they already use.</p></article>
            <article className="addon"><span className="pill soon">Planned</span><h3>AI reading of free text</h3><p>Pull device, error and urgency out of what the employee typed. Optional, and off by default.</p></article>
            <article className="addon"><span className="pill pack">Packs</span><h3>Industry playbooks</h3><p>Ready-made playbooks for retail stores, clinics, agencies and finance teams.</p></article>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="pfaq-title">
        <div className="rail">
          <span className="label">Pricing questions</span>
          <h2 className="h2" id="pfaq-title" style={{ marginTop: 18 }}>Before you <em>ask.</em></h2>
          <FaqList items={faqs} />
        </div>
      </section>

      <section className="block" style={{ borderBottom: 0 }}>
        <div className="rail">
          <div className="cta-band">
            <div><h2>Try it with one team <em>first.</em></h2><p>Start on the free plan, measure ticket quality for a month, and decide with real numbers.</p></div>
            <div className="ctas"><Link className="btn btn-primary" href="/getting-started">Get started</Link><Link className="btn btn-ghost" href="/playbooks">Browse playbooks</Link></div>
          </div>
        </div>
      </section>
    </>
  );
}
