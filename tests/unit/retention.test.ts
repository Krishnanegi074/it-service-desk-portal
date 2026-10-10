import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  calculateRetentionCutoff,
  getIncidentRetentionDays,
  parseIncidentRetentionDays
} from '../../src/lib/retention';

describe('Incident retention policy', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('uses a safe default and validates configured boundaries', () => {
    expect(parseIncidentRetentionDays(undefined)).toBe(365);
    expect(parseIncidentRetentionDays('30')).toBe(30);
    expect(parseIncidentRetentionDays('3650')).toBe(3650);
    expect(() => parseIncidentRetentionDays('29')).toThrow(/between 30 and 3650/);
    expect(() => parseIncidentRetentionDays('not-a-number')).toThrow(/between 30 and 3650/);
  });

  it('reads the server environment and calculates a deterministic cutoff', () => {
    vi.stubEnv('INCIDENT_RETENTION_DAYS', '90');
    expect(getIncidentRetentionDays()).toBe(90);
    expect(calculateRetentionCutoff(30, new Date('2026-10-08T00:00:00.000Z')).toISOString())
      .toBe('2026-09-08T00:00:00.000Z');
  });
});
