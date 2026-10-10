'use client';

import { useState } from 'react';

interface RetentionPreview {
  retentionDays: number;
  cutoff: string;
  eligibleIncidents: number;
  confirmationPhrase: string;
}

function formatCutoffDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(value));
}

export default function SecurityRetentionPanel({ initialPreview }: { initialPreview: RetentionPreview }) {
  const [preview, setPreview] = useState<RetentionPreview>(initialPreview);
  const [confirmation, setConfirmation] = useState('');
  const [purging, setPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadPreview() {
    setError(null);
    try {
      const response = await fetch('/api/admin/retention', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || 'Unable to load retention policy.');
      setPreview(body.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load retention policy.');
    }
  }

  async function purgeExpiredRecords() {
    if (!preview || confirmation !== preview.confirmationPhrase) return;
    setPurging(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation })
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || 'Unable to purge expired incidents.');
      setMessage(`${body.data.deletedIncidents} expired incident${body.data.deletedIncidents === 1 ? '' : 's'} permanently deleted. Audit run: ${body.data.runId}`);
      setConfirmation('');
      await loadPreview();
    } catch (purgeError) {
      setError(purgeError instanceof Error ? purgeError.message : 'Unable to purge expired incidents.');
    } finally {
      setPurging(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <div role="alert" className="rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
      {message && <div role="status" className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-300">{message}</div>}
      <dl className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><dt className="text-xs uppercase tracking-wider text-slate-400">Retention period</dt><dd className="mt-2 text-2xl font-bold">{preview.retentionDays} days</dd></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><dt className="text-xs uppercase tracking-wider text-slate-400">Eligible incidents</dt><dd className="mt-2 text-2xl font-bold text-amber-300">{preview.eligibleIncidents}</dd></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><dt className="text-xs uppercase tracking-wider text-slate-400">Delete before</dt><dd className="mt-2 text-sm font-semibold">{formatCutoffDate(preview.cutoff)}</dd></div>
      </dl>

      <div className="rounded-xl border border-red-950 bg-red-950/20 p-5">
            <h2 className="font-semibold text-red-200">Permanently purge expired data</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">This deletes eligible incidents and their diagnostic answers, delivery attempts, and event history. The purge itself remains in the retention audit log.</p>
            <label htmlFor="retention-confirmation" className="mt-4 block text-xs text-slate-400">Type <span className="font-mono text-red-300">{preview.confirmationPhrase}</span> to continue.</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input id="retention-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="field font-mono" />
              <button type="button" onClick={purgeExpiredRecords} disabled={purging || confirmation !== preview.confirmationPhrase} className="shrink-0 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40">{purging ? 'Purging…' : 'Purge expired incidents'}</button>
            </div>
      </div>
    </div>
  );
}
