import { describe, expect, it } from 'vitest';
import { isPlaceholderName, normalizeDisplayName } from '../../src/lib/display-name';

describe('display names', () => {
  it('cleans spacing and rejects unusable names', () => {
    expect(normalizeDisplayName('  Krishna   Negi ')).toBe('Krishna Negi');
    expect(normalizeDisplayName('K')).toBeNull();
    expect(normalizeDisplayName('me@example.com')).toBeNull();
    expect(normalizeDisplayName('<b>Krishna</b>')).toBe('bKrishna/b');
    expect(normalizeDisplayName(42)).toBeNull();
  });

  it('spots the automatic name made from the email address', () => {
    expect(isPlaceholderName('krishnanegi074+admin', 'krishnanegi074+admin@gmail.com')).toBe(true);
    expect(isPlaceholderName('Krishna Negi', 'krishnanegi074+admin@gmail.com')).toBe(false);
  });
});
