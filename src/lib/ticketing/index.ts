import {
  getJiraConfig,
  InvalidJiraConfigurationAdapter,
  JiraServiceManagementAdapter,
  UnconfiguredJiraAdapter
} from './jira';
import type { TicketingAdapter } from './types';

export function getTicketingAdapter(): TicketingAdapter {
  try {
    const config = getJiraConfig();
    return config ? new JiraServiceManagementAdapter(config) : new UnconfiguredJiraAdapter();
  } catch (error) {
    return new InvalidJiraConfigurationAdapter(
      error instanceof Error ? error.message : 'Jira configuration is invalid.'
    );
  }
}

export type { TicketingAdapter, TicketingDeliveryResult } from './types';
