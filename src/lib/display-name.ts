/** Cleans a display name typed by a user. Returns null when it is not acceptable. */
export function normalizeDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 80) return null;
  if (name.includes('@')) return null;
  return name;
}

/** True when the name is still the automatic one made from the email address. */
export function isPlaceholderName(fullName: string, email: string): boolean {
  const local = email.split('@')[0] ?? '';
  return !fullName.trim() || fullName.trim().toLowerCase() === local.toLowerCase();
}
