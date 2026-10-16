import { mapJiraStatus } from '@/lib/jira-webhook';
import type { IncidentStatus } from '@/lib/schema';
import { getJiraConfig } from './jira';

export type JiraStatusSyncResult =
  | { status: 'synced'; issueKey: string; jiraStatus: string }
  | { status: 'unchanged'; issueKey: string; jiraStatus: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; issueKey?: string; error: string };

interface JiraTransition {
  id: string;
  name: string;
  to?: { name?: string };
}

/** Preferred Jira target status names for each portal status, best match first. */
const PREFERRED_TARGETS: Record<IncidentStatus, string[]> = {
  open: ['open', 'to do', 'new', 'backlog'],
  in_triage: ['in progress', 'work in progress', 'in triage', 'investigating', 'waiting for support'],
  dispatched: ['escalated', 'assigned', 'dispatched', 'in progress', 'work in progress'],
  resolved: ['resolved', 'done', 'closed']
};

function isCancel(name: string) {
  return /cancel/i.test(name);
}

/** A working step to pass through when Jira cannot reach the target in one move (e.g. Open -> In progress -> Resolved). */
function pickSteppingStone(transitions: JiraTransition[], visited: Set<string>): JiraTransition | null {
  for (const name of ['in progress', 'work in progress', 'in triage', 'investigating']) {
    const step = transitions.find(t => {
      const to = t.to?.name?.trim().toLowerCase();
      return to === name && !visited.has(to);
    });
    if (step) return step;
  }
  return null;
}

export function pickTransition(
  transitions: JiraTransition[],
  target: IncidentStatus
): JiraTransition | null {
  const candidates = transitions.filter(
    t => t.to?.name && mapJiraStatus(t.to.name) === target && !isCancel(t.to.name)
  );
  if (target === 'in_triage' || target === 'dispatched') {
    // Fall back to any transition named for the preferred targets, even if the mapping differs.
    for (const name of PREFERRED_TARGETS[target]) {
      const exact = transitions.find(t => t.to?.name?.trim().toLowerCase() === name);
      if (exact) return exact;
    }
  }
  for (const name of PREFERRED_TARGETS[target]) {
    const exact = candidates.find(t => t.to?.name?.trim().toLowerCase() === name);
    if (exact) return exact;
  }
  return candidates[0] ?? null;
}

/**
 * Moves the linked Jira issue to the status that matches the portal status.
 * Never throws: the portal change has already been saved, so Jira problems are reported, not raised.
 */
export async function syncJiraIssueStatus(
  issueKey: string | null | undefined,
  target: IncidentStatus
): Promise<JiraStatusSyncResult> {
  if (!issueKey) return { status: 'skipped', reason: 'Incident has no linked Jira issue.' };

  let config;
  try {
    config = getJiraConfig();
  } catch (error) {
    return { status: 'failed', issueKey, error: error instanceof Error ? error.message : 'Invalid Jira configuration.' };
  }
  if (!config) return { status: 'skipped', reason: 'Jira is not configured.' };

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}`
  };
  const issueUrl = `${config.baseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}`;

  try {
    let currentName: string | undefined;
    const current = await fetch(`${issueUrl}?fields=status`, { headers });
    if (current.ok) {
      const body = (await current.json().catch(() => ({}))) as { fields?: { status?: { name?: string } } };
      currentName = body.fields?.status?.name;
      if (currentName && mapJiraStatus(currentName) === target) {
        return { status: 'unchanged', issueKey, jiraStatus: currentName };
      }
    }

    const visited = new Set<string>(currentName ? [currentName.trim().toLowerCase()] : []);
    for (let hop = 0; hop < 3; hop += 1) {
      const listed = await fetch(`${issueUrl}/transitions`, { headers });
      if (!listed.ok) {
        return { status: 'failed', issueKey, error: `Jira transitions lookup returned HTTP ${listed.status}` };
      }
      const { transitions = [] } = (await listed.json().catch(() => ({}))) as { transitions?: JiraTransition[] };
      const transition = pickTransition(transitions, target);
      const step = transition ?? (target === 'resolved' ? pickSteppingStone(transitions, visited) : null);

      if (!step) {
        if ((target === 'in_triage' || target === 'dispatched') && currentName) {
          // Middle steps are portal-only triage stages; not every Jira workflow has an equivalent.
          return { status: 'unchanged', issueKey, jiraStatus: currentName };
        }
        if (target === 'resolved' && currentName && isCancel(currentName)) {
          return { status: 'unchanged', issueKey, jiraStatus: currentName };
        }
        const options = transitions.map(t => t.to?.name ?? t.name).join(', ') || 'none';
        return {
          status: 'failed',
          issueKey,
          error: `Jira has no step to "${target.replace('_', ' ')}" from "${currentName ?? 'its current status'}". Available: ${options}.`
        };
      }

      const moved = await fetch(`${issueUrl}/transitions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ transition: { id: step.id } })
      });
      if (!moved.ok) {
        return { status: 'failed', issueKey, error: `Jira transition returned HTTP ${moved.status}` };
      }
      currentName = step.to?.name ?? step.name;
      if (transition) return { status: 'synced', issueKey, jiraStatus: currentName };
      visited.add(currentName.trim().toLowerCase());
    }
    return { status: 'failed', issueKey, error: 'Jira needed too many steps to reach the matching status.' };
  } catch (error) {
    return { status: 'failed', issueKey, error: error instanceof Error ? error.message : 'Jira request failed.' };
  }
}
