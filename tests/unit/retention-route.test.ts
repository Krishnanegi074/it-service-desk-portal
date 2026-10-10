import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../../src/app/api/admin/retention/route';
import { insertIncident, resetInMemoryStorage } from '../../src/lib/db';
import { RETENTION_CONFIRMATION } from '../../src/lib/retention';
import type { IncidentPayload } from '../../src/lib/schema';

const expiredIncident: IncidentPayload = {
  title: 'Expired retention test incident',
  summary: 'This incident exists only to verify the retention endpoint.',
  category: 'Application',
  urgency: 4,
  impact: 4,
  priority: 'P4',
  status: 'resolved',
  readinessScore: 100,
  reporter: { fullName: 'Test User', email: 'test@example.com' },
  technicalContext: {
    operatingSystem: 'Other',
    networkType: 'Not applicable',
    affectedApp: 'Test application',
    attemptedWorkarounds: []
  },
  createdAt: '2020-01-01T00:00:00.000Z'
};

describe('Retention administration route', () => {
  beforeEach(() => {
    resetInMemoryStorage();
    vi.stubEnv('AUTH_DEMO_MODE', 'true');
    vi.stubEnv('AUTH_DEMO_ROLE', 'admin');
    vi.stubEnv('INCIDENT_RETENTION_DAYS', '365');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('previews and purges expired incidents after exact confirmation', async () => {
    await insertIncident(expiredIncident);

    const previewResponse = await GET();
    const previewBody = await previewResponse.json();
    expect(previewResponse.status).toBe(200);
    expect(previewBody.data.eligibleIncidents).toBe(1);

    const rejected = await POST(new Request('http://localhost/api/admin/retention', {
      method: 'POST',
      body: JSON.stringify({ confirmation: 'PURGE' })
    }));
    expect(rejected.status).toBe(400);

    const purgeResponse = await POST(new Request('http://localhost/api/admin/retention', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: RETENTION_CONFIRMATION })
    }));
    const purgeBody = await purgeResponse.json();
    expect(purgeResponse.status).toBe(200);
    expect(purgeBody.data.deletedIncidents).toBe(1);
  });

  it('rejects non-admin users', async () => {
    vi.stubEnv('AUTH_DEMO_ROLE', 'engineer');
    const response = await GET();
    expect(response.status).toBe(403);
  });
});
