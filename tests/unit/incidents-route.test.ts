import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../src/app/api/incidents/route';
import { GET as GET_INCIDENT } from '../../src/app/api/incidents/[id]/route';
import { GET as GET_EVENTS } from '../../src/app/api/incidents/[id]/events/route';
import { resetInMemoryStorage } from '../../src/lib/db';
import { resetRateLimits } from '../../src/lib/rate-limit';

const validPayload = {
  title: 'VPN authentication repeatedly times out',
  summary: 'The VPN fails after authentication while connected through home Wi-Fi.',
  category: 'Network / VPN',
  urgency: 3,
  impact: 4,
  reporter: {
    fullName: 'Test Employee',
    email: 'test.employee@example.com',
    department: 'Engineering'
  },
  technicalContext: {
    operatingSystem: 'macOS',
    networkType: 'Home Wi-Fi',
    errorCode: 'AUTH_TIMEOUT',
    affectedApp: 'VPN',
    attemptedWorkarounds: []
  },
  readinessScore: 0
};

function createPostRequest(idempotencyKey: string) {
  return new Request('http://localhost/api/incidents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify(validPayload)
  });
}

describe('Incidents route', () => {
  beforeEach(() => {
    resetInMemoryStorage();
    resetRateLimits();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('rejects requests when no verified session is available', async () => {
    vi.stubEnv('AUTH_DEMO_MODE', 'false');
    const response = await GET(new NextRequest('http://localhost/api/incidents'));
    expect(response.status).toBe(401);
  });

  it('preserves a zero readiness score and deduplicates retried requests', async () => {
    const firstResponse = await POST(createPostRequest('route-test-key'));
    const firstBody = await firstResponse.json();
    const duplicateResponse = await POST(createPostRequest('route-test-key'));
    const duplicateBody = await duplicateResponse.json();

    expect(firstResponse.status).toBe(201);
    expect(firstBody.data.readinessScore).toBe(0);
    expect(firstBody.duplicate).toBe(false);
    expect(duplicateResponse.status).toBe(200);
    expect(duplicateBody.duplicate).toBe(true);
    expect(duplicateBody.data.id).toBe(firstBody.data.id);

    const eventsResponse = await GET_EVENTS(
      new Request(`http://localhost/api/incidents/${firstBody.data.id}/events`),
      { params: Promise.resolve({ id: firstBody.data.id }) }
    );
    const eventsBody = await eventsResponse.json();
    expect(eventsBody.data).toHaveLength(2);
    expect(eventsBody.data.map((event: { eventType: string }) => event.eventType))
      .toEqual(['delivery_attempted', 'created']);
    expect(firstBody.delivery).toMatchObject({ provider: 'jira', status: 'pending', attemptCount: 1 });
    expect(duplicateBody.delivery).toMatchObject({ provider: 'jira', status: 'pending', attemptCount: 1 });

    const incidentResponse = await GET_INCIDENT(
      new Request(`http://localhost/api/incidents/${firstBody.data.id}`),
      { params: Promise.resolve({ id: firstBody.data.id }) }
    );
    const incidentBody = await incidentResponse.json();
    expect(incidentResponse.status).toBe(200);
    expect(incidentBody.data.id).toBe(firstBody.data.id);
  });

  it('returns pagination metadata and rejects invalid page values', async () => {
    await POST(createPostRequest('pagination-test-key'));

    const response = await GET(new NextRequest('http://localhost/api/incidents?page=1&limit=10'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });

    const filteredResponse = await GET(new NextRequest(
      'http://localhost/api/incidents?q=authentication&priority=P4&status=open'
    ));
    const filteredBody = await filteredResponse.json();
    expect(filteredBody.data).toHaveLength(1);

    const invalidResponse = await GET(new NextRequest('http://localhost/api/incidents?page=0'));
    expect(invalidResponse.status).toBe(400);
    const invalidStatus = await GET(new NextRequest('http://localhost/api/incidents?status=unknown'));
    expect(invalidStatus.status).toBe(400);
  });
});
