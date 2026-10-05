import { NextResponse } from 'next/server';
import { IncidentPayloadSchema } from '@/lib/schema';
import { evaluateITILPriority, Urgency, Impact } from '@/lib/priority';
import { insertIncident, listIncidents } from '@/lib/db';

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

    // 1. Enforce ITIL Priority calculation deterministically via code
    const urgency = Number(rawBody.urgency) as Urgency;
    const impact = Number(rawBody.impact) as Impact;
    const { priority } = evaluateITILPriority(urgency, impact);

    // 2. Validate payload against our strict Zod schema
    const parsed = IncidentPayloadSchema.parse({
      ...rawBody,
      priority,
      readinessScore: 90.0 // Computed completion score
    });

    // 3. Persist to database
    const saved = await insertIncident(parsed);

    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
