import { describe, it, expect } from 'vitest';
import { dispatchHighSeverityIncident } from '../../src/lib/dispatcher';
import { IncidentPayload } from '../../src/lib/schema';

describe('Outbound Escalation Dispatcher', () => {
  it('skips auto-dispatch for low priority (P3/P4) incidents', async () => {
    const p3Incident: IncidentPayload = {
      title: 'Minor printer spooler issue',
      summary: 'Printer spooler hung on workstation',
      category: 'Peripherals',
      urgency: 3,
      impact: 4,
      priority: 'P4',
      status: 'open',
      readinessScore: 80,
      reporter: {
        fullName: 'Test User',
        email: 'test@corp.internal'
      },
      technicalContext: {
        operatingSystem: 'macOS',
        networkType: 'WiFi',
        errorCode: 'SPOOL_0',
        affectedApp: 'Printer Spooler',
        attemptedWorkarounds: []
      }
    };

    const result = await dispatchHighSeverityIncident(p3Incident);
    expect(result.dispatched).toBe(false);
    expect(result.reason).toContain('does not meet escalation threshold');
  });

  it('triggers dry-run dispatch for P1 critical incidents when webhook url is unset', async () => {
    const p1Incident: IncidentPayload = {
      title: 'Complete SSO auth outage',
      summary: 'Users unable to authenticate across the org',
      category: 'Identity / SSO',
      urgency: 1,
      impact: 1,
      priority: 'P1',
      status: 'open',
      readinessScore: 100,
      reporter: {
        fullName: 'Admin User',
        email: 'admin@corp.internal'
      },
      technicalContext: {
        operatingSystem: 'Linux',
        networkType: 'Direct',
        errorCode: 'IDP_UNAVAILABLE',
        affectedApp: 'Okta SSO',
        attemptedWorkarounds: []
      }
    };

    const result = await dispatchHighSeverityIncident(p1Incident);
    expect(result.dispatched).toBe(true);
    expect(result.destination).toBe('dry-run-logger');
  });
});
