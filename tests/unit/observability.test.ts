import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLogEntry, reportServerError } from '../../src/lib/observability';

describe('structured observability', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('redacts secrets and truncates oversized values in structured logs', () => {
    const entry = createLogEntry('error', {
      event: 'test_error',
      message: 'authorization=Bearer secret-value',
      detail: 'x'.repeat(2500)
    });
    expect(entry).toMatchObject({ level: 'error', event: 'test_error' });
    expect(JSON.stringify(entry)).toContain('[REDACTED_SECRET]');
    expect(String(entry['detail'])).toHaveLength(2000);
  });

  it('reports sanitized request context without sending request headers', async () => {
    vi.stubEnv('ERROR_REPORTING_ENDPOINT', 'https://monitoring.example.com/errors');
    vi.stubEnv('ERROR_REPORTING_TOKEN', 'monitoring-test-token');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    await reportServerError(new Error('token=very-secret-value'), {
      method: 'POST',
      path: '/api/incidents'
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, request] = fetchMock.mock.calls[0];
    const body = String(request.body);
    expect(body).toContain('[REDACTED_SECRET]');
    expect(body).not.toContain('very-secret-value');
    expect(body).not.toContain('monitoring-test-token');
    expect(request.headers.Authorization).toBe('Bearer monitoring-test-token');
  });
});
