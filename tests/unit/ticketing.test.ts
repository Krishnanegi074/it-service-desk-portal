import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTicketingAdapter } from '../../src/lib/ticketing';
import type { IncidentPayload } from '../../src/lib/schema';

const incident: IncidentPayload = {
  id: '20000000-0000-4000-8000-000000000001',
  title: 'Finance application is unavailable',
  summary: 'The finance application shows an unavailable message for the whole team.',
  category: 'Application',
  urgency: 1,
  impact: 1,
  priority: 'P1',
  status: 'open',
  readinessScore: 90,
  reporter: { fullName: 'Test Employee', email: 'employee@example.com' },
  technicalContext: {
    operatingSystem: 'Windows',
    networkType: 'Office Ethernet',
    affectedApp: 'Finance application',
    errorCode: 'SERVICE_UNAVAILABLE',
    attemptedWorkarounds: ['Restarted application']
  }
};

function configureJira() {
  vi.stubEnv('JIRA_BASE_URL', 'https://example.atlassian.net');
  vi.stubEnv('JIRA_EMAIL', 'integration@example.com');
  vi.stubEnv('JIRA_API_TOKEN', 'test-api-token');
  vi.stubEnv('JIRA_SERVICE_DESK_ID', '10');
  vi.stubEnv('JIRA_REQUEST_TYPE_ID', '20');
}

describe('Jira ticketing adapter', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('keeps delivery pending when Jira is not configured', async () => {
    vi.stubEnv('JIRA_BASE_URL', '');
    vi.stubEnv('JIRA_EMAIL', '');
    vi.stubEnv('JIRA_API_TOKEN', '');
    vi.stubEnv('JIRA_SERVICE_DESK_ID', '');
    vi.stubEnv('JIRA_REQUEST_TYPE_ID', '');

    await expect(getTicketingAdapter().createIncident(incident)).resolves.toMatchObject({
      provider: 'jira',
      status: 'pending'
    });
  });

  it('creates a Jira Service Management request and returns its reference', async () => {
    configureJira();
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ issueId: '10001', issueKey: 'HELP-42' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    ));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getTicketingAdapter().createIncident(incident);
    expect(result).toMatchObject({
      status: 'delivered',
      externalId: 'HELP-42',
      externalUrl: 'https://example.atlassian.net/browse/HELP-42'
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, request] = fetchMock.mock.calls[0];
    const payload = JSON.parse(String(request.body));
    expect(payload).toMatchObject({
      serviceDeskId: '10',
      requestTypeId: '20',
      requestFieldValues: { summary: '[P1] Finance application is unavailable' }
    });
    expect(request.headers.Authorization).toMatch(/^Basic /);
  });

  it('returns a retryable failure without throwing when Jira rejects the request', async () => {
    configureJira();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ errorMessage: 'Request type is unavailable' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )));

    await expect(getTicketingAdapter().createIncident(incident)).resolves.toMatchObject({
      status: 'failed',
      statusCode: 400,
      error: 'Request type is unavailable'
    });
  });
});
