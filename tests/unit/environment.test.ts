import { describe, expect, it } from 'vitest';
import { inspectEnvironment, resolveAppEnvironment } from '../../src/lib/environment';

const completeProductionEnvironment = {
  APP_ENV: 'production',
  DATABASE_URL: 'postgresql://user:password@database.internal/triage',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-test-key',
  JIRA_BASE_URL: 'https://example.atlassian.net',
  JIRA_EMAIL: 'integration@example.com',
  JIRA_API_TOKEN: 'test-token',
  JIRA_SERVICE_DESK_ID: '10',
  JIRA_REQUEST_TYPE_ID: '20',
  JIRA_WEBHOOK_SECRET: 'test-webhook-secret',
  ERROR_REPORTING_ENDPOINT: 'https://monitoring.example.com/errors'
};

describe('runtime environment inspection', () => {
  it('separates Vercel preview from production', () => {
    expect(resolveAppEnvironment({ VERCEL_ENV: 'preview', NODE_ENV: 'production' })).toBe('staging');
    expect(resolveAppEnvironment({ VERCEL_ENV: 'production', NODE_ENV: 'production' })).toBe('production');
    expect(resolveAppEnvironment({ NODE_ENV: 'test' })).toBe('test');
  });

  it('accepts a complete production configuration without exposing values', () => {
    const result = inspectEnvironment(completeProductionEnvironment);
    expect(result.ready).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.services).toEqual({
      database: true,
      authentication: true,
      jira: true,
      escalationWebhook: false,
      errorReporting: true
    });
    expect(JSON.stringify(result)).not.toContain('test-token');
  });

  it('fails readiness when production dependencies or HTTPS endpoints are missing', () => {
    const result = inspectEnvironment({
      APP_ENV: 'production',
      JIRA_BASE_URL: 'http://example.atlassian.net'
    });
    expect(result.ready).toBe(false);
    expect(result.errors).toContain('DATABASE_URL is required outside local/test environments.');
    expect(result.errors).toContain('JIRA_BASE_URL must be a valid HTTPS URL.');
  });

  it('allows local development with an incomplete optional Jira configuration', () => {
    const result = inspectEnvironment({ APP_ENV: 'development', JIRA_EMAIL: 'dev@example.com' });
    expect(result.ready).toBe(true);
    expect(result.warnings).toContain(
      'Jira configuration is incomplete; deliveries will remain pending or fail validation.'
    );
  });
});
