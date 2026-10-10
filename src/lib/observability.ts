import { sanitizeText } from './sanitizer';
import { resolveAppEnvironment } from './environment';

export type LogLevel = 'info' | 'warn' | 'error';

interface LogRecord {
  event: string;
  message: string;
  [key: string]: unknown;
}

export interface StructuredLogEntry extends Record<string, unknown> {
  timestamp: string;
  level: LogLevel;
  service: string;
  environment: string;
  version: string;
  event: string;
  message: string;
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[TRUNCATED]';
  if (typeof value === 'string') return sanitizeText(value).slice(0, 2000);
  if (Array.isArray(value)) return value.slice(0, 25).map(item => sanitizeValue(item, depth + 1));
  if (typeof value !== 'object' || value === null) return value;

  return Object.fromEntries(
    Object.entries(value).slice(0, 50).map(([key, child]) => [key, sanitizeValue(child, depth + 1)])
  );
}

export function createLogEntry(level: LogLevel, record: LogRecord): StructuredLogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    service: 'it-pre-triage-portal',
    environment: resolveAppEnvironment(),
    version: process.env.APP_VERSION || process.env.VERCEL_GIT_COMMIT_SHA || 'development',
    ...sanitizeValue(record) as LogRecord
  };
}

export function log(level: LogLevel, record: LogRecord) {
  const serialized = JSON.stringify(createLogEntry(level, record));
  if (level === 'error') console.error(serialized);
  else if (level === 'warn') console.warn(serialized);
  else console.info(serialized);
}

export async function reportServerError(
  error: unknown,
  context: Record<string, unknown>
) {
  const errorRecord = {
    event: 'server_request_error',
    message: error instanceof Error ? error.message : String(error),
    errorName: error instanceof Error ? error.name : 'UnknownError',
    digest: typeof error === 'object' && error !== null && 'digest' in error
      ? String(error.digest)
      : undefined,
    context
  };
  log('error', errorRecord);

  const endpoint = process.env.ERROR_REPORTING_ENDPOINT;
  if (!endpoint) return;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.ERROR_REPORTING_TOKEN
          ? { Authorization: `Bearer ${process.env.ERROR_REPORTING_TOKEN}` }
          : {})
      },
      body: JSON.stringify(createLogEntry('error', errorRecord)),
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) {
      log('warn', {
        event: 'error_reporting_failed',
        message: `Error reporting endpoint returned HTTP ${response.status}.`
      });
    }
  } catch (reportingError) {
    log('warn', {
      event: 'error_reporting_failed',
      message: reportingError instanceof Error ? reportingError.message : 'Error reporting request failed.'
    });
  }
}
