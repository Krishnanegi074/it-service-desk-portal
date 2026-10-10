import type { IncidentPayload } from './schema';
import { isSupabaseConfigured } from './supabase/config';
import { createSupabaseServerClient } from './supabase/server';

export type AppRole = 'employee' | 'engineer' | 'admin';

export interface AuthPrincipal {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  demo: boolean;
}

function getDemoPrincipal(): AuthPrincipal {
  const configuredRole = process.env.AUTH_DEMO_ROLE;
  const role: AppRole = configuredRole === 'admin' ? 'admin' : 'engineer';
  return {
    id: '00000000-0000-4000-8000-000000000001',
    email: `demo.${role}@example.com`,
    fullName: role === 'admin' ? 'Demo Administrator' : 'Demo Engineer',
    role,
    demo: true
  };
}

export function isDemoAuthEnabled() {
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.NODE_ENV === 'test') return process.env.AUTH_DEMO_MODE !== 'false';
  return process.env.AUTH_DEMO_MODE === 'true';
}

export function isStaff(principal: AuthPrincipal) {
  return principal.role === 'engineer' || principal.role === 'admin';
}

export function canViewIncident(principal: AuthPrincipal, incident: IncidentPayload) {
  return isStaff(principal) || incident.reporter.email.toLowerCase() === principal.email.toLowerCase();
}

export function sanitizeNextPath(value: string | null | undefined, fallback = '/') {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) return fallback;
  return value;
}

export async function getCurrentPrincipal(): Promise<AuthPrincipal | null> {
  if (isDemoAuthEnabled()) return getDemoPrincipal();
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const claims = claimsData?.claims;

    if (claimsError || !claims?.sub || typeof claims.email !== 'string') return null;

    const { data: profile, error: profileError } = await supabase
      .from('app_users')
      .select('id, email, full_name, role')
      .eq('id', claims.sub)
      .maybeSingle();

    if (profileError || !profile) return null;
    if (!['employee', 'engineer', 'admin'].includes(profile.role)) return null;

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role as AppRole,
      demo: false
    };
  } catch {
    return null;
  }
}
