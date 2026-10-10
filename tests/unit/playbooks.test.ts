import { describe, it, expect } from 'vitest';
import { createInitialSlots, getNextMissingQuestion, PLAYBOOKS } from '../../src/lib/playbooks';

describe('Diagnostic Playbook Engine', () => {
  it('asks for operating system first if no slots collected for VPN', () => {
    const nextQ = getNextMissingQuestion('vpn', {});
    expect(nextQ).toContain('operating system');
  });

  it('skips operating system and asks for network if OS is already provided', () => {
    const nextQ = getNextMissingQuestion('vpn', { operatingSystem: 'macOS' });
    expect(nextQ).toContain('home Wi-Fi');
  });

  it('returns null when all required slots are collected', () => {
    const nextQ = getNextMissingQuestion('vpn', {
      operatingSystem: 'macOS',
      networkType: 'Home Wi-Fi',
      errorCode: 'Certificate untrusted'
    });
    expect(nextQ).toBeNull();
  });

  it('provides the five MVP diagnostic playbooks', () => {
    expect(Object.keys(PLAYBOOKS)).toEqual(['vpn', 'email', 'sso', 'application', 'hardware']);
  });

  it('preselects an operating system only when a playbook asks for it', () => {
    expect(createInitialSlots('hardware').operatingSystem).toBe('macOS');
    expect(createInitialSlots('sso')).toEqual({ affectedApp: '', errorCode: '' });
  });
});
