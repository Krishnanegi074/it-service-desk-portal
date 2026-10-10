import { NextRequest, NextResponse } from 'next/server';
import { IncidentPaginationSchema, IncidentPayloadSchema } from '@/lib/schema';
import { evaluateITILPriority, Urgency, Impact } from '@/lib/priority';
import {
  getIncidentDelivery,
  insertIncident,
  listIncidents,
  recordIncidentDelivery
} from '@/lib/db';
import { sanitizeIncidentPayload } from '@/lib/sanitizer';
import { dispatchHighSeverityIncident } from '@/lib/dispatcher';
import { requireApiStaff, requireApiUser } from '@/lib/api-auth';
import { consumeRateLimit } from '@/lib/rate-limit';
import { getTicketingAdapter } from '@/lib/ticketing';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiStaff();
    if (auth.response) return auth.response;

    const pagination = IncidentPaginationSchema.safeParse({
      page: req.nextUrl.searchParams.get('page') ?? undefined,
      limit: req.nextUrl.searchParams.get('limit') ?? undefined,
      q: req.nextUrl.searchParams.get('q') ?? undefined,
      status: req.nextUrl.searchParams.get('status') || undefined,
      priority: req.nextUrl.searchParams.get('priority') || undefined,
      assigneeId: req.nextUrl.searchParams.get('assigneeId') || undefined
    });

    if (!pagination.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const result = await listIncidents(pagination.data);
    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const rateLimit = consumeRateLimit(`incident-create:${auth.principal.id}`, {
      limit: 10,
      windowMs: 10 * 60 * 1000
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many incident submissions. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) }
        }
      );
    }

    const rawBody = await req.json();
    const idempotencyKey = req.headers.get('Idempotency-Key')?.trim();

    if (idempotencyKey && idempotencyKey.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Idempotency-Key must be 255 characters or fewer' },
        { status: 400 }
      );
    }

    // 1. Sanitize incoming text fields to remove PII and secrets
    const sanitizedBody = sanitizeIncidentPayload(rawBody);

    // 2. Enforce ITIL Priority calculation deterministically
    const urgency = Number(sanitizedBody.urgency) as Urgency;
    const impact = Number(sanitizedBody.impact) as Impact;
    const { priority } = evaluateITILPriority(urgency, impact);
    const readinessScore = Number(sanitizedBody.readinessScore);
    const sanitizedReporter =
      typeof sanitizedBody.reporter === 'object' && sanitizedBody.reporter !== null
        ? sanitizedBody.reporter
        : {};

    // 3. Validate against strict Zod schema
    const parsed = IncidentPayloadSchema.parse({
      ...sanitizedBody,
      reporter: {
        ...sanitizedReporter,
        email: auth.principal.email,
        fullName: auth.principal.fullName
      },
      priority,
      readinessScore: Number.isFinite(readinessScore) ? readinessScore : 0
    });

    // 4. Persist sanitized payload to storage
    const { incident: saved, created } = await insertIncident(parsed, {
      idempotencyKey,
      reporterId: auth.principal.demo ? undefined : auth.principal.id
    });

    // 5. Trigger outbound escalation if P1 or P2
    const dispatchStatus = created
      ? await dispatchHighSeverityIncident(saved)
      : {
          dispatched: false,
          reason: 'Duplicate request returned the previously created incident'
        };

    // 6. Create exactly one Jira request for a newly persisted incident. Replayed
    // idempotent requests return the delivery already associated with the incident.
    const adapter = getTicketingAdapter();
    let delivery = await getIncidentDelivery(saved.id!);
    if (created) {
      const ticketingResult = await adapter.createIncident(saved);
      delivery = await recordIncidentDelivery(saved.id!, adapter.provider, {
        status: ticketingResult.status,
        externalId: ticketingResult.externalId,
        externalUrl: ticketingResult.externalUrl,
        error: ticketingResult.error
      });
    }

    return NextResponse.json(
      { success: true, data: saved, duplicate: !created, escalation: dispatchStatus, delivery },
      { status: created ? 201 : 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
