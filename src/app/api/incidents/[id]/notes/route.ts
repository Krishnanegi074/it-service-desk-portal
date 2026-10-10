import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiStaff } from '@/lib/api-auth';
import { addIncidentNote } from '@/lib/db';
import { sanitizeText } from '@/lib/sanitizer';
import { IncidentNoteSchema } from '@/lib/schema';

const IncidentIdSchema = z.string().uuid();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const parsedId = IncidentIdSchema.safeParse(id);
    const body = IncidentNoteSchema.safeParse(await request.json().catch(() => null));
    if (!parsedId.success || !body.success) {
      return NextResponse.json({ success: false, error: 'Note must contain 2-2000 characters.' }, { status: 400 });
    }

    const event = await addIncidentNote(parsedId.data, sanitizeText(body.data.note), {
      id: auth.principal.demo ? undefined : auth.principal.id,
      fullName: auth.principal.fullName,
      email: auth.principal.email
    });
    if (!event) {
      return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to add note.' },
      { status: 500 }
    );
  }
}
