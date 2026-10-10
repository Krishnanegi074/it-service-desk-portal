import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { completeIntakeSession, startIntakeSession } from '@/lib/db';
import { IntakeSessionActionSchema } from '@/lib/schema';

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  try {
    const parsed = IntakeSessionActionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid intake session event.' }, { status: 400 });
    }
    if (parsed.data.action === 'start') {
      await startIntakeSession(parsed.data.sessionId);
    } else {
      await completeIntakeSession(parsed.data.sessionId, parsed.data.incidentId);
    }
    return NextResponse.json({ success: true }, { status: parsed.data.action === 'start' ? 201 : 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to record intake session.' },
      { status: 500 }
    );
  }
}
