export type AppEnvironment = 'development' | 'test' | 'staging' | 'production';

type EnvironmentSource = Record<string, string | undefined>;

const JIRA_VARIABLES = [
  'JIRA_BASE_URL',
  'JIRA_EMAIL',
  'JIRA_API_TOKEN',
  'JIRA_SERVICE_DESK_ID',
  'JIRA_REQUEST_TYPE_ID',
  'JIRA_WEBHOOK_SECRET'
] as const;

function validHttpsUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function resolveAppEnvironment(source: EnvironmentSource = process.env): AppEnvironment {
  const explicit = source.APP_ENV;
  if (explicit === 'development' || explicit === 'test' || explicit === 'staging' || explicit === 'production') {
    return explicit;
  }
  if (source.VERCEL_ENV === 'preview') return 'staging';
  if (source.VERCEL_ENV === 'production') return 'production';
  if (source.NODE_ENV === 'test') return 'test';
  return source.NODE_ENV === 'production' ? 'production' : 'development';
}

export function inspectEnvironment(source: EnvironmentSource = process.env) {
  const environment = resolveAppEnvironment(source);
  const errors: string[] = [];
  const warnings: string[] = [];
  const strict = environment === 'staging' || environment === 'production';
  const jiraConfiguredCount = JIRA_VARIABLES.filter(key => Boolean(source[key])).length;

  if (source.APP_ENV && !['development', 'test', 'staging', 'production'].includes(source.APP_ENV)) {
    errors.push('APP_ENV must be development, test, staging, or production.');
  }
  if (strict && !source.DATABASE_URL) errors.push('DATABASE_URL is required outside local/test environments.');
  if (strict && (!source.NEXT_PUBLIC_SUPABASE_URL || !source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
    errors.push('Supabase URL and publishable key are required outside local/test environments.');
  }
  if (strict && jiraConfiguredCount !== JIRA_VARIABLES.length) {
    errors.push('All Jira delivery and webhook variables are required outside local/test environments.');
  } else if (!strict && jiraConfiguredCount > 0 && jiraConfiguredCount !== JIRA_VARIABLES.length) {
    warnings.push('Jira configuration is incomplete; deliveries will remain pending or fail validation.');
  }
  if (source.JIRA_BASE_URL && !validHttpsUrl(source.JIRA_BASE_URL)) {
    errors.push('JIRA_BASE_URL must be a valid HTTPS URL.');
  }
  if (source.ERROR_REPORTING_ENDPOINT && !validHttpsUrl(source.ERROR_REPORTING_ENDPOINT)) {
    errors.push('ERROR_REPORTING_ENDPOINT must be a valid HTTPS URL.');
  }
  if (strict && !source.ERROR_REPORTING_ENDPOINT) {
    warnings.push('No external error reporting endpoint is configured; errors will only use platform logs.');
  }
  if (strict && source.AUTH_DEMO_MODE === 'true') {
    warnings.push('AUTH_DEMO_MODE is ignored in production builds and should be removed from deployed secrets.');
  }

  return {
    environment,
    version: source.APP_VERSION || source.VERCEL_GIT_COMMIT_SHA || 'development',
    ready: errors.length === 0,
    errors,
    warnings,
    services: {
      database: Boolean(source.DATABASE_URL),
      authentication: Boolean(source.NEXT_PUBLIC_SUPABASE_URL && source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      jira: jiraConfiguredCount === JIRA_VARIABLES.length,
      escalationWebhook: Boolean(source.OUTBOUND_WEBHOOK_URL),
      errorReporting: Boolean(source.ERROR_REPORTING_ENDPOINT)
    }
  };
}
