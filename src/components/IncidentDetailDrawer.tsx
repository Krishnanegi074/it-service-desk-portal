'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { evaluateITILPriority } from '@/lib/priority';
import type {
  AppUserSummary,
  IncidentEvent,
  IncidentPayload,
  IncidentStatus,
  IntegrationDelivery
} from '@/lib/schema';
import PilotFeedbackPanel from '@/components/PilotFeedbackPanel';

interface IncidentDetailDrawerProps {
  incident: IncidentPayload | null;
  staff: AppUserSummary[];
  onClose: () => void;
  onChanged: (incident: IncidentPayload) => void | Promise<void>;
}

function eventDescription(event: IncidentEvent) {
  if (event.eventType === 'created') return 'Incident created';
  if (event.eventType === 'status_changed') return `Status changed from ${event.fromStatus?.replace('_', ' ')} to ${event.toStatus?.replace('_', ' ')}`;
  if (event.eventType === 'assigned') {
    const assignee = event.metadata.assignee as { fullName?: string } | null | undefined;
    return assignee?.fullName ? `Assigned to ${assignee.fullName}` : 'Assignment removed';
  }
  if (event.eventType === 'delivery_attempted') return `Delivery ${String(event.metadata.status ?? 'attempted')} via ${String(event.metadata.provider ?? 'integration')}`;
  return 'Internal note added';
}

