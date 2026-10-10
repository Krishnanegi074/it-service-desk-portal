import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getIncidentById, listIncidentEvents } from '@/lib/db';
import { requireApiUser } from '@/lib/api-auth';
import { canViewIncident, isStaff } from '@/lib/auth';

const IncidentIdSchema = z.string().uuid();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const { id } = await params;
    const parsedId = IncidentIdSchema.safeParse(id);

    if (!parsedId.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid incident ID' },
        { status: 400 }
      );
    }

    const incident = await getIncidentById(parsedId.data);
    if (!incident || !canViewIncident(auth.principal, incident)) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      );
    }

    const events = await listIncidentEvents(parsedId.data);
    const visibleEvents = isStaff(auth.principal)
      ? events
      : events.filter(event => event.eventType !== 'note_added');
    return NextResponse.json({ success: true, data: visibleEvents });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
