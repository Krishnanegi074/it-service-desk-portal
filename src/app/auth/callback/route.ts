import { NextRequest, NextResponse } from 'next/server';
import { sanitizeNextPath } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get('next'), '/report');
  const code = request.nextUrl.searchParams.get('code');

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL('/login?error=invalid_callback', request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL('/login?error=invalid_callback', request.url));
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
