'use client';

import Link from 'next/link';
import { useState } from 'react';
import { mailto, siteConfig } from '@/lib/site-config';

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
const { teamMonthly, teamYearlyPerMonth, teamYearlyTotal, setupFrom } = siteConfig.pricing;

export function PricingPlans() {
  const [yearly, setYearly] = useState(false);
  const [engineers, setEngineers] = useState(8);
  const [perSeat, setPerSeat] = useState('50');

  const team = yearly ? teamYearlyPerMonth : teamMonthly;
  const them = engineers * Math.max(0, parseFloat(perSeat) || 0);
  const max = Math.max(them, team, 1);
  const diff = (them - team) * 12;

  return (
    <>
      <section className="block" id="plans" aria-label="Plans" style={{ paddingBlock: '56px 112px' }}>
        <div className="rail">
          <div className="billing" role="group" aria-label="Billing period">
            <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>Monthly</button>
            <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>Yearly<small>2 months free</small></button>
          </div>
          <div className="plans">
            <article className="plan">
              <div><h3>Self-hosted</h3><p className="for">For teams that run their own servers.</p></div>
              <div><div className="price"><b>$0</b><span>forever</span></div><p className="price-note">Code on GitHub</p></div>
              <ul><li>All included playbooks</li><li>Engineer console and queue</li><li>P1–P4 priority matrix</li><li>Password and key redaction</li><li>Jira Service Management connector</li><li>Help through GitHub</li></ul>
              <a className="btn btn-ghost" href={siteConfig.githubUrl} target="_blank" rel="noreferrer">Get the code</a>
            </article>
            <article className="plan">
              <div><h3>Cloud Starter</h3><p className="for">For small teams trying it out.</p></div>
              <div><div className="price"><b>$0</b><span>/ month</span></div><p className="price-note">Up to 3 engineers</p></div>
              <ul><li>Unlimited employees reporting</li><li>Hosted for you, nothing to install</li><li>Email sign-in links</li><li>All included playbooks</li><li>90 days of ticket history</li></ul>
              <a className="btn btn-ghost" href={mailto('Cloud Starter – early access')}>Request access</a>
            </article>
            <article className="plan featured">
              <span className="flag">Most teams</span>
              <div><h3>Cloud Team</h3><p className="for">For an IT team running it every day.</p></div>
              <div>
                <div className="price"><b>{fmt(team)}</b><span>/ month, whole team</span></div>
                <p className="price-note">{yearly ? `${fmt(teamYearlyTotal)} billed yearly` : 'Billed monthly · cancel anytime'}</p>
              </div>
              <ul><li>Unlimited engineers and employees</li><li>Jira sync both ways</li><li>P1/P2 instant alerts</li><li>Pilot outcomes dashboard</li><li>Audit history and retention controls</li><li>Email support, next working day</li></ul>
              <a className="btn btn-primary" href={mailto('Cloud Team – early access')}>Join early access</a>
            </article>
            <article className="plan" id="setup">
              <div><h3>Setup service</h3><p className="for">For teams that want it done for them.</p></div>
              <div><div className="price"><span>from</span><b>{fmt(setupFrom)}</b><span>one-time</span></div><p className="price-note">Works with any plan</p></div>
              <ul><li>Jira connected and tested</li><li>Playbooks written for your company</li><li>Single sign-on set up</li><li>Training for employees and engineers</li><li>30 days of hands-on help</li></ul>
              <a className="btn btn-ghost" href={mailto('Setup service – book a call')}>Book a call</a>
            </article>
          </div>
          <p className="early"><b>Pilot teams</b> keep their early-access price for 12 months. Prices are in USD and may change before general release. Already have an account? <Link href="/login?next=/console" style={{ textDecoration: 'underline' }}>Sign in</Link>.</p>
        </div>
      </section>

      <section className="block" aria-labelledby="calc-title">
        <div className="rail calc">
          <div>
            <span className="label">Why flat pricing</span>
            <h2 className="h2" id="calc-title" style={{ marginTop: 18 }}>Your team grows. <em>Your bill doesn’t.</em></h2>
            <p className="lede">Most service-desk tools charge for every engineer. Put in what you pay per engineer today and see how the two compare as your team grows.</p>
          </div>
          <div className="calc-box">
            <div className="field-row">
              <label htmlFor="eng">Engineers on your IT team <output htmlFor="eng">{engineers}</output></label>
              <input type="range" id="eng" min={1} max={40} value={engineers} onChange={e => setEngineers(Number(e.target.value))} />
            </div>
            <div className="field-row">
              <label htmlFor="per">Your current cost per engineer, per month</label>
              <div className="money"><span aria-hidden="true">$</span><input id="per" inputMode="decimal" value={perSeat} onChange={e => setPerSeat(e.target.value)} /></div>
            </div>
            <div className="bars">
              <div className="bar them"><div className="top"><span>Per-engineer pricing</span><b>{fmt(them)}/mo</b></div><div className="track2"><div className="fill" style={{ width: `${(them / max) * 100}%` }} /></div></div>
              <div className="bar us"><div className="top"><span>Triage Portal Cloud Team</span><b>{fmt(team)}/mo</b></div><div className="track2"><div className="fill" style={{ width: `${(team / max) * 100}%` }} /></div></div>
            </div>
            <p className="saving" aria-live="polite">
              {diff > 0
                ? <>You’d save <b>{fmt(diff)}</b> a year.</>
                : <>At this size, per-engineer pricing costs <b>{fmt(-diff)}</b> less a year. Cloud Starter is free up to 3 engineers.</>}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
