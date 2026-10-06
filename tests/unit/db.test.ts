import { describe, it, expect } from 'vitest';
import { insertIncident, listIncidents } from '../../src/lib/db';

describe('Storage Layer Fallback', () => {
  it('stores and retrieves incidents via fallback when DATABASE_URL is not set', async () => {
    const sample = {
      title: 'Database Fallback Verification',
      summary: 'Testing in-memory fallback array',
      category: 'Network / VPN',
      urgency: 3 as const,
      impact: 3 as const,
      priority: 'P3' as const,
      status: 'open' as const,
      readinessScore: 100,
      reporter: {
        fullName: 'Dev Tester',
        email: 'tester@corp.internal'
      },
      technicalContext: {
        operatingSystem: 'Linux' as const,
        networkType: 'Ethernet',
        errorCode: 'CONN_RESET',
        affectedApp: 'VPN',
        attemptedWorkarounds: []
      }
    };

    const inserted = await insertIncident(sample);
    expect(inserted.id).toBeDefined();

    const all = await listIncidents();
    const found = all.find(i => i.id === inserted.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Database Fallback Verification');
  });
});
