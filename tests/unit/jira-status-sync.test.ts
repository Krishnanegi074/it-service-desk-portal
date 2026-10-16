import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickTransition, syncJiraIssueStatus } from '../../src/lib/ticketing/jira-status-sync';

function configureJira() {
  vi.stubEnv('JIRA_BASE_URL', 'https://example.atlassian.net');
  vi.stubEnv('JIRA_EMAIL', 'integration@example.com');
  vi.stubEnv('JIRA_API_TOKEN', 'test-api-token');
  vi.stubEnv('JIRA_SERVICE_DESK_ID', '10');
  vi.stubEnv('JIRA_REQUEST_TYPE_ID', '20');
}

const transitions = [
  { id: '11', name: 'Start work', to: { name: 'Work in progress' } },
  { id: '21', name: 'Escalate', to: { name: 'Escalated' } },
  { id: '31', name: 'Resolve this issue', to: { name: 'Resolved' } },
  { id: '41', name: 'Close', to: { name: 'Closed' } }
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('Jira status sync', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('picks the closest Jira transition for each portal status', () => {
    expect(pickTransition(transitions, 'resolved')?.id).toBe('31');
    expect(pickTransition(transitions, 'in_triage')?.id).toBe('11');
    expect(pickTransition(transitions, 'dispatched')?.id).toBe('21');
    expect(pickTransition(transitions, 'open')).toBeNull();
  });

  it('moves the linked issue to the matching status', async () => {
    configureJira();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ fields: { status: { name: 'Open' } } }))
      .mockResolvedValueOnce(json({ transitions }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await syncJiraIssueStatus('IT-1', 'resolved');
    expect(result).toEqual({ status: 'synced', issueKey: 'IT-1', jiraStatus: 'Resolved' });
    expect(fetchMock.mock.calls[2][0]).toBe('https://example.atlassian.net/rest/api/3/issue/IT-1/transitions');
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ transition: { id: '31' } });
  });

  it('never resolves by cancelling, and steps through in-progress when needed', async () => {
    configureJira();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ fields: { status: { name: 'Open' } } }))
      .mockResolvedValueOnce(json({ transitions: [
        { id: '5', name: 'Cancel', to: { name: 'Canceled' } },
        { id: '6', name: 'Start', to: { name: 'In progress' } }
      ] }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(json({ transitions: [
        { id: '5', name: 'Cancel', to: { name: 'Canceled' } },
        { id: '7', name: 'Resolve', to: { name: 'Resolved' } }
      ] }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await syncJiraIssueStatus('IT-2', 'resolved')).toEqual({ status: 'synced', issueKey: 'IT-2', jiraStatus: 'Resolved' });
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ transition: { id: '6' } });
    expect(JSON.parse(fetchMock.mock.calls[4][1].body)).toEqual({ transition: { id: '7' } });
  });

  it('does nothing when Jira already shows the same status', async () => {
    configureJira();
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ fields: { status: { name: 'Resolved' } } }));
    vi.stubGlobal('fetch', fetchMock);
    expect((await syncJiraIssueStatus('IT-1', 'resolved')).status).toBe('unchanged');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('leaves Jira alone when it has no matching middle step', async () => {
    configureJira();
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(json({ fields: { status: { name: 'Canceled' } } }))
      .mockResolvedValueOnce(json({ transitions: [] })));
    expect(await syncJiraIssueStatus('IT-1', 'in_triage')).toEqual({ status: 'unchanged', issueKey: 'IT-1', jiraStatus: 'Canceled' });
  });

  it('reports failures without throwing', async () => {
    configureJira();
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(json({ fields: { status: { name: 'Open' } } }))
      .mockResolvedValueOnce(json({}, 403)));
    const result = await syncJiraIssueStatus('IT-1', 'resolved');
    expect(result.status).toBe('failed');
  });

  it('skips when there is no linked issue or Jira is not configured', async () => {
    expect((await syncJiraIssueStatus(null, 'resolved')).status).toBe('skipped');
    vi.stubEnv('JIRA_BASE_URL', '');
    expect((await syncJiraIssueStatus('IT-1', 'resolved')).status).toBe('skipped');
  });
});
