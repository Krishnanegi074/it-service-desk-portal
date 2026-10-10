import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiStaff } from '@/lib/api-auth';
import { getIncidentById, getPilotFeedback, upsertPilotFeedback } from '@/lib/db';
import { PilotFeedbackInputSchema } from '@/lib/schema';

const IncidentIdSchema = z.string().uuid();

async function parseExistingIncident(id: string) {
  const parsed = IncidentIdSchema.safeParse(id);
  if (!parsed.success) return null;
  return getIncidentById(parsed.data);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff();
  if (auth.response) return auth.response;
  const { id } = await params;
  const incident = await parseExistingIncident(id);
  if (!incident?.id) {
    return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: await getPilotFeedback(incident.id) });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const incident = await parseExistingIncident(id);
    if (!incident?.id) {
      return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 });
    }
    const parsed = PilotFeedbackInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Routing accuracy and a clarification count from 0 to 20 are required.' },
        { status: 400 }
      );
    }
    const feedback = await upsertPilotFeedback(
      incident.id,
      parsed.data,
      auth.principal.demo ? undefined : auth.principal.id
    );
    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to save pilot feedback.' },
      { status: 500 }
    );
  }
}
