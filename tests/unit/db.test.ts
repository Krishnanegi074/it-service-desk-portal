import { beforeEach, describe, expect, it } from 'vitest';
import {
  addIncidentNote,
  assignIncident,
  completeIntakeSession,
  getIncidentDelivery,
  getPilotMetrics,
  insertIncident,
  listIncidentEvents,
  listIncidents,
  previewIncidentRetention,
  purgeExpiredIncidents,
  recordIncidentDelivery,
  resetInMemoryStorage,
  startIntakeSession,
  upsertPilotFeedback,
  updateIncidentStatus
} from '../../src/lib/db';
import { IncidentPayload } from '../../src/lib/schema';

function buildIncident(overrides: Partial<IncidentPayload> = {}): IncidentPayload {
  return {
    title: 'Database Fallback Verification',
    summary: 'Testing the in-memory storage fallback behavior.',
    category: 'Network / VPN',
    urgency: 3,
    impact: 3,
    priority: 'P3',
    status: 'open',
    readinessScore: 100,
    reporter: {
      fullName: 'Dev Tester',
      email: 'tester@corp.internal'
    },
    technicalContext: {
      operatingSystem: 'Linux',
      networkType: 'Ethernet',
      errorCode: 'CONN_RESET',
      affectedApp: 'VPN',
      attemptedWorkarounds: []
    },
    ...overrides
  };
}

