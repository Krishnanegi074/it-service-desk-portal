import type { IncidentPayload } from '@/lib/schema';
import type { TicketingAdapter, TicketingDeliveryResult } from './types';

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  serviceDeskId: string;
  requestTypeId: string;
}

export function getJiraConfig(): JiraConfig | null {
  const baseUrl = process.env.JIRA_BASE_URL?.replace(/\/+$/, '');
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const serviceDeskId = process.env.JIRA_SERVICE_DESK_ID;
  const requestTypeId = process.env.JIRA_REQUEST_TYPE_ID;
  if (!baseUrl || !email || !apiToken || !serviceDeskId || !requestTypeId) return null;

  const parsedUrl = new URL(baseUrl);
  if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') {
    throw new Error('JIRA_BASE_URL must use HTTPS.');
  }
  return { baseUrl, email, apiToken, serviceDeskId, requestTypeId };
}

function buildDescription(incident: IncidentPayload) {
  const context = incident.technicalContext;
  return [
    `Priority: ${incident.priority}`,
    `Status: ${incident.status}`,
    `Reporter: ${incident.reporter.fullName} <${incident.reporter.email}>`,
    `Category: ${incident.category}`,
    `Diagnostic completeness: ${incident.readinessScore}%`,
    '',
    incident.summary,
    '',
    `Operating system: ${context.operatingSystem}`,
    `Network: ${context.networkType}`,
    `Application/device: ${context.affectedApp}`,
    `Error: ${context.errorCode || 'None reported'}`,
    `Attempted workarounds: ${context.attemptedWorkarounds.join(', ') || 'None reported'}`,
    '',
    `Source incident: ${incident.id}`
  ].join('\n');
}

export class JiraServiceManagementAdapter implements TicketingAdapter {
  readonly provider = 'jira';

  constructor(private readonly config: JiraConfig) {}

  async createIncident(incident: IncidentPayload): Promise<TicketingDeliveryResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/rest/servicedeskapi/request`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString('base64')}`
        },
        body: JSON.stringify({
          serviceDeskId: this.config.serviceDeskId,
          requestTypeId: this.config.requestTypeId,
          isAdfRequest: false,
          requestFieldValues: {
            summary: `[${incident.priority}] ${incident.title}`,
            description: buildDescription(incident)
          }
        })
      });
      const body: Record<string, unknown> = await response.json().catch(() => ({}));
      if (!response.ok) {
        const messages = Array.isArray(body.errorMessages) ? body.errorMessages.join('; ') : null;
        return {
          provider: this.provider,
          status: 'failed',
          statusCode: response.status,
          error: messages || String(body.errorMessage || `Jira returned HTTP ${response.status}`)
        };
      }

      const issueKey = typeof body.issueKey === 'string' ? body.issueKey : undefined;
      const issueId = typeof body.issueId === 'string' ? body.issueId : issueKey;
      if (!issueId) {
        return { provider: this.provider, status: 'failed', error: 'Jira response did not include an issue ID.' };
      }
      return {
        provider: this.provider,
        status: 'delivered',
        statusCode: response.status,
        externalId: issueKey ?? issueId,
        externalUrl: issueKey ? `${this.config.baseUrl}/browse/${encodeURIComponent(issueKey)}` : undefined
      };
    } catch (error) {
      return {
        provider: this.provider,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Jira request failed.'
      };
    }
  }
}

export class UnconfiguredJiraAdapter implements TicketingAdapter {
  readonly provider = 'jira';

  async createIncident(): Promise<TicketingDeliveryResult> {
    return {
      provider: this.provider,
      status: 'pending',
      error: 'Jira is not configured. Add the Jira environment variables to enable delivery.'
    };
  }
}

export class InvalidJiraConfigurationAdapter implements TicketingAdapter {
  readonly provider = 'jira';

  constructor(private readonly error: string) {}

  async createIncident(): Promise<TicketingDeliveryResult> {
    return { provider: this.provider, status: 'failed', error: this.error };
  }
}
