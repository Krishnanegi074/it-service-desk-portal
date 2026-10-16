import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalDoc } from '@/components/site/LegalDoc';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Privacy — Triage Portal',
  description: 'What Triage Portal collects, why, how long it is kept, and who can see it.'
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy notice"
      updated="16 October 2026"
      intro="Plain-language summary of what Triage Portal collects, why, and who can see it. This draft covers the early-access pilot and will be reviewed before general release."
    >
      <h2>Who this covers</h2>
      <p>Triage Portal is used by organisations to collect IT issues from their employees. Your organisation decides who can use it and is responsible for the tickets its people submit. We run the service on their behalf.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Account details:</b> your work email address, name and role (employee, engineer or admin), as added by your organisation’s admin.</li>
        <li><b>Ticket content:</b> what you type into a report, such as the issue type, description, device, network and error message, plus the priority it is given.</li>
        <li><b>Activity on tickets:</b> status changes, assignments, internal notes and delivery to your ticketing tool, with who made each change and when.</li>
        <li><b>Basic usage:</b> whether an intake form was started and finished, used to measure the pilot. This is counted, not tracked per keystroke.</li>
        <li><b>Technical logs:</b> request logs needed to keep the service running and secure. Passwords, tokens and request bodies are excluded.</li>
      </ul>

      <h2>What we do not collect</h2>
      <p>We don’t ask for passwords. Credentials pasted into a report in a recognised format are removed before the ticket is saved. We don’t sell data, show ads, or use tickets to train AI models.</p>

      <h2>Why we use it</h2>
      <p>To create and route IT tickets, show them to the right engineers, send them to your organisation’s ticketing tool if connected, keep an audit trail, and measure whether the pilot improves ticket quality.</p>

      <h2>Who can see it</h2>
      <ul>
        <li>You can see the tickets you submitted.</li>
        <li>Your organisation’s engineers and admins can see all of its tickets.</li>
        <li>If your organisation connects Jira Service Management, cleaned ticket details are sent there.</li>
        <li>We use a small number of providers to host the service, such as a managed database and email delivery for sign-in links.</li>
      </ul>

      <h2>How long it is kept</h2>
      <p>Your organisation’s admin sets how long resolved tickets are kept, between 30 days and 10 years. The default is one year. After that, tickets can be permanently deleted.</p>

      <h2>Your choices</h2>
      <p>Ask your organisation’s IT admin to correct or delete your account or tickets. You can also contact us and we’ll pass your request to them.</p>

      <h2>Contact</h2>
      <p>Questions about privacy: <a href={`mailto:${siteConfig.contactEmail}?subject=Privacy`}>{siteConfig.contactEmail}</a>. See also our <Link href="/security">security page</Link> and <Link href="/terms">terms</Link>.</p>
    </LegalDoc>
  );
}
