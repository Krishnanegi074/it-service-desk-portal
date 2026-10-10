import { NextResponse } from 'next/server';
import { getCurrentPrincipal, isStaff, type AuthPrincipal } from './auth';

type AuthResult =
  | { principal: AuthPrincipal; response?: never }
  | { principal?: never; response: NextResponse };

export async function requireApiUser(): Promise<AuthResult> {
  const principal = await getCurrentPrincipal();
  if (!principal) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    };
  }
  return { principal };
}

export async function requireApiStaff(): Promise<AuthResult> {
  const result = await requireApiUser();
  if (result.response) return result;
  if (!isStaff(result.principal)) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Engineer or administrator access required' },
        { status: 403 }
      )
    };
  }
  return result;
}

export async function requireApiAdmin(): Promise<AuthResult> {
  const result = await requireApiUser();
  if (result.response) return result;
  if (result.principal.role !== 'admin') {
    return {
      response: NextResponse.json(
        { success: false, error: 'Administrator access required' },
        { status: 403 }
      )
    };
  }
  return result;
}
