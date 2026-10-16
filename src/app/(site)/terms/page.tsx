import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalDoc } from '@/components/site/LegalDoc';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Terms — Triage Portal',
  description: 'The terms for using Triage Portal during early access.'
};

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of use"
      updated="16 October 2026"
      intro="These early-access terms apply while Triage Portal is in pilot. They will be replaced by full terms before general release."
    >
      <h2>Early access</h2>
      <p>Triage Portal is in an early-access pilot. Features may change, and the service may occasionally be unavailable while we improve it. We’ll tell pilot teams about planned changes in advance.</p>

      <h2>Your account</h2>
      <p>Accounts are created by your organisation’s admin. Keep access to your email account secure, because sign-in links are sent there. Don’t share sign-in links with anyone.</p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Use the service to report and resolve genuine IT issues for your organisation.</li>
        <li>Don’t enter passwords, one-time codes or access tokens into reports.</li>
        <li>Don’t try to access tickets or data you aren’t authorised to see, or to disrupt the service.</li>
      </ul>

      <h2>Your data</h2>
      <p>Your organisation owns the tickets it creates. We process them only to provide the service, as described in our <Link href="/privacy">privacy notice</Link>. You can ask for your organisation’s data to be exported or deleted.</p>

      <h2>Source code</h2>
      <p>The source code is published on <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer">GitHub</a>. Self-hosted use is governed by the licence published in that repository, and you are responsible for running and securing your own installation.</p>

      <h2>Pricing</h2>
      <p>Free plans are free. Paid plans and the setup service are billed as agreed in writing before work starts. Pilot teams keep their early-access price for 12 months. See <Link href="/pricing">pricing</Link>.</p>

      <h2>No guarantees during early access</h2>
      <p>The service is provided as it is during the pilot. It helps collect better tickets, but it does not replace your IT team’s judgement, and we are not responsible for decisions made using it.</p>

      <h2>Contact</h2>
      <p>Questions about these terms: <a href={`mailto:${siteConfig.contactEmail}?subject=Terms`}>{siteConfig.contactEmail}</a>.</p>
    </LegalDoc>
  );
}
