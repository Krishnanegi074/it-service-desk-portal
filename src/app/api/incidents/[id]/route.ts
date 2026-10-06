import { NextResponse } from 'next/server';
import { listIncidents } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!['open', 'in-progress', 'resolved', 'escalated'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const incidents = await listIncidents();
    const target = incidents.find(i => i.id === id);

    if (!target) {
      return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 });
    }

    target.status = status;
    return NextResponse.json({ success: true, data: target });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
