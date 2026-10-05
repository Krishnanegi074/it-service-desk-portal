import { describe, it, expect } from 'vitest';
import { getNextMissingQuestion } from '../../src/lib/playbooks';

describe('Diagnostic Playbook Engine', () => {
  it('asks for operating system first if no slots collected for VPN', () => {
    const nextQ = getNextMissingQuestion('vpn', {});
    expect(nextQ).toContain('operating system');
  });

  it('skips operating system and asks for network if OS is already provided', () => {
    const nextQ = getNextMissingQuestion('vpn', { operatingSystem: 'macOS' });
    expect(nextQ).toContain('Home Wi-Fi, Office Ethernet');
  });

  it('returns null when all required slots are collected', () => {
    const nextQ = getNextMissingQuestion('vpn', {
      operatingSystem: 'macOS',
      networkType: 'Home Wi-Fi',
      errorCode: 'Certificate untrusted'
    });
    expect(nextQ).toBeNull();
  });
});