export default function IncidentDetailDrawer({
  incident,
  staff,
  onClose,
  onChanged
}: IncidentDetailDrawerProps) {
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [delivery, setDelivery] = useState<IntegrationDelivery | null>(null);
  const [note, setNote] = useState('');
  const [working, setWorking] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!incident?.id) return;
    void loadActivity(incident.id);
  }, [incident?.id]);

  const attribution = useMemo(
    () => incident ? evaluateITILPriority(incident.urgency, incident.impact).attribution : '',
    [incident]
  );

  if (!incident) return null;
  const activeIncident = incident;

  async function loadActivity(id: string) {
    setActivityLoading(true);
    try {
      const [eventsResponse, deliveryResponse] = await Promise.all([
        fetch(`/api/incidents/${id}/events`, { cache: 'no-store' }),
        fetch(`/api/incidents/${id}/delivery`, { cache: 'no-store' })
      ]);
      const [eventsBody, deliveryBody] = await Promise.all([
        eventsResponse.json(),
        deliveryResponse.json()
      ]);
      if (eventsResponse.ok && eventsBody.success) setEvents(eventsBody.data);
      if (deliveryResponse.ok && deliveryBody.success) setDelivery(deliveryBody.data);
    } finally {
      setActivityLoading(false);
    }
  }

  async function updateIncident(path: string, init: RequestInit) {
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(path, init);
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || 'Unable to update incident.');
      await onChanged(body.data);
      await loadActivity(activeIncident.id!);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update incident.');
    } finally {
      setWorking(false);
    }
  }

  function handleStatusChange(nextStatus: IncidentStatus) {
    return updateIncident(`/api/incidents/${activeIncident.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });
  }

  function handleAssignment(assigneeId: string) {
    return updateIncident(`/api/incidents/${activeIncident.id}/assignment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigneeId: assigneeId || null })
    });
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(`/api/incidents/${activeIncident.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || 'Unable to add note.');
      setNote('');
      await loadActivity(activeIncident.id!);
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : 'Unable to add note.');
    } finally {
      setWorking(false);
    }
  }

  async function retryDelivery() {
    setWorking(true);
    setError(null);
    try {
      const response = await fetch(`/api/incidents/${activeIncident.id}/delivery`, { method: 'POST' });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || 'Unable to retry delivery.');
      setDelivery(body.data);
      await loadActivity(activeIncident.id!);
    } catch (deliveryError) {
      setError(deliveryError instanceof Error ? deliveryError.message : 'Unable to retry delivery.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-black/60 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="incident-drawer-title">
      <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2"><span className={`rounded px-2.5 py-0.5 text-xs font-bold ${incident.priority === 'P1' ? 'border border-red-800 bg-red-950 text-red-400' : incident.priority === 'P2' ? 'border border-amber-800 bg-amber-950 text-amber-400' : incident.priority === 'P3' ? 'border border-blue-800 bg-blue-950 text-blue-400' : 'bg-slate-800 text-slate-300'}`}>{incident.priority}</span><span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs uppercase text-slate-300">{incident.status.replace('_', ' ')}</span></div>
            <h2 id="incident-drawer-title" className="text-xl font-bold text-slate-100">{incident.title}</h2>
            <p className="mt-1 break-all font-mono text-xs text-slate-400">{incident.id}</p>
          </div>
          <button onClick={onClose} aria-label="Close incident details" className="ml-4 text-xl font-mono text-slate-400 hover:text-slate-200">✕</button>
        </div>

        {error && <div role="alert" className="mt-4 rounded border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}

        <div className="mt-6 space-y-6">
          <section className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-400">Status<select value={incident.status} disabled={working} onChange={event => void handleStatusChange(event.target.value as IncidentStatus)} className="field mt-1 text-sm">{(['open', 'in_triage', 'dispatched', 'resolved'] as IncidentStatus[]).map(value => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select></label>
            <label className="text-xs text-slate-400">Assignee<select value={incident.assignedTo?.id ?? ''} disabled={working} onChange={event => void handleAssignment(event.target.value)} className="field mt-1 text-sm"><option value="">Unassigned</option>{staff.map(member => <option key={member.id} value={member.id}>{member.fullName} · {member.role}</option>)}</select></label>
          </section>

          <section><h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Description</h3><p className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm leading-6 text-slate-300">{incident.summary}</p></section>

          <section className="grid gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><span className="mb-1 block text-slate-400">Reporter</span><p className="font-semibold text-slate-200">{incident.reporter.fullName}</p><p className="break-all font-mono text-slate-400">{incident.reporter.email}</p></div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><span className="mb-1 block text-slate-400">Priority attribution</span><p className="font-mono leading-5 text-slate-200">{attribution}</p></div>
          </section>

          <section>
            <div className="mb-2 flex justify-between text-xs"><h3 className="font-semibold uppercase text-slate-400">Diagnostic completeness</h3><span className="font-mono text-emerald-400">{incident.readinessScore}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-950"><div className="h-full bg-emerald-500" style={{ width: `${incident.readinessScore}%` }} /></div>
          </section>

          <section><h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Technical context</h3><dl className="space-y-2 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs"><div className="flex justify-between gap-4 border-b border-slate-800/60 pb-2"><dt className="text-slate-400">Operating system</dt><dd className="font-mono text-slate-200">{incident.technicalContext.operatingSystem}</dd></div><div className="flex justify-between gap-4 border-b border-slate-800/60 pb-2"><dt className="text-slate-400">Network</dt><dd className="text-right font-mono text-slate-200">{incident.technicalContext.networkType}</dd></div><div className="flex justify-between gap-4 border-b border-slate-800/60 pb-2"><dt className="text-slate-400">Application/device</dt><dd className="text-right font-mono text-slate-200">{incident.technicalContext.affectedApp}</dd></div><div><dt className="mb-1 text-slate-400">Error code or message</dt><dd className="break-all rounded border border-slate-800 bg-slate-900 p-2 font-mono text-amber-300">{incident.technicalContext.errorCode || 'None reported'}</dd></div>{incident.technicalContext.attemptedWorkarounds.length > 0 && <div><dt className="mt-2 text-slate-400">Attempted workarounds</dt><dd className="mt-1 text-slate-300">{incident.technicalContext.attemptedWorkarounds.join(' • ')}</dd></div>}</dl></section>

          <section className="rounded-lg border border-slate-800 bg-slate-950 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xs font-semibold uppercase text-slate-400">Jira delivery</h3>{delivery ? <><p className="mt-1 text-sm text-slate-200">{delivery.provider} · <span className={delivery.status === 'delivered' ? 'text-emerald-400' : delivery.status === 'pending' ? 'text-amber-300' : 'text-red-400'}>{delivery.status}</span> · {delivery.attemptCount} attempt{delivery.attemptCount === 1 ? '' : 's'}</p>{delivery.externalUrl ? <a href={delivery.externalUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-indigo-300 underline hover:text-indigo-200">Open {delivery.externalId ?? 'ticket'} in Jira</a> : delivery.externalId ? <p className="mt-1 font-mono text-xs text-slate-300">{delivery.externalId}</p> : null}{delivery.lastError && <p className={`mt-1 text-xs ${delivery.status === 'pending' ? 'text-amber-200' : 'text-red-300'}`}>{delivery.lastError}</p>}</> : <p className="mt-1 text-sm text-slate-400">This older incident has not been sent to Jira.</p>}</div>{delivery?.status !== 'delivered' && <button type="button" onClick={retryDelivery} disabled={working} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold hover:bg-indigo-500 disabled:opacity-40">{delivery?.status === 'failed' ? 'Retry Jira delivery' : 'Send to Jira'}</button>}</div></section>

          <PilotFeedbackPanel key={activeIncident.id} incidentId={activeIncident.id!} />

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Internal note</h3>
            <form onSubmit={submitNote} className="space-y-2"><textarea value={note} onChange={event => setNote(event.target.value)} required minLength={2} maxLength={2000} rows={3} placeholder="Add troubleshooting context for engineers…" className="field" /><div className="flex justify-end"><button type="submit" disabled={working || note.trim().length < 2} className="rounded bg-indigo-600 px-4 py-2 text-xs font-semibold hover:bg-indigo-500 disabled:opacity-40">Add internal note</button></div></form>
          </section>

          <section><h3 className="mb-3 text-xs font-semibold uppercase text-slate-400">Activity history</h3>{activityLoading ? <p role="status" className="text-xs text-slate-400">Loading activity…</p> : events.length === 0 ? <p className="text-xs text-slate-400">No activity recorded.</p> : <ol className="space-y-3 border-l border-slate-700 pl-4">{events.map(event => <li key={event.id} className="relative text-sm"><span className="absolute -left-[1.28rem] top-1 h-2 w-2 rounded-full bg-indigo-400" /><p className="text-slate-300">{eventDescription(event)}</p>{event.eventType === 'note_added' && <p className="mt-1 rounded border border-slate-800 bg-slate-950 p-2 text-xs leading-5 text-slate-400">{String(event.metadata.note ?? '')}</p>}<time className="mt-1 block text-xs text-slate-400">{new Date(event.createdAt).toLocaleString('en-GB')}</time></li>)}</ol>}</section>
        </div>
      </div>
    </div>
  );
}
