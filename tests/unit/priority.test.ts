import { describe, it, expect } from 'vitest';
import { evaluateITILPriority } from '../../src/lib/priority';

describe('Deterministic ITIL Priority Engine', () => {
  it('assigns P1 for maximum urgency and maximum impact (Critical outage)', () => {
    const res = evaluateITILPriority(1, 1);
    expect(res.priority).toBe('P1');
  });

  it('assigns P4 for minimal urgency and individual impact', () => {
    const res = evaluateITILPriority(4, 4);
    expect(res.priority).toBe('P4');
  });

  it('assigns P2 for high urgency with moderate group impact', () => {
    const res = evaluateITILPriority(1, 3);
    expect(res.priority).toBe('P2');
  });
});
