import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/api-auth';
import { getPilotMetrics } from '@/lib/db';

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  try {
    return NextResponse.json({ success: true, data: await getPilotMetrics() });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to load pilot metrics.' },
      { status: 500 }
    );
  }
}
