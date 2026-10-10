import { describe, expect, it } from 'vitest';
import { canViewIncident, sanitizeNextPath, type AuthPrincipal } from '../../src/lib/auth';
import type { IncidentPayload } from '../../src/lib/schema';

const employee: AuthPrincipal = {
  id: crypto.randomUUID(),
  email: 'employee@example.com',
  fullName: 'Employee User',
  role: 'employee',
  demo: false
};

const incident = {
  reporter: { email: 'employee@example.com', fullName: 'Employee User' }
} as IncidentPayload;

describe('Authorization helpers', () => {
  it('allows reporters and staff to view an incident', () => {
    expect(canViewIncident(employee, incident)).toBe(true);
    expect(canViewIncident({ ...employee, email: 'other@example.com' }, incident)).toBe(false);
    expect(canViewIncident({ ...employee, email: 'other@example.com', role: 'engineer' }, incident)).toBe(true);
  });

  it('prevents external redirect targets', () => {
    expect(sanitizeNextPath('/console')).toBe('/console');
    expect(sanitizeNextPath('//evil.example')).toBe('/');
    expect(sanitizeNextPath('/\\evil.example')).toBe('/');
    expect(sanitizeNextPath('https://evil.example')).toBe('/');
  });
});
