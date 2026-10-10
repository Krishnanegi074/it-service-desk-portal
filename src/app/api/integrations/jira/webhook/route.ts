import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getIncidentByExternalId, updateIncidentStatus } from '@/lib/db';
import { mapJiraStatus, verifyJiraWebhookSecret } from '@/lib/jira-webhook';

const JiraWebhookSchema = z.object({
  issue: z.object({
    key: z.string().min(1),
    fields: z.object({
      status: z.object({ name: z.string().min(1) })
    })
  })
});

export async function POST(request: Request) {
  const secret = process.env.JIRA_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { success: false, error: 'Jira webhook is not configured.' },
      { status: 503 }
    );
  }
  if (!verifyJiraWebhookSecret(request.headers.get('x-triage-webhook-secret'), secret)) {
    return NextResponse.json({ success: false, error: 'Invalid webhook secret.' }, { status: 401 });
  }

  try {
    const parsed = JiraWebhookSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid Jira webhook payload.' }, { status: 400 });
    }

    const externalId = parsed.data.issue.key;
    const jiraStatus = parsed.data.issue.fields.status.name;
    const mappedStatus = mapJiraStatus(jiraStatus);
    if (!mappedStatus) {
      return NextResponse.json({ success: true, ignored: true, reason: 'Unmapped Jira status.' });
    }

    const incident = await getIncidentByExternalId('jira', externalId);
    if (!incident?.id) {
      return NextResponse.json(
        { success: true, ignored: true, reason: 'No linked incident found.' },
        { status: 202 }
      );
    }

    const updated = await updateIncidentStatus(incident.id, mappedStatus, undefined, {
      source: 'jira_webhook',
      externalId,
      jiraStatus
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
