import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as GET_METRICS } from '../../src/app/api/admin/pilot/route';
import { POST as TRACK_INTAKE } from '../../src/app/api/intake-sessions/route';
import {
  GET as GET_FEEDBACK,
  PUT as SAVE_FEEDBACK
} from '../../src/app/api/incidents/[id]/pilot-feedback/route';
import { insertIncident, resetInMemoryStorage } from '../../src/lib/db';
import type { IncidentPayload } from '../../src/lib/schema';

const incident: IncidentPayload = {
  title: 'Pilot route measurement test',
  summary: 'A complete incident used to verify pilot measurement API routes.',
  category: 'Application',
  urgency: 3,
  impact: 3,
  priority: 'P3',
  status: 'open',
  readinessScore: 100,
  reporter: { fullName: 'Employee', email: 'employee@example.com' },
  technicalContext: {
    operatingSystem: 'Windows',
    networkType: 'Office Ethernet',
    affectedApp: 'Finance application',
    attemptedWorkarounds: []
  }
};

describe('pilot measurement routes', () => {
  beforeEach(() => {
    resetInMemoryStorage();
    vi.stubEnv('AUTH_DEMO_MODE', 'true');
    vi.stubEnv('AUTH_DEMO_ROLE', 'admin');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('tracks intake completion and exposes aggregate admin metrics', async () => {
    const { incident: saved } = await insertIncident(incident);
    const sessionId = crypto.randomUUID();
    const started = await TRACK_INTAKE(new Request('http://localhost/api/intake-sessions', {
      method: 'POST',
      body: JSON.stringify({ action: 'start', sessionId })
    }));
    expect(started.status).toBe(201);
    const completed = await TRACK_INTAKE(new Request('http://localhost/api/intake-sessions', {
      method: 'POST',
      body: JSON.stringify({ action: 'complete', sessionId, incidentId: saved.id })
    }));
    expect(completed.status).toBe(200);

    const metrics = await GET_METRICS();
    expect(metrics.status).toBe(200);
    expect((await metrics.json()).data).toMatchObject({
      incidentCount: 1,
      intakeStarted: 1,
      intakeCompleted: 1,
      abandonmentRate: 0
    });
  });

  it('validates and stores engineer feedback for an incident', async () => {
    const { incident: saved } = await insertIncident(incident);
    const context = { params: Promise.resolve({ id: saved.id! }) };
    const empty = await GET_FEEDBACK(new Request('http://localhost/feedback'), context);
    expect((await empty.json()).data).toBeNull();

    const invalid = await SAVE_FEEDBACK(new Request('http://localhost/feedback', {
      method: 'PUT',
      body: JSON.stringify({ routingAccurate: true, clarificationCount: 21 })
    }), context);
    expect(invalid.status).toBe(400);

    const savedFeedback = await SAVE_FEEDBACK(new Request('http://localhost/feedback', {
      method: 'PUT',
      body: JSON.stringify({ routingAccurate: false, clarificationCount: 2 })
    }), context);
    expect(savedFeedback.status).toBe(200);
    expect((await savedFeedback.json()).data).toMatchObject({
      routingAccurate: false,
      clarificationCount: 2
    });
  });
});