describe('Storage Layer Fallback', () => {
  beforeEach(() => resetInMemoryStorage());

  it('stores, timestamps, and retrieves incidents', async () => {
    const { incident: inserted, created } = await insertIncident(buildIncident());
    expect(created).toBe(true);
    expect(inserted.id).toBeDefined();
    expect(inserted.createdAt).toBeDefined();
    expect(inserted.updatedAt).toBeDefined();

    const result = await listIncidents();
    const found = result.items.find(item => item.id === inserted.id);
    expect(result.total).toBe(1);
    expect(found?.title).toBe('Database Fallback Verification');
  });

  it('persists status changes and records audit events', async () => {
    const { incident } = await insertIncident(buildIncident());
    const updated = await updateIncidentStatus(incident.id!, 'in_triage');
    expect(updated?.status).toBe('in_triage');

    const events = await listIncidentEvents(incident.id!);
    expect(events).toHaveLength(2);
    expect(events.map(event => event.eventType)).toEqual(['status_changed', 'created']);
    expect(events[0]).toMatchObject({
      fromStatus: 'open',
      toStatus: 'in_triage'
    });
  });

  it('returns null when updating an incident that does not exist', async () => {
    const updated = await updateIncidentStatus(crypto.randomUUID(), 'resolved');
    expect(updated).toBeNull();
  });

  it('returns the original incident for a repeated idempotency key', async () => {
    const first = await insertIncident(buildIncident(), { idempotencyKey: 'same-request' });
    const repeated = await insertIncident(
      buildIncident({ title: 'This duplicate must not be inserted' }),
      { idempotencyKey: 'same-request' }
    );

    expect(first.created).toBe(true);
    expect(repeated.created).toBe(false);
    expect(repeated.incident.id).toBe(first.incident.id);

    const result = await listIncidents();
    expect(result.total).toBe(1);
  });

  it('paginates incidents deterministically', async () => {
    await insertIncident(buildIncident({ title: 'First incident title' }));
    await insertIncident(buildIncident({ title: 'Second incident title' }));
    await insertIncident(buildIncident({ title: 'Third incident title' }));

    const firstPage = await listIncidents({ page: 1, limit: 2 });
    const secondPage = await listIncidents({ page: 2, limit: 2 });

    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.total).toBe(3);
    expect(firstPage.totalPages).toBe(2);
    expect(secondPage.items).toHaveLength(1);
  });

  it('previews and purges expired incidents with their related events', async () => {
    const expired = await insertIncident(
      buildIncident({ createdAt: '2020-01-01T00:00:00.000Z' }),
      { idempotencyKey: 'expired-incident' }
    );
    await insertIncident(buildIncident({ title: 'Recent retained incident' }));
    const cutoff = new Date('2025-01-01T00:00:00.000Z');

    expect((await previewIncidentRetention(cutoff)).eligibleIncidents).toBe(1);
    const result = await purgeExpiredIncidents(cutoff, 365);
    expect(result.deletedIncidents).toBe(1);
    expect((await listIncidents()).items).toHaveLength(1);
    expect(await listIncidentEvents(expired.incident.id!)).toHaveLength(0);

    const retried = await insertIncident(
      buildIncident({ createdAt: '2020-01-01T00:00:00.000Z' }),
      { idempotencyKey: 'expired-incident' }
    );
    expect(retried.created).toBe(true);
  });

  it('filters the queue and records assignment, notes, and delivery attempts', async () => {
    const { incident } = await insertIncident(buildIncident({ title: 'Searchable VPN outage' }));
    const assignee = {
      id: crypto.randomUUID(),
      fullName: 'Queue Engineer',
      email: 'queue.engineer@example.com',
      role: 'engineer' as const
    };

    const assigned = await assignIncident(incident.id!, assignee);
    expect(assigned?.assignedTo?.id).toBe(assignee.id);
    expect((await listIncidents({ q: 'vpn outage', assigneeId: assignee.id })).total).toBe(1);
    expect((await listIncidents({ status: 'resolved' })).total).toBe(0);

    await addIncidentNote(incident.id!, 'Investigating gateway logs.', {
      fullName: assignee.fullName,
      email: assignee.email
    });
    expect((await listIncidentEvents(incident.id!))[0].eventType).toBe('note_added');

    const failed = await recordIncidentDelivery(incident.id!, 'jira', {
      status: 'failed',
      error: 'Temporary upstream error'
    });
    expect(failed).toMatchObject({ status: 'failed', attemptCount: 1 });
    const delivered = await recordIncidentDelivery(incident.id!, 'jira', {
      status: 'delivered',
      externalId: 'HELP-123',
      externalUrl: 'https://example.atlassian.net/browse/HELP-123'
    });
    expect(delivered).toMatchObject({
      status: 'delivered',
      attemptCount: 2,
      externalId: 'HELP-123'
    });
    expect((await getIncidentDelivery(incident.id!))?.status).toBe('delivered');
  });

  it('calculates privacy-conscious pilot outcome metrics', async () => {
    const { incident } = await insertIncident(buildIncident({ readinessScore: 80 }));
    const assignee = {
      id: crypto.randomUUID(),
      fullName: 'Pilot Engineer',
      email: 'pilot.engineer@example.com',
      role: 'engineer' as const
    };
    await assignIncident(incident.id!, assignee);
    await upsertPilotFeedback(incident.id!, { routingAccurate: true, clarificationCount: 1 });
    await recordIncidentDelivery(incident.id!, 'jira', {
      status: 'failed',
      error: 'Jira unavailable'
    });

    const abandonedSession = crypto.randomUUID();
    const completedSession = crypto.randomUUID();
    await startIntakeSession(abandonedSession, new Date('2025-01-01T00:00:00.000Z'));
    await startIntakeSession(completedSession);
    await completeIntakeSession(completedSession, incident.id!);

    const metrics = await getPilotMetrics(new Date('2025-01-02T00:00:00.000Z'));
    expect(metrics).toMatchObject({
      incidentCount: 1,
      averageCompleteness: 80,
      assignmentRate: 100,
      deliveryFailureRate: 100,
      feedbackCoverage: 100,
      routingAccuracyRate: 100,
      averageClarifications: 1,
      intakeStarted: 2,
      intakeCompleted: 1,
      abandonmentRate: 50
    });
    expect(metrics.medianAssignmentMinutes).not.toBeNull();
  });
});
