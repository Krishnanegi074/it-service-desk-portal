import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiStaff } from '@/lib/api-auth';
import { assignIncident, listAssignableStaff } from '@/lib/db';
import { IncidentAssignmentSchema, type AppUserSummary } from '@/lib/schema';

const IncidentIdSchema = z.string().uuid();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const parsedId = IncidentIdSchema.safeParse(id);
    const body = IncidentAssignmentSchema.safeParse(await request.json().catch(() => null));
    if (!parsedId.success || !body.success) {
      return NextResponse.json({ success: false, error: 'Invalid assignment request' }, { status: 400 });
    }

    let assignee: AppUserSummary | null = null;
    if (body.data.assigneeId) {
      if (auth.principal.demo && body.data.assigneeId === auth.principal.id) {
        assignee = {
          id: auth.principal.id,
          email: auth.principal.email,
          fullName: auth.principal.fullName,
          role: auth.principal.role === 'admin' ? 'admin' : 'engineer'
        };
      } else {
        assignee = (await listAssignableStaff()).find(
          member => member.id === body.data.assigneeId
        ) ?? null;
        if (!assignee) {
          return NextResponse.json({ success: false, error: 'Assignee not found' }, { status: 404 });
        }
      }
    }

    const incident = await assignIncident(
      parsedId.data,
      assignee,
      auth.principal.demo ? undefined : auth.principal.id
    );
    if (!incident) {
      return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: incident });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to assign incident.' },
      { status: 500 }
    );
  }
}
