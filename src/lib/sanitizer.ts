interface RedactionPattern {
  pattern: RegExp;
  replacement: string;
}

const PATTERNS: RedactionPattern[] = [
  {
    pattern: /-----BEGIN(?: [A-Z0-9]+)* PRIVATE KEY-----[\s\S]*?-----END(?: [A-Z0-9]+)* PRIVATE KEY-----/gi,
    replacement: '[REDACTED_PRIVATE_KEY]'
  },
  {
    pattern: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s]+/gi,
    replacement: '[REDACTED_CONNECTION_STRING]'
  },
  {
    pattern: /https?:\/\/[^\s/:@]+:[^\s/@]+@[^\s]+/gi,
    replacement: '[REDACTED_CREDENTIAL_URL]'
  },
  {
    pattern: /\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
    replacement: '[REDACTED_AWS_KEY]'
  },
  {
    pattern: /\b(?:github_pat_[A-Za-z0-9_]{20,255}|gh[pousr]_[A-Za-z0-9]{20,255}|glpat-[A-Za-z0-9_-]{20,255})\b/g,
    replacement: '[REDACTED_SOURCE_CONTROL_TOKEN]'
  },
  {
    pattern: /\b(?:xox[baprs]-[A-Za-z0-9-]{10,255}|sk_live_[A-Za-z0-9]{16,255}|rk_live_[A-Za-z0-9]{16,255}|npm_[A-Za-z0-9]{20,255}|pypi-[A-Za-z0-9_-]{20,255})\b/g,
    replacement: '[REDACTED_SERVICE_TOKEN]'
  },
  {
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    replacement: '[REDACTED_GOOGLE_API_KEY]'
  },
  {
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi,
    replacement: 'Bearer [REDACTED_TOKEN]'
  },
  {
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    replacement: '[REDACTED_JWT]'
  },
  {
    pattern: /\b(password|passwd|pwd|secret|api[_-]?key|token|access[_-]?token|refresh[_-]?token|client[_-]?secret|private[_-]?key|authorization)\b(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&]+)/gi,
    replacement: '$1$2[REDACTED_SECRET]'
  }
];

export function sanitizeText(input: string): string {
  return PATTERNS.reduce(
    (sanitized, { pattern, replacement }) => sanitized.replace(pattern, replacement),
    input
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') return sanitizeText(value);
  if (depth > 12) return value;
  if (Array.isArray(value)) return value.map(item => sanitizeValue(item, depth + 1));
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, sanitizeValue(child, depth + 1)])
  );
}

export function sanitizeIncidentPayload(data: unknown): Record<string, unknown> {
  if (!isRecord(data)) return {};
  return sanitizeValue(data) as Record<string, unknown>;
}
