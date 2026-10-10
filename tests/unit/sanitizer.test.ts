import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeIncidentPayload } from '../../src/lib/sanitizer';

describe('PII & Secret Sanitizer', () => {
  it('redacts standard AWS Access Keys', () => {
    const raw = 'Failed uploading state: AKIAIOSFODNN7EXAMPLE was rejected';
    const clean = sanitizeText(raw);
    expect(clean).toContain('[REDACTED_AWS_KEY]');
    expect(clean).not.toContain('AKIAIOSFODNN7EXAMPLE');
  });

  it('redacts Bearer JWT tokens', () => {
    const raw = 'Auth header present: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ae9oZH';
    const clean = sanitizeText(raw);
    expect(clean).toContain('Bearer [REDACTED_TOKEN]');
    expect(clean).not.toContain('eyJhbGciOi');
  });

  it('redacts private keys, connection strings, and service tokens', () => {
    const raw = [
      'postgresql://admin:SuperSecret@db.example.com:5432/portal',
      'github_pat_11AA22BB33CC44DD55EE66FF77GG88HH',
      '-----BEGIN PRIVATE KEY-----\nvery-secret-material\n-----END PRIVATE KEY-----'
    ].join('\n');
    const clean = sanitizeText(raw);

    expect(clean).toContain('[REDACTED_CONNECTION_STRING]');
    expect(clean).toContain('[REDACTED_SOURCE_CONTROL_TOKEN]');
    expect(clean).toContain('[REDACTED_PRIVATE_KEY]');
    expect(clean).not.toContain('SuperSecret');
    expect(clean).not.toContain('very-secret-material');
  });

  it('sanitizes full incident payload technical context and summaries', () => {
    const payload = {
      title: 'VPN issue with AKIAIOSFODNN7EXAMPLE key',
      summary: 'Secret token used: password=SuperSecretPassword123!',
      category: 'Network / VPN',
      technicalContext: {
        errorCode: 'Auth fail with Bearer abc.def.ghi',
        attemptedWorkarounds: ['Used token=workaround-secret']
      }
    };

    const sanitized = sanitizeIncidentPayload(payload);
    const technicalContext = sanitized.technicalContext as {
      errorCode: string;
      attemptedWorkarounds: string[];
    };
    expect(sanitized.title).toContain('[REDACTED_AWS_KEY]');
    expect(sanitized.summary).toContain('[REDACTED_SECRET]');
    expect(technicalContext.errorCode).toContain('[REDACTED_TOKEN]');
    expect(technicalContext.attemptedWorkarounds[0]).toContain('[REDACTED_SECRET]');
  });

  it('rejects non-object payloads without throwing', () => {
    expect(sanitizeIncidentPayload('not-an-incident')).toEqual({});
    expect(sanitizeIncidentPayload(null)).toEqual({});
  });
});
