import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiStaff } from '@/lib/api-auth';
import { getIncidentById, getIncidentDelivery, recordIncidentDelivery } from '@/lib/db';
import { getTicketingAdapter } from '@/lib/ticketing';

const IncidentIdSchema = z.string().uuid();

async function getAuthorizedIncident(id: string) {
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
  const incident = await getAuthorizedIncident(id);
  if (!incident) return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: await getIncidentDelivery(id) });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiStaff();
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const incident = await getAuthorizedIncident(id);
    if (!incident) return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 });
    const existingDelivery = await getIncidentDelivery(id);
    if (existingDelivery?.status === 'delivered') {
      return NextResponse.json(
        { success: false, error: 'This incident has already been delivered to Jira.' },
        { status: 409 }
      );
    }

    const adapter = getTicketingAdapter();
    const ticketingResult = await adapter.createIncident(incident);
    const delivery = await recordIncidentDelivery(
      id,
      adapter.provider,
      {
        status: ticketingResult.status,
        externalId: ticketingResult.externalId,
        externalUrl: ticketingResult.externalUrl,
        error: ticketingResult.error
      },
      auth.principal.demo ? undefined : auth.principal.id
    );
    return NextResponse.json({ success: true, data: delivery, ticketing: ticketingResult });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to retry delivery.' },
      { status: 500 }
    );
  }
}
