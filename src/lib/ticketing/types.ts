import type { IncidentPayload } from '@/lib/schema';

export interface TicketingDeliveryResult {
  status: 'pending' | 'delivered' | 'failed';
  provider: string;
  externalId?: string;
  externalUrl?: string;
  error?: string;
  statusCode?: number;
}

export interface TicketingAdapter {
  readonly provider: string;
  createIncident(incident: IncidentPayload): Promise<TicketingDeliveryResult>;
}
