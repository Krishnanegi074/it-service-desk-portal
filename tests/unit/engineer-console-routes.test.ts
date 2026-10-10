import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH as ASSIGN } from '../../src/app/api/incidents/[id]/assignment/route';
import { POST as ADD_NOTE } from '../../src/app/api/incidents/[id]/notes/route';
import { GET as GET_EVENTS } from '../../src/app/api/incidents/[id]/events/route';
import { GET as GET_DELIVERY, POST as RETRY_DELIVERY } from '../../src/app/api/incidents/[id]/delivery/route';
import { insertIncident, resetInMemoryStorage } from '../../src/lib/db';
import type { IncidentPayload } from '../../src/lib/schema';

const DEMO_ADMIN_ID = '00000000-0000-4000-8000-000000000001';

function incident(priority: IncidentPayload['priority'] = 'P4'): IncidentPayload {
  return {
    title: 'Engineer console workflow test',
    summary: 'A complete incident used to verify the engineering workflow.',
    category: 'Application',
    urgency: priority === 'P1' ? 1 : 4,
    impact: priority === 'P1' ? 1 : 4,
    priority,
    status: 'open',
    readinessScore: 100,
    reporter: { fullName: 'Employee User', email: 'employee@example.com' },
    technicalContext: {
      operatingSystem: 'Windows',
      networkType: 'Office Ethernet',
      affectedApp: 'Finance application',
      attemptedWorkarounds: []
    }
  };
}

describe('Engineer console routes', () => {
  beforeEach(() => {
    resetInMemoryStorage();
    vi.stubEnv('AUTH_DEMO_MODE', 'true');
    vi.stubEnv('AUTH_DEMO_ROLE', 'admin');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('assigns incidents and stores sanitized internal notes in history', async () => {
    const { incident: saved } = await insertIncident(incident());
    const context = { params: Promise.resolve({ id: saved.id! }) };

    const assignment = await ASSIGN(new Request('http://localhost/assignment', {
      method: 'PATCH',
      body: JSON.stringify({ assigneeId: DEMO_ADMIN_ID })
    }), context);
    expect(assignment.status).toBe(200);
    expect((await assignment.json()).data.assignedTo.fullName).toBe('Demo Administrator');

    const note = await ADD_NOTE(new Request('http://localhost/notes', {
      method: 'POST',
      body: JSON.stringify({ note: 'Checked logs with token=super-secret-value' })
    }), context);
    expect(note.status).toBe(201);

    const events = await GET_EVENTS(new Request('http://localhost/events'), context);
    const eventsBody = await events.json();
    expect(eventsBody.data[0].metadata.note).toContain('[REDACTED_SECRET]');
    expect(eventsBody.data.map((event: { eventType: string }) => event.eventType))
      .toEqual(['note_added', 'assigned', 'created']);
  });

  it('reports delivery state and sends any incident through the Jira adapter', async () => {
    const { incident: lowPriority } = await insertIncident(incident());
    const lowContext = { params: Promise.resolve({ id: lowPriority.id! }) };
    const emptyDelivery = await GET_DELIVERY(new Request('http://localhost/delivery'), lowContext);
    expect((await emptyDelivery.json()).data).toBeNull();
    const retry = await RETRY_DELIVERY(new Request('http://localhost/delivery', { method: 'POST' }), lowContext);
    expect(retry.status).toBe(200);
    expect((await retry.json()).data).toMatchObject({ provider: 'jira', status: 'pending' });

    const persistedDelivery = await GET_DELIVERY(new Request('http://localhost/delivery'), lowContext);
    expect((await persistedDelivery.json()).data).toMatchObject({ attemptCount: 1, status: 'pending' });
  });
});
