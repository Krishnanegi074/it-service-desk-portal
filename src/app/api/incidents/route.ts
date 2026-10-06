import { NextResponse } from 'next/server';
import { IncidentPayloadSchema } from '@/lib/schema';
import { evaluateITILPriority, Urgency, Impact } from '@/lib/priority';
import { insertIncident, listIncidents } from '@/lib/db';
import { sanitizeIncidentPayload } from '@/lib/sanitizer';
import { dispatchHighSeverityIncident } from '@/lib/dispatcher';

export async function GET() {
  try {
    const incidents = await listIncidents();
    return NextResponse.json({ success: true, data: incidents });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    // 1. Sanitize incoming text fields to remove PII and secrets
    const sanitizedBody = sanitizeIncidentPayload(rawBody);

    // 2. Enforce ITIL Priority calculation deterministically
    const urgency = Number(sanitizedBody.urgency) as Urgency;
    const impact = Number(sanitizedBody.impact) as Impact;
    const { priority } = evaluateITILPriority(urgency, impact);

    // 3. Validate against strict Zod schema
    const parsed = IncidentPayloadSchema.parse({
      ...sanitizedBody,
      priority,
      readinessScore: Number(sanitizedBody.readinessScore) || 90.0
    });

    // 4. Persist sanitized payload to storage
    const saved = await insertIncident(parsed);

    // 5. Trigger outbound escalation if P1 or P2
    const dispatchStatus = await dispatchHighSeverityIncident(saved);

    return NextResponse.json(
      { success: true, data: saved, escalation: dispatchStatus },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
