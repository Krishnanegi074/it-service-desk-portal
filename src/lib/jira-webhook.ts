import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncidentStatus } from './schema';

function digest(value: string) {
  return createHash('sha256').update(value).digest();
}

export function verifyJiraWebhookSecret(received: string | null, expected: string) {
  if (!received) return false;
  return timingSafeEqual(digest(received), digest(expected));
}

export function mapJiraStatus(statusName: string): IncidentStatus | null {
  const normalized = statusName.trim().toLowerCase();
  if (['new', 'open', 'to do', 'todo', 'backlog'].includes(normalized)) return 'open';
  if (['in progress', 'in triage', 'triage', 'investigating', 'waiting for support'].includes(normalized)) {
    return 'in_triage';
  }
  if (['assigned', 'dispatched', 'escalated', 'waiting for customer'].includes(normalized)) {
    return 'dispatched';
  }
  if (['resolved', 'closed', 'done', 'cancelled', 'canceled'].includes(normalized)) return 'resolved';
  return null;
}
