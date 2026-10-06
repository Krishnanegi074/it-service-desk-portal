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

  it('sanitizes full incident payload technical context and summaries', () => {
    const payload = {
      title: 'VPN issue with AKIAIOSFODNN7EXAMPLE key',
      summary: 'Secret token used: password=SuperSecretPassword123!',
      category: 'Network / VPN',
      technicalContext: {
        errorCode: 'Auth fail with Bearer abc.def.ghi'
      }
    };

    const sanitized = sanitizeIncidentPayload(payload);
    expect(sanitized.title).toContain('[REDACTED_AWS_KEY]');
    expect(sanitized.summary).toContain('[REDACTED_SECRET]');
    expect(sanitized.technicalContext.errorCode).toContain('[REDACTED_TOKEN]');
  });
});
