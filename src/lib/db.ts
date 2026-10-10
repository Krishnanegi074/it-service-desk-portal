import { Pool, PoolClient } from 'pg';
import {
  AppUserSummary,
  IncidentEvent,
  IncidentEventType,
  IncidentPagination,
  IncidentPayload,
  IncidentStatus,
  IntegrationDelivery,
  PilotFeedback,
  PilotFeedbackInput
} from './schema';

interface IntakeSession {
  id: string;
  status: 'started' | 'completed';
  incidentId: string | null;
  startedAt: string;
  completedAt: string | null;
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

interface InMemoryStore {
  incidents: IncidentPayload[];
  events: IncidentEvent[];
  deliveries: IntegrationDelivery[];
  intakeSessions: IntakeSession[];
  pilotFeedback: PilotFeedback[];
  idempotencyKeys: Map<string, string>;
}

const processState = globalThis as typeof globalThis & {
  __triagePortalMemoryStore?: InMemoryStore;
};
const memoryStore = processState.__triagePortalMemoryStore ?? {
  incidents: [],
  events: [],
  deliveries: [],
  intakeSessions: [],
  pilotFeedback: [],
  idempotencyKeys: new Map<string, string>()
};
memoryStore.deliveries ??= [];
memoryStore.intakeSessions ??= [];
memoryStore.pilotFeedback ??= [];
processState.__triagePortalMemoryStore = memoryStore;

const inMemoryIncidents = memoryStore.incidents;
const inMemoryEvents = memoryStore.events;
const inMemoryDeliveries = memoryStore.deliveries;
const inMemoryIntakeSessions = memoryStore.intakeSessions;
const inMemoryPilotFeedback = memoryStore.pilotFeedback;
const inMemoryIdempotencyKeys = memoryStore.idempotencyKeys;

interface IncidentRow {
  id: string;
  title: string;
  summary: string;
  category: string;
  urgency: IncidentPayload['urgency'];
  impact: IncidentPayload['impact'];
  priority: IncidentPayload['priority'];
  status: IncidentStatus;
  readiness_score: string | number;
  reporter: IncidentPayload['reporter'];
  technical_context: IncidentPayload['technicalContext'];
  assigned_to: string | null;
  assignee_email?: string | null;
  assignee_full_name?: string | null;
  assignee_role?: AppUserSummary['role'] | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface IncidentEventRow {
  id: string;
  incident_id: string;
  event_type: IncidentEventType;
  from_status: IncidentStatus | null;
  to_status: IncidentStatus | null;
  metadata: Record<string, unknown>;
  created_at: Date | string;
}

interface AppUserRow {
  id: string;
  email: string;
  full_name: string;
  role: AppUserSummary['role'];
}

interface IntegrationDeliveryRow {
  id: string;
  incident_id: string;
  provider: string;
  external_id: string | null;
  external_url: string | null;
  status: IntegrationDelivery['status'];
  attempt_count: number;
  last_error: string | null;
  updated_at: Date | string;
}

export interface PaginatedIncidents {
  items: IncidentPayload[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InsertIncidentOptions {
  idempotencyKey?: string;
  reporterId?: string;
}

export interface InsertIncidentResult {
  incident: IncidentPayload;
  created: boolean;
}

export interface RetentionPreview {
  eligibleIncidents: number;
  cutoff: string;
}

export interface RetentionPurgeResult extends RetentionPreview {
  runId: string;
  deletedIncidents: number;
}

export interface DeliveryAttempt {
  status: IntegrationDelivery['status'];
  externalId?: string;
  externalUrl?: string;
  error?: string;
}

export interface PilotMetrics {
  incidentCount: number;
  averageCompleteness: number;
  assignmentRate: number;
  medianAssignmentMinutes: number | null;
  resolutionRate: number;
  deliveryFailureRate: number;
  feedbackCoverage: number;
  routingAccuracyRate: number | null;
  averageClarifications: number | null;
  intakeStarted: number;
  intakeCompleted: number;
  abandonmentRate: number;
  priorityCounts: Record<IncidentPayload['priority'], number>;
  statusCounts: Record<IncidentStatus, number>;
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapIncidentRow(row: IncidentRow): IncidentPayload {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    category: row.category,
    urgency: row.urgency,
    impact: row.impact,
    priority: row.priority,
    status: row.status,
    readinessScore: Number(row.readiness_score),
    reporter: row.reporter,
    technicalContext: row.technical_context,
    assignedTo: row.assigned_to && row.assignee_email && row.assignee_full_name && row.assignee_role
      ? {
          id: row.assigned_to,
          email: row.assignee_email,
          fullName: row.assignee_full_name,
          role: row.assignee_role
        }
      : null,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at)
  };
}

function mapAppUserRow(row: AppUserRow): AppUserSummary {
  return { id: row.id, email: row.email, fullName: row.full_name, role: row.role };
}

function mapIntegrationDeliveryRow(row: IntegrationDeliveryRow): IntegrationDelivery {
  return {
    id: row.id,
    incidentId: row.incident_id,
    provider: row.provider,
    externalId: row.external_id,
    externalUrl: row.external_url,
    status: row.status,
    attemptCount: row.attempt_count,
    lastError: row.last_error,
    updatedAt: toIsoString(row.updated_at)
  };
}

function mapIncidentEventRow(row: IncidentEventRow): IncidentEvent {
  return {
    id: row.id,
    incidentId: row.incident_id,
    eventType: row.event_type,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    metadata: row.metadata,
    createdAt: toIsoString(row.created_at)
  };
}

function createInMemoryEvent(
  incidentId: string,
  eventType: IncidentEventType,
  fromStatus: IncidentStatus | null,
  toStatus: IncidentStatus | null,
  metadata: Record<string, unknown> = {}
): IncidentEvent {
  const event: IncidentEvent = {
    id: crypto.randomUUID(),
    incidentId,
    eventType,
    fromStatus,
    toStatus,
    metadata,
    createdAt: new Date().toISOString()
  };
  inMemoryEvents.unshift(event);
  return event;
}

async function insertDatabaseEvent(
  client: PoolClient,
  incidentId: string,
  eventType: IncidentEventType,
  fromStatus: IncidentStatus | null,
  toStatus: IncidentStatus | null,
  metadata: Record<string, unknown> = {},
  actorId?: string
) {
  await client.query(
    `INSERT INTO incident_events (
      incident_id, event_type, from_status, to_status, metadata, actor_id
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [incidentId, eventType, fromStatus, toStatus, JSON.stringify(metadata), actorId ?? null]
  );
}

export async function initDatabase() {
  if (!pool) return;
  await pool.query('SELECT 1 FROM schema_migrations LIMIT 1');
  await pool.query('SELECT 1 FROM incidents LIMIT 1');
}

export async function insertIncident(
  incident: IncidentPayload,
  options: InsertIncidentOptions = {}
): Promise<InsertIncidentResult> {
  const idempotencyKey = options.idempotencyKey?.trim() || undefined;

  if (!pool) {
    if (idempotencyKey) {
      const existingId = inMemoryIdempotencyKeys.get(idempotencyKey);
      const existing = inMemoryIncidents.find(item => item.id === existingId);
      if (existing) return { incident: { ...existing }, created: false };
    }

    const now = new Date().toISOString();
    const enriched: IncidentPayload = {
      ...incident,
      id: incident.id || crypto.randomUUID(),
      createdAt: incident.createdAt || now,
      updatedAt: now
    };

    inMemoryIncidents.unshift(enriched);
    if (idempotencyKey) inMemoryIdempotencyKeys.set(idempotencyKey, enriched.id!);
    createInMemoryEvent(enriched.id!, 'created', null, enriched.status, {
      source: 'incident_api'
    });
    return { incident: { ...enriched }, created: true };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const id = incident.id || crypto.randomUUID();
    const result = await client.query(
      `INSERT INTO incidents (
        id, idempotency_key, reporter_id, title, summary, category, urgency, impact,
        priority, status, readiness_score, reporter, technical_context
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING *`,
      [
        id,
        idempotencyKey ?? null,
        options.reporterId ?? null,
        incident.title,
        incident.summary,
        incident.category,
        incident.urgency,
        incident.impact,
        incident.priority,
        incident.status,
        incident.readinessScore,
        JSON.stringify(incident.reporter),
        JSON.stringify(incident.technicalContext)
      ]
    );

    if (result.rowCount === 0 && idempotencyKey) {
      const existing = await client.query(
        `SELECT i.*, a.email AS assignee_email, a.full_name AS assignee_full_name,
          a.role AS assignee_role
        FROM incidents i
        LEFT JOIN app_users a ON a.id = i.assigned_to
        WHERE i.idempotency_key = $1`,
        [idempotencyKey]
      );
      await client.query('COMMIT');
      return {
        incident: mapIncidentRow(existing.rows[0] as IncidentRow),
        created: false
      };
    }

    const saved = mapIncidentRow(result.rows[0] as IncidentRow);
    await insertDatabaseEvent(client, saved.id!, 'created', null, saved.status, {
      source: 'incident_api'
    });
    await client.query('COMMIT');
    return { incident: saved, created: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listIncidents(
  options: Partial<IncidentPagination> = {}
): Promise<PaginatedIncidents> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const query = options.q?.trim().toLowerCase() ?? '';
  const offset = (page - 1) * limit;

  if (!pool) {
    const filtered = inMemoryIncidents.filter(incident => {
      const searchable = [
        incident.id,
        incident.title,
        incident.summary,
        incident.category,
        incident.reporter.fullName,
        incident.reporter.email,
        incident.assignedTo?.fullName,
        incident.assignedTo?.email
      ].filter(Boolean).join(' ').toLowerCase();
      return (!query || searchable.includes(query)) &&
        (!options.status || incident.status === options.status) &&
        (!options.priority || incident.priority === options.priority) &&
        (!options.assigneeId || incident.assignedTo?.id === options.assigneeId);
    });
    const total = filtered.length;
    return {
      items: filtered.slice(offset, offset + limit).map(item => ({ ...item })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  const values: unknown[] = [];
  const conditions: string[] = [];
  const addCondition = (columnExpression: string, value: unknown) => {
    values.push(value);
    conditions.push(`${columnExpression} $${values.length}`);
  };
  if (query) {
    values.push(`%${query}%`);
    const placeholder = `$${values.length}`;
    conditions.push(
      `(LOWER(i.title) LIKE ${placeholder} OR LOWER(i.summary) LIKE ${placeholder}
        OR LOWER(i.category) LIKE ${placeholder} OR LOWER(i.reporter ->> 'fullName') LIKE ${placeholder}
        OR LOWER(i.reporter ->> 'email') LIKE ${placeholder} OR i.id::TEXT LIKE ${placeholder})`
    );
  }
  if (options.status) addCondition('i.status =', options.status);
  if (options.priority) addCondition('i.priority =', options.priority);
  if (options.assigneeId) addCondition('i.assigned_to =', options.assigneeId);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const itemValues = [...values, limit, offset];
  const [itemsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT i.*, a.email AS assignee_email, a.full_name AS assignee_full_name,
        a.role AS assignee_role
      FROM incidents i
      LEFT JOIN app_users a ON a.id = i.assigned_to
      ${where}
      ORDER BY i.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      itemValues
    ),
    pool.query(`SELECT COUNT(*) AS total FROM incidents i ${where}`, values)
  ]);
  const total = Number(countResult.rows[0].total);

  return {
    items: itemsResult.rows.map(row => mapIncidentRow(row as IncidentRow)),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getIncidentById(id: string): Promise<IncidentPayload | null> {
  if (!pool) {
    const incident = inMemoryIncidents.find(item => item.id === id);
    return incident ? { ...incident } : null;
  }

  const result = await pool.query(
    `SELECT i.*, a.email AS assignee_email, a.full_name AS assignee_full_name,
      a.role AS assignee_role
    FROM incidents i
    LEFT JOIN app_users a ON a.id = i.assigned_to
    WHERE i.id = $1`,
    [id]
  );
  if (result.rowCount === 0) return null;
  return mapIncidentRow(result.rows[0] as IncidentRow);
}

export async function updateIncidentStatus(
  id: string,
  status: IncidentStatus,
  actorId?: string,
  metadata: Record<string, unknown> = {}
): Promise<IncidentPayload | null> {
  if (!pool) {
    const target = inMemoryIncidents.find(incident => incident.id === id);
    if (!target) return null;
    if (target.status === status) return { ...target };

    const previousStatus = target.status;
    target.status = status;
    target.updatedAt = new Date().toISOString();
    createInMemoryEvent(id, 'status_changed', previousStatus, status, metadata);
    return { ...target };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const existingResult = await client.query(
      `SELECT i.*, a.email AS assignee_email, a.full_name AS assignee_full_name,
        a.role AS assignee_role
      FROM incidents i
      LEFT JOIN app_users a ON a.id = i.assigned_to
      WHERE i.id = $1
      FOR UPDATE OF i`,
      [id]
    );

    if (existingResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const existing = mapIncidentRow(existingResult.rows[0] as IncidentRow);
    if (existing.status === status) {
      await client.query('COMMIT');
      return existing;
    }

    const result = await client.query(
      'UPDATE incidents SET status = $2 WHERE id = $1 RETURNING *',
      [id, status]
    );
    await client.query(
      `INSERT INTO incident_events (
        incident_id, event_type, from_status, to_status, actor_id, metadata
      ) VALUES ($1, 'status_changed', $2, $3, $4, $5)`,
      [id, existing.status, status, actorId ?? null, JSON.stringify(metadata)]
    );
    await client.query('COMMIT');
    const updated = mapIncidentRow(result.rows[0] as IncidentRow);
    updated.assignedTo = existing.assignedTo;
    return updated;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listAssignableStaff(): Promise<AppUserSummary[]> {
  if (!pool) return [];
  const result = await pool.query(
    `SELECT id, email, full_name, role
    FROM app_users
    WHERE role IN ('engineer', 'admin')
    ORDER BY full_name ASC`
  );
  return result.rows.map(row => mapAppUserRow(row as AppUserRow));
}

export async function assignIncident(
  id: string,
  assignee: AppUserSummary | null,
  actorId?: string
): Promise<IncidentPayload | null> {
  if (!pool) {
    const target = inMemoryIncidents.find(incident => incident.id === id);
    if (!target) return null;
    if (target.assignedTo?.id === assignee?.id) return { ...target };
    const previousAssignee = target.assignedTo ?? null;
    target.assignedTo = assignee;
    target.updatedAt = new Date().toISOString();
    createInMemoryEvent(id, 'assigned', null, null, {
      previousAssignee,
      assignee
    });
    return { ...target };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(
      'UPDATE incidents SET assigned_to = $2 WHERE id = $1 RETURNING *',
      [id, assignee?.id ?? null]
    );
    if (updated.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    await insertDatabaseEvent(client, id, 'assigned', null, null, { assignee }, actorId);
    await client.query('COMMIT');
    const incident = mapIncidentRow(updated.rows[0] as IncidentRow);
    incident.assignedTo = assignee;
    return incident;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function addIncidentNote(
  id: string,
  note: string,
  actor: { id?: string; fullName: string; email: string }
): Promise<IncidentEvent | null> {
  if (!pool) {
    if (!inMemoryIncidents.some(incident => incident.id === id)) return null;
    return createInMemoryEvent(id, 'note_added', null, null, {
      note,
      actor: { fullName: actor.fullName, email: actor.email }
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const exists = await client.query('SELECT 1 FROM incidents WHERE id = $1', [id]);
    if (exists.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const result = await client.query(
      `INSERT INTO incident_events (
        incident_id, event_type, actor_id, metadata
      ) VALUES ($1, 'note_added', $2, $3)
      RETURNING *`,
      [
        id,
        actor.id ?? null,
        JSON.stringify({ note, actor: { fullName: actor.fullName, email: actor.email } })
      ]
    );
    await client.query('COMMIT');
    return mapIncidentEventRow(result.rows[0] as IncidentEventRow);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getIncidentDelivery(incidentId: string): Promise<IntegrationDelivery | null> {
  if (!pool) {
    const delivery = inMemoryDeliveries.find(item => item.incidentId === incidentId);
    return delivery ? { ...delivery } : null;
  }
  const result = await pool.query(
    'SELECT * FROM integration_deliveries WHERE incident_id = $1 ORDER BY updated_at DESC LIMIT 1',
    [incidentId]
  );
  return result.rowCount ? mapIntegrationDeliveryRow(result.rows[0] as IntegrationDeliveryRow) : null;
}

export async function getIncidentByExternalId(
  provider: string,
  externalId: string
): Promise<IncidentPayload | null> {
  if (!pool) {
    const delivery = inMemoryDeliveries.find(
      item => item.provider === provider && item.externalId === externalId
    );
    return delivery ? getIncidentById(delivery.incidentId) : null;
  }
  const result = await pool.query(
    `SELECT i.*, a.email AS assignee_email, a.full_name AS assignee_full_name,
      a.role AS assignee_role
    FROM integration_deliveries d
    JOIN incidents i ON i.id = d.incident_id
    LEFT JOIN app_users a ON a.id = i.assigned_to
    WHERE d.provider = $1 AND d.external_id = $2
    LIMIT 1`,
    [provider, externalId]
  );
  return result.rowCount ? mapIncidentRow(result.rows[0] as IncidentRow) : null;
}

export async function recordIncidentDelivery(
  incidentId: string,
  provider: string,
  attempt: DeliveryAttempt,
  actorId?: string
): Promise<IntegrationDelivery> {
  const lastError = attempt.status === 'delivered'
    ? null
    : attempt.error ?? (attempt.status === 'failed' ? 'Unknown delivery error' : null);

  if (!pool) {
    const existing = inMemoryDeliveries.find(
      item => item.incidentId === incidentId && item.provider === provider
    );
    const delivery: IntegrationDelivery = existing ?? {
      id: crypto.randomUUID(),
      incidentId,
      provider,
      externalId: null,
      externalUrl: null,
      status: 'pending',
      attemptCount: 0,
      lastError: null,
      updatedAt: new Date().toISOString()
    };
    delivery.status = attempt.status;
    delivery.externalId = attempt.externalId ?? delivery.externalId;
    delivery.externalUrl = attempt.externalUrl ?? delivery.externalUrl;
    delivery.attemptCount += 1;
    delivery.lastError = lastError;
    delivery.updatedAt = new Date().toISOString();
    if (!existing) inMemoryDeliveries.push(delivery);
    createInMemoryEvent(incidentId, 'delivery_attempted', null, null, {
      provider,
      status: attempt.status,
      attemptCount: delivery.attemptCount,
      externalId: delivery.externalId,
      error: lastError
    });
    return { ...delivery };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO integration_deliveries (
        incident_id, provider, status, attempt_count, last_error, external_id, external_url
      ) VALUES ($1, $2, $3, 1, $4, $5, $6)
      ON CONFLICT (incident_id, provider) DO UPDATE
      SET status = EXCLUDED.status,
          attempt_count = integration_deliveries.attempt_count + 1,
          last_error = EXCLUDED.last_error,
          external_id = COALESCE(EXCLUDED.external_id, integration_deliveries.external_id),
          external_url = COALESCE(EXCLUDED.external_url, integration_deliveries.external_url),
          next_attempt_at = NULL
      RETURNING *`,
      [
        incidentId,
        provider,
        attempt.status,
        lastError,
        attempt.externalId ?? null,
        attempt.externalUrl ?? null
      ]
    );
    const delivery = mapIntegrationDeliveryRow(result.rows[0] as IntegrationDeliveryRow);
    await insertDatabaseEvent(client, incidentId, 'delivery_attempted', null, null, {
      provider,
      status: attempt.status,
      attemptCount: delivery.attemptCount,
      externalId: delivery.externalId,
      error: lastError
    }, actorId);
    await client.query('COMMIT');
    return delivery;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listIncidentEvents(incidentId: string): Promise<IncidentEvent[]> {
  if (!pool) {
    return inMemoryEvents
      .filter(event => event.incidentId === incidentId)
      .map(event => ({ ...event, metadata: { ...event.metadata } }));
  }

  const result = await pool.query(
    'SELECT * FROM incident_events WHERE incident_id = $1 ORDER BY created_at DESC',
    [incidentId]
  );
  return result.rows.map(row => mapIncidentEventRow(row as IncidentEventRow));
}

export async function startIntakeSession(sessionId: string, startedAt = new Date()) {
  if (!pool) {
    if (!inMemoryIntakeSessions.some(session => session.id === sessionId)) {
      inMemoryIntakeSessions.push({
        id: sessionId,
        status: 'started',
        incidentId: null,
        startedAt: startedAt.toISOString(),
        completedAt: null
      });
    }
    return;
  }

  await pool.query(
    `INSERT INTO intake_sessions (id, status, started_at)
    VALUES ($1, 'started', $2)
    ON CONFLICT (id) DO NOTHING`,
    [sessionId, startedAt]
  );
}

export async function completeIntakeSession(sessionId: string, incidentId: string) {
  const now = new Date().toISOString();
  if (!pool) {
    const existing = inMemoryIntakeSessions.find(session => session.id === sessionId);
    if (existing) {
      existing.status = 'completed';
      existing.incidentId = incidentId;
      existing.completedAt = now;
    } else {
      inMemoryIntakeSessions.push({
        id: sessionId,
        status: 'completed',
        incidentId,
        startedAt: now,
        completedAt: now
      });
    }
    return;
  }

  await pool.query(
    `INSERT INTO intake_sessions (id, status, incident_id, completed_at)
    VALUES ($1, 'completed', $2, NOW())
    ON CONFLICT (id) DO UPDATE
    SET status = 'completed', incident_id = EXCLUDED.incident_id,
        completed_at = COALESCE(intake_sessions.completed_at, NOW())`,
    [sessionId, incidentId]
  );
}

export async function getPilotFeedback(incidentId: string): Promise<PilotFeedback | null> {
  if (!pool) {
    const feedback = inMemoryPilotFeedback.find(item => item.incidentId === incidentId);
    return feedback ? { ...feedback } : null;
  }

  const result = await pool.query(
    `SELECT incident_id, routing_accurate, clarification_count, updated_at
    FROM pilot_feedback WHERE incident_id = $1`,
    [incidentId]
  );
  if (!result.rowCount) return null;
  const row = result.rows[0] as {
    incident_id: string;
    routing_accurate: boolean;
    clarification_count: number;
    updated_at: Date | string;
  };
  return {
    incidentId: row.incident_id,
    routingAccurate: row.routing_accurate,
    clarificationCount: row.clarification_count,
    updatedAt: toIsoString(row.updated_at)
  };
}

export async function upsertPilotFeedback(
  incidentId: string,
  feedback: PilotFeedbackInput,
  actorId?: string
): Promise<PilotFeedback | null> {
  if (!pool) {
    if (!inMemoryIncidents.some(incident => incident.id === incidentId)) return null;
    const stored: PilotFeedback = {
      incidentId,
      ...feedback,
      updatedAt: new Date().toISOString()
    };
    const index = inMemoryPilotFeedback.findIndex(item => item.incidentId === incidentId);
    if (index >= 0) inMemoryPilotFeedback[index] = stored;
    else inMemoryPilotFeedback.push(stored);
    return { ...stored };
  }

  const result = await pool.query(
    `INSERT INTO pilot_feedback (
      incident_id, routing_accurate, clarification_count, submitted_by
    ) VALUES ($1, $2, $3, $4)
    ON CONFLICT (incident_id) DO UPDATE
    SET routing_accurate = EXCLUDED.routing_accurate,
        clarification_count = EXCLUDED.clarification_count,
        submitted_by = EXCLUDED.submitted_by,
        updated_at = NOW()
    RETURNING incident_id, routing_accurate, clarification_count, updated_at`,
    [incidentId, feedback.routingAccurate, feedback.clarificationCount, actorId ?? null]
  );
  if (!result.rowCount) return null;
  const row = result.rows[0] as {
    incident_id: string;
    routing_accurate: boolean;
    clarification_count: number;
    updated_at: Date | string;
  };
  return {
    incidentId: row.incident_id,
    routingAccurate: row.routing_accurate,
    clarificationCount: row.clarification_count,
    updatedAt: toIsoString(row.updated_at)
  };
}

function percentage(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 10;
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  const value = sorted.length % 2
    ? sorted[midpoint]
    : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
  return Math.round(value * 10) / 10;
}

export async function getPilotMetrics(now = new Date()): Promise<PilotMetrics> {
  const priorityCounts: PilotMetrics['priorityCounts'] = { P1: 0, P2: 0, P3: 0, P4: 0 };
  const statusCounts: PilotMetrics['statusCounts'] = {
    open: 0,
    in_triage: 0,
    dispatched: 0,
    resolved: 0
  };

  if (!pool) {
    const incidentCount = inMemoryIncidents.length;
    for (const incident of inMemoryIncidents) {
      priorityCounts[incident.priority] += 1;
      statusCounts[incident.status] += 1;
    }
    const assignmentMinutes = inMemoryIncidents.flatMap(incident => {
      const assigned = inMemoryEvents
        .filter(event => event.incidentId === incident.id && event.eventType === 'assigned' && event.metadata.assignee)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      return assigned && incident.createdAt
        ? [(new Date(assigned.createdAt).getTime() - new Date(incident.createdAt).getTime()) / 60_000]
        : [];
    });
    const failedDeliveries = inMemoryDeliveries.filter(delivery => delivery.status === 'failed').length;
    const accurateRoutes = inMemoryPilotFeedback.filter(feedback => feedback.routingAccurate).length;
    const clarificationTotal = inMemoryPilotFeedback.reduce(
      (sum, feedback) => sum + feedback.clarificationCount,
      0
    );
    const abandonmentCutoff = now.getTime() - 15 * 60_000;
    const abandoned = inMemoryIntakeSessions.filter(
      session => session.status === 'started' && new Date(session.startedAt).getTime() < abandonmentCutoff
    ).length;
    const completed = inMemoryIntakeSessions.filter(session => session.status === 'completed').length;
    const eligibleSessions = completed + abandoned;

    return {
      incidentCount,
      averageCompleteness: incidentCount
        ? Math.round(inMemoryIncidents.reduce((sum, item) => sum + item.readinessScore, 0) / incidentCount * 10) / 10
        : 0,
      assignmentRate: percentage(assignmentMinutes.length, incidentCount),
      medianAssignmentMinutes: median(assignmentMinutes),
      resolutionRate: percentage(statusCounts.resolved, incidentCount),
      deliveryFailureRate: percentage(failedDeliveries, inMemoryDeliveries.length),
      feedbackCoverage: percentage(inMemoryPilotFeedback.length, incidentCount),
      routingAccuracyRate: inMemoryPilotFeedback.length
        ? percentage(accurateRoutes, inMemoryPilotFeedback.length)
        : null,
      averageClarifications: inMemoryPilotFeedback.length
        ? Math.round(clarificationTotal / inMemoryPilotFeedback.length * 10) / 10
        : null,
      intakeStarted: inMemoryIntakeSessions.length,
      intakeCompleted: completed,
      abandonmentRate: percentage(abandoned, eligibleSessions),
      priorityCounts,
      statusCounts
    };
  }

  const [incidentResult, assignmentResult, deliveryResult, feedbackResult, intakeResult, priorityResult, statusResult] = await Promise.all([
    pool.query(`SELECT COUNT(*) AS total, COALESCE(AVG(readiness_score), 0) AS average_completeness,
      COUNT(*) FILTER (WHERE status = 'resolved') AS resolved FROM incidents`),
    pool.query(`SELECT EXTRACT(EPOCH FROM (MIN(e.created_at) - i.created_at)) / 60 AS minutes
      FROM incidents i JOIN incident_events e ON e.incident_id = i.id
      WHERE e.event_type = 'assigned' AND e.metadata -> 'assignee' IS NOT NULL
        AND e.metadata -> 'assignee' <> 'null'::jsonb
      GROUP BY i.id, i.created_at`),
    pool.query(`SELECT COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'failed') AS failed FROM integration_deliveries`),
    pool.query(`SELECT COUNT(*) AS total,
      COUNT(*) FILTER (WHERE routing_accurate) AS accurate,
      COALESCE(AVG(clarification_count), 0) AS average_clarifications FROM pilot_feedback`),
    pool.query(`SELECT COUNT(*) AS started,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed,
      COUNT(*) FILTER (WHERE status = 'started' AND started_at < $1) AS abandoned
      FROM intake_sessions`, [new Date(now.getTime() - 15 * 60_000)]),
    pool.query('SELECT priority, COUNT(*) AS total FROM incidents GROUP BY priority'),
    pool.query('SELECT status, COUNT(*) AS total FROM incidents GROUP BY status')
  ]);

  for (const row of priorityResult.rows as Array<{ priority: IncidentPayload['priority']; total: string }>) {
    priorityCounts[row.priority] = Number(row.total);
  }
  for (const row of statusResult.rows as Array<{ status: IncidentStatus; total: string }>) {
    statusCounts[row.status] = Number(row.total);
  }
  const incidents = incidentResult.rows[0];
  const deliveries = deliveryResult.rows[0];
  const feedback = feedbackResult.rows[0];
  const intake = intakeResult.rows[0];
  const incidentCount = Number(incidents.total);
  const feedbackCount = Number(feedback.total);
  const completed = Number(intake.completed);
  const abandoned = Number(intake.abandoned);

  return {
    incidentCount,
    averageCompleteness: Math.round(Number(incidents.average_completeness) * 10) / 10,
    assignmentRate: percentage(assignmentResult.rows.length, incidentCount),
    medianAssignmentMinutes: median(assignmentResult.rows.map(row => Number(row.minutes))),
    resolutionRate: percentage(Number(incidents.resolved), incidentCount),
    deliveryFailureRate: percentage(Number(deliveries.failed), Number(deliveries.total)),
    feedbackCoverage: percentage(feedbackCount, incidentCount),
    routingAccuracyRate: feedbackCount ? percentage(Number(feedback.accurate), feedbackCount) : null,
    averageClarifications: feedbackCount
      ? Math.round(Number(feedback.average_clarifications) * 10) / 10
      : null,
    intakeStarted: Number(intake.started),
    intakeCompleted: completed,
    abandonmentRate: percentage(abandoned, completed + abandoned),
    priorityCounts,
    statusCounts
  };
}

export async function previewIncidentRetention(cutoff: Date): Promise<RetentionPreview> {
  const cutoffIso = cutoff.toISOString();
  if (!pool) {
    return {
      eligibleIncidents: inMemoryIncidents.filter(
        incident => incident.createdAt && incident.createdAt < cutoffIso
      ).length,
      cutoff: cutoffIso
    };
  }

  const result = await pool.query(
    'SELECT COUNT(*) AS total FROM incidents WHERE created_at < $1',
    [cutoff]
  );
  return { eligibleIncidents: Number(result.rows[0].total), cutoff: cutoffIso };
}

export async function purgeExpiredIncidents(
  cutoff: Date,
  retentionDays: number,
  actorId?: string
): Promise<RetentionPurgeResult> {
  const cutoffIso = cutoff.toISOString();
  const runId = crypto.randomUUID();

  if (!pool) {
    const expiredIds = new Set(
      inMemoryIncidents
        .filter(incident => incident.id && incident.createdAt && incident.createdAt < cutoffIso)
        .map(incident => incident.id!)
    );

    for (let index = inMemoryIncidents.length - 1; index >= 0; index -= 1) {
      if (inMemoryIncidents[index].id && expiredIds.has(inMemoryIncidents[index].id!)) {
        inMemoryIncidents.splice(index, 1);
      }
    }
    for (let index = inMemoryEvents.length - 1; index >= 0; index -= 1) {
      if (expiredIds.has(inMemoryEvents[index].incidentId)) inMemoryEvents.splice(index, 1);
    }
    for (let index = inMemoryDeliveries.length - 1; index >= 0; index -= 1) {
      if (expiredIds.has(inMemoryDeliveries[index].incidentId)) inMemoryDeliveries.splice(index, 1);
    }
    for (let index = inMemoryPilotFeedback.length - 1; index >= 0; index -= 1) {
      if (expiredIds.has(inMemoryPilotFeedback[index].incidentId)) inMemoryPilotFeedback.splice(index, 1);
    }
    for (const session of inMemoryIntakeSessions) {
      if (session.incidentId && expiredIds.has(session.incidentId)) session.incidentId = null;
    }
    for (const [key, incidentId] of inMemoryIdempotencyKeys.entries()) {
      if (expiredIds.has(incidentId)) inMemoryIdempotencyKeys.delete(key);
    }

    return {
      runId,
      deletedIncidents: expiredIds.size,
      eligibleIncidents: expiredIds.size,
      cutoff: cutoffIso
    };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const deleted = await client.query(
      'DELETE FROM incidents WHERE created_at < $1 RETURNING id',
      [cutoff]
    );
    await client.query(
      `INSERT INTO retention_runs (
        id, retention_days, cutoff_at, deleted_incidents, actor_id
      ) VALUES ($1, $2, $3, $4, $5)`,
      [runId, retentionDays, cutoff, deleted.rowCount ?? 0, actorId ?? null]
    );
    await client.query('COMMIT');
    return {
      runId,
      deletedIncidents: deleted.rowCount ?? 0,
      eligibleIncidents: deleted.rowCount ?? 0,
      cutoff: cutoffIso
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export function resetInMemoryStorage() {
  inMemoryIncidents.length = 0;
  inMemoryEvents.length = 0;
  inMemoryDeliveries.length = 0;
  inMemoryIntakeSessions.length = 0;
  inMemoryPilotFeedback.length = 0;
  inMemoryIdempotencyKeys.clear();
}
