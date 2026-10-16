import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { updateUserDisplayName } from '@/lib/db';
import { normalizeDisplayName } from '@/lib/display-name';

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Send your name as JSON.' }, { status: 400 });
  }
  const fullName = normalizeDisplayName((body as { fullName?: unknown })?.fullName);
  if (!fullName) {
    return NextResponse.json(
      { success: false, error: 'Enter your name using 2 to 80 characters, without an email address.' },
      { status: 400 }
    );
  }
  if (auth.principal.demo) {
    return NextResponse.json({ success: true, data: { fullName } });
  }
  try {
    const updated = await updateUserDisplayName(auth.principal.id, fullName);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Your profile could not be found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { fullName } });
  } catch {
    return NextResponse.json({ success: false, error: 'Your name could not be saved. Try again in a moment.' }, { status: 500 });
  }
}
