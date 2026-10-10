import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../src/app/api/integrations/jira/webhook/route';
import {
  getIncidentById,
  insertIncident,
  recordIncidentDelivery,
  resetInMemoryStorage
} from '../../src/lib/db';
import { mapJiraStatus } from '../../src/lib/jira-webhook';
import type { IncidentPayload } from '../../src/lib/schema';

const incident: IncidentPayload = {
  title: 'Jira webhook lifecycle test',
  summary: 'A complete incident used to verify status synchronization from Jira.',
  category: 'Application',
  urgency: 3,
  impact: 3,
  priority: 'P3',
  status: 'open',
  readinessScore: 100,
  reporter: { fullName: 'Employee', email: 'employee@example.com' },
  technicalContext: {
    operatingSystem: 'Linux',
    networkType: 'Office Ethernet',
    affectedApp: 'Internal application',
    attemptedWorkarounds: []
  }
};

function webhookRequest(secret: string, issueKey = 'HELP-99', status = 'Done') {
  return new Request('http://localhost/api/integrations/jira/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-triage-webhook-secret': secret
    },
    body: JSON.stringify({ issue: { key: issueKey, fields: { status: { name: status } } } })
  });
}

describe('Jira status webhook', () => {
  beforeEach(() => {
    resetInMemoryStorage();
    vi.stubEnv('JIRA_WEBHOOK_SECRET', 'webhook-test-secret');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('maps common Jira workflow statuses', () => {
    expect(mapJiraStatus('To Do')).toBe('open');
    expect(mapJiraStatus('In Progress')).toBe('in_triage');
    expect(mapJiraStatus('Waiting for customer')).toBe('dispatched');
    expect(mapJiraStatus('Done')).toBe('resolved');
    expect(mapJiraStatus('Custom unknown state')).toBeNull();
  });

  it('rejects a request with the wrong shared secret', async () => {
    expect((await POST(webhookRequest('wrong-secret'))).status).toBe(401);
  });

  it('updates the linked incident status from Jira', async () => {
    const { incident: saved } = await insertIncident(incident);
    await recordIncidentDelivery(saved.id!, 'jira', {
      status: 'delivered',
      externalId: 'HELP-99',
      externalUrl: 'https://example.atlassian.net/browse/HELP-99'
    });

    const response = await POST(webhookRequest('webhook-test-secret'));
    expect(response.status).toBe(200);
    expect((await response.json()).data.status).toBe('resolved');
    expect((await getIncidentById(saved.id!))?.status).toBe('resolved');
  });
});
