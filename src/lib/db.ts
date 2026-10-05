import { Pool } from 'pg';
import { IncidentPayload } from './schema';

const pool = process.env.DATABASE_URL
  ? new Pool({ 
      connectionString: process.env.DATABASE_URL, 
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false 
    })
  : null;

const inMemoryIncidents: IncidentPayload[] = [];

export async function initDatabase() {
  if (!pool) return;

  const query = `
    CREATE TABLE IF NOT EXISTS incidents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      summary TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      urgency SMALLINT NOT NULL,
      impact SMALLINT NOT NULL,
      priority VARCHAR(10) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'open',
      readiness_score NUMERIC(5,2) NOT NULL,
      reporter JSONB NOT NULL,
      technical_context JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await pool.query(query);
}

export async function insertIncident(incident: IncidentPayload): Promise<IncidentPayload> {
  const id = incident.id || crypto.randomUUID();
  const enriched = { ...incident, id };

  if (!pool) {
    inMemoryIncidents.unshift(enriched);
    return enriched;
  }

  const query = `
    INSERT INTO incidents (
      id, title, summary, category, urgency, impact, priority, status, readiness_score, reporter, technical_context
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
  `;

  await pool.query(query, [
    enriched.id,
    enriched.title,
    enriched.summary,
    enriched.category,
    enriched.urgency,
    enriched.impact,
    enriched.priority,
    enriched.status,
    enriched.readinessScore,
    JSON.stringify(enriched.reporter),
    JSON.stringify(enriched.technicalContext)
  ]);

  return enriched;
}

export async function listIncidents(): Promise<IncidentPayload[]> {
  if (!pool) {
    return [...inMemoryIncidents];
  }

  const res = await pool.query('SELECT * FROM incidents ORDER BY created_at DESC');
  return res.rows.map(row => ({
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
    technicalContext: row.technical_context
  }));
}
