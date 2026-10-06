const PATTERNS = [
  // AWS Access Key ID
  { pattern: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g, replacement: '[REDACTED_AWS_KEY]' },
  // Bearer / JWT Tokens
  { pattern: /Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*/gi, replacement: 'Bearer [REDACTED_TOKEN]' },
  // Password / Secret assignments (e.g. password=secret123 or api_key: "abc")
  { pattern: /(?:password|passwd|secret|api_key|token)\s*[:=]\s*["']?([^\s"',;]+)["']?/gi, replacement: '$1: [REDACTED_SECRET]' }
];

export function sanitizeText(input: string): string {
  if (!input) return input;
  let sanitized = input;
  for (const { pattern, replacement } of PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized;
}

export function sanitizeIncidentPayload<T extends Record<string, any>>(data: T): T {
  const cloned = JSON.parse(JSON.stringify(data));

  if (typeof cloned.title === 'string') {
    cloned.title = sanitizeText(cloned.title);
  }
  if (typeof cloned.summary === 'string') {
    cloned.summary = sanitizeText(cloned.summary);
  }
  if (cloned.technicalContext && typeof cloned.technicalContext.errorCode === 'string') {
    cloned.technicalContext.errorCode = sanitizeText(cloned.technicalContext.errorCode);
  }

  return cloned;
}
