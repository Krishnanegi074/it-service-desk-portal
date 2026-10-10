import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAdmin } from '@/lib/api-auth';
import { previewIncidentRetention, purgeExpiredIncidents } from '@/lib/db';
import {
  calculateRetentionCutoff,
  getIncidentRetentionDays,
  RETENTION_CONFIRMATION
} from '@/lib/retention';

const PurgeRequestSchema = z.object({
  confirmation: z.literal(RETENTION_CONFIRMATION)
});

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  try {
    const retentionDays = getIncidentRetentionDays();
    const preview = await previewIncidentRetention(calculateRetentionCutoff(retentionDays));
    return NextResponse.json({
      success: true,
      data: { ...preview, retentionDays, confirmationPhrase: RETENTION_CONFIRMATION }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to preview retention.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const parsed = PurgeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: `Type ${RETENTION_CONFIRMATION} to authorize the purge.` },
        { status: 400 }
      );
    }

    const retentionDays = getIncidentRetentionDays();
    const result = await purgeExpiredIncidents(
      calculateRetentionCutoff(retentionDays),
      retentionDays,
      auth.principal.demo ? undefined : auth.principal.id
    );
    return NextResponse.json({ success: true, data: { ...result, retentionDays } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to purge incidents.' },
      { status: 500 }
    );
  }
}
