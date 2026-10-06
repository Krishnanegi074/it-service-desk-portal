import { IncidentPayload } from '@/lib/schema';

export interface DispatchResult {
  dispatched: boolean;
  destination?: string;
  reason?: string;
  statusCode?: number;
}

export async function dispatchHighSeverityIncident(
  incident: IncidentPayload
): Promise<DispatchResult> {
  // Only auto-dispatch critical/high incidents (P1 or P2)
  if (incident.priority !== 'P1' && incident.priority !== 'P2') {
    return {
      dispatched: false,
      reason: `Priority ${incident.priority} does not meet escalation threshold (P1/P2)`
    };
  }

  const webhookUrl = process.env.OUTBOUND_WEBHOOK_URL;

  // In test or local dev without webhook configured, execute a simulated dry-run
  if (!webhookUrl) {
    return {
      dispatched: true,
      destination: 'dry-run-logger',
      reason: `Simulated dispatch for ${incident.priority} incident to internal escalation bus`
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'INCIDENT_ESCALATION',
        priority: incident.priority,
        incidentId: incident.id,
        title: incident.title,
        summary: incident.summary,
        category: incident.category,
        readinessScore: incident.readinessScore,
        technicalContext: incident.technicalContext,
        timestamp: new Date().toISOString()
      })
    });

    return {
      dispatched: res.ok,
      destination: webhookUrl,
      statusCode: res.status
    };
  } catch (error) {
    return {
      dispatched: false,
      destination: webhookUrl,
      reason: (error as Error).message
    };
  }
}
