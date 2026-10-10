import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getIncidentById, updateIncidentStatus } from '@/lib/db';
import { IncidentStatusSchema } from '@/lib/schema';
import { canViewIncident } from '@/lib/auth';
import { requireApiStaff, requireApiUser } from '@/lib/api-auth';

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
      return NextResponse.json({ success: false, error: 'Invalid incident ID' }, { status: 400 });
    }

    const incident = await getIncidentById(parsedId.data);
    if (!incident) {
      return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 });
    }
    if (!canViewIncident(auth.principal, incident)) {
      return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: incident });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiStaff();
    if (auth.response) return auth.response;

    const { id } = await params;
    const parsedId = IncidentIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ success: false, error: 'Invalid incident ID' }, { status: 400 });
    }
    const body: unknown = await req.json();
    const statusResult = IncidentStatusSchema.safeParse(
      typeof body === 'object' && body !== null && 'status' in body
        ? body.status
        : undefined
    );

    if (!statusResult.success) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const target = await updateIncidentStatus(
      parsedId.data,
      statusResult.data,
      auth.principal.demo ? undefined : auth.principal.id
    );

    if (!target) {
      return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: target });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
