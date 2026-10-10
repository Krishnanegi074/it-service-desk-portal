import { describe, it, expect } from 'vitest';
import { IncidentPayloadSchema, IncidentStatusSchema } from '../../src/lib/schema';
import { evaluateITILPriority } from '../../src/lib/priority';

describe('Incident Ingestion Contract', () => {
  it('validates a complete VPN diagnostic incident payload', () => {
    const urgency = 2;
    const impact = 2;
    const { priority } = evaluateITILPriority(urgency, impact);

    const testPayload = {
      title: 'VPN Certificate Validation Failure',
      summary: 'Cannot connect to Cisco AnyConnect gateway from home network.',
      category: 'Network / VPN',
      urgency,
      impact,
      priority,
      status: 'open' as const,
      readinessScore: 95,
      reporter: {
        email: 'krishna@company.com',
        fullName: 'Krishna Negi',
        department: 'Engineering'
      },
      technicalContext: {
        operatingSystem: 'macOS' as const,
        networkType: 'Home Wi-Fi',
        errorCode: 'Certificate untrusted',
        affectedApp: 'Cisco AnyConnect',
        attemptedWorkarounds: ['Reinstalled cert profile']
      }
    };

    const validated = IncidentPayloadSchema.safeParse(testPayload);
    expect(validated.success).toBe(true);
    if (validated.success) {
      expect(validated.data.priority).toBe('P2');
      expect(validated.data.technicalContext.operatingSystem).toBe('macOS');
    }
  });

  it('rejects an invalid incident payload missing mandatory technical context', () => {
    const invalidPayload = {
      title: 'Broken',
      summary: 'Short',
      urgency: 1,
      impact: 1,
      priority: 'P1'
    };

    const validated = IncidentPayloadSchema.safeParse(invalidPayload);
    expect(validated.success).toBe(false);
  });

  it('uses one canonical incident status contract', () => {
    expect(IncidentStatusSchema.safeParse('in_triage').success).toBe(true);
    expect(IncidentStatusSchema.safeParse('dispatched').success).toBe(true);
    expect(IncidentStatusSchema.safeParse('in-progress').success).toBe(false);
    expect(IncidentStatusSchema.safeParse('escalated').success).toBe(false);
  });
});
