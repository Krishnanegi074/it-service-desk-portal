export const DEFAULT_INCIDENT_RETENTION_DAYS = 365;
export const MIN_INCIDENT_RETENTION_DAYS = 30;
export const MAX_INCIDENT_RETENTION_DAYS = 3650;
export const RETENTION_CONFIRMATION = 'PURGE_EXPIRED_INCIDENTS';

export function parseIncidentRetentionDays(value: string | undefined) {
  if (!value) return DEFAULT_INCIDENT_RETENTION_DAYS;

  const days = Number(value);
  if (
    !Number.isInteger(days) ||
    days < MIN_INCIDENT_RETENTION_DAYS ||
    days > MAX_INCIDENT_RETENTION_DAYS
  ) {
    throw new Error(
      `INCIDENT_RETENTION_DAYS must be an integer between ${MIN_INCIDENT_RETENTION_DAYS} and ${MAX_INCIDENT_RETENTION_DAYS}.`
    );
  }
  return days;
}

export function getIncidentRetentionDays() {
  return parseIncidentRetentionDays(process.env.INCIDENT_RETENTION_DAYS);
}

export function calculateRetentionCutoff(retentionDays: number, now = new Date()) {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}
