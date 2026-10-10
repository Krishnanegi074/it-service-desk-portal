'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { PilotFeedback } from '@/lib/schema';

export default function PilotFeedbackPanel({ incidentId }: { incidentId: string }) {
  const [routingAccurate, setRoutingAccurate] = useState('');
  const [clarificationCount, setClarificationCount] = useState('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/incidents/${incidentId}/pilot-feedback`, { cache: 'no-store' })
      .then(async response => {
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.error || 'Unable to load feedback.');
        return body.data as PilotFeedback | null;
      })
      .then(feedback => {
        if (cancelled || !feedback) return;
        setRoutingAccurate(String(feedback.routingAccurate));
        setClarificationCount(String(feedback.clarificationCount));
      })
      .catch(error => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Unable to load feedback.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [incidentId]);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/incidents/${incidentId}/pilot-feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routingAccurate: routingAccurate === 'true',
          clarificationCount: Number(clarificationCount)
        })
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || 'Unable to save feedback.');
      setMessage('Pilot feedback saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save feedback.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-indigo-900/70 bg-indigo-950/20 p-4">
      <h3 className="text-xs font-semibold uppercase text-indigo-300">Pilot quality feedback</h3>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        Record whether the initial routing was usable and how many clarification contacts were needed.
      </p>
      {loading ? <p role="status" className="mt-3 text-xs text-slate-400">Loading pilot feedback…</p> : (
        <form onSubmit={submitFeedback} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-300">
            Routing quality
            <select
              required
              value={routingAccurate}
              onChange={event => setRoutingAccurate(event.target.value)}
              className="field mt-1 text-sm"
            >
              <option value="">Select result</option>
              <option value="true">Accurate as submitted</option>
              <option value="false">Needed category or priority correction</option>
            </select>
          </label>
          <label className="text-xs text-slate-300">
            Clarification contacts
            <input
              type="number"
              min="0"
              max="20"
              required
              value={clarificationCount}
              onChange={event => setClarificationCount(event.target.value)}
              className="field mt-1 text-sm"
            />
          </label>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={saving || !routingAccurate}
              className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold hover:bg-indigo-500 disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save pilot feedback'}
            </button>
            {message && <p role="status" className="text-xs text-slate-300">{message}</p>}
          </div>
        </form>
      )}
    </section>
  );
}
