'use client';

import { useState, useEffect } from 'react';
import { IncidentPayload } from '@/lib/schema';

export default function OperationsDashboard() {
  const [incidents, setIncidents] = useState<IncidentPayload[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Form state for creating a ticket directly
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('vpn');
  const [urgency, setUrgency] = useState(2);
  const [impact, setImpact] = useState(2);
  const [operatingSystem, setOperatingSystem] = useState<'macOS' | 'Windows' | 'Linux'>('macOS');
  const [networkType, setNetworkType] = useState('Home Wi-Fi');
  const [errorCode, setErrorCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  async function fetchIncidents() {
    try {
      const res = await fetch('/api/incidents');
      const json = await res.json();
      if (json.success) setIncidents(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary,
          category: category === 'vpn' ? 'Network / VPN' : 'Identity / SSO',
          urgency,
          impact,
          reporter: {
            fullName: 'Staff Engineer',
            email: 'engineer@corp.internal',
            department: 'Platform'
          },
          technicalContext: {
            operatingSystem,
            networkType,
            errorCode: errorCode || 'None provided',
            affectedApp: category.toUpperCase(),
            attemptedWorkarounds: []
          }
        })
      });

      if (res.ok) {
        setTitle('');
        setSummary('');
        setErrorCode('');
        fetchIncidents();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const filteredIncidents = filter === 'ALL' 
    ? incidents 
    : incidents.filter(i => i.priority === filter);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-8 border-b border-slate-800 pb-6 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">IT Pre-Triage Engineering Console</h1>
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono">
              v2-fullstack
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Deterministic ITIL Priority Matrix • Rule-Engine Diagnostics • Postgres Persistence
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket Submission / Diagnostic Intake Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-200">Submit Diagnostic Session</h2>
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-slate-400 mb-1">Issue Title</label>
              <input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Cisco AnyConnect TLS handshake failed"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Summary</label>
              <textarea
                required
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="User unable to connect from remote branch..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Urgency</label>
                <select 
                  value={urgency} 
                  onChange={e => setUrgency(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-slate-200"
                >
                  <option value={1}>1 - Critical</option>
                  <option value={2}>2 - High</option>
                  <option value={3}>3 - Medium</option>
                  <option value={4}>4 - Low</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Impact</label>
                <select 
                  value={impact} 
                  onChange={e => setImpact(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-slate-200"
                >
                  <option value={1}>1 - Organization</option>
                  <option value={2}>2 - Department</option>
                  <option value={3}>3 - Workgroup</option>
                  <option value={4}>4 - Individual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">OS</label>
                <select 
                  value={operatingSystem} 
                  onChange={e => setOperatingSystem(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-slate-200"
                >
                  <option value="macOS">macOS</option>
                  <option value="Windows">Windows</option>
                  <option value="Linux">Linux</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Network</label>
                <input
                  value={networkType}
                  onChange={e => setNetworkType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Error String / Code</label>
              <input
                value={errorCode}
                onChange={e => setErrorCode(e.target.value)}
                placeholder="e.g. ERR_CERT_REVOKED"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold py-2 rounded text-white transition disabled:opacity-50"
            >
              {submitting ? 'Ingesting...' : 'Dispatch Ticket'}
            </button>
          </form>
        </div>

        {/* Live Incident Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-slate-200">
              Live Intake Queue ({filteredIncidents.length})
            </h2>
            <div className="flex gap-1 text-xs">
              {['ALL', 'P1', 'P2', 'P3', 'P4'].map(p => (
                <button
                  key={p}
                  onClick={() => setFilter(p)}
                  className={`px-3 py-1 rounded border ${
                    filter === p 
                      ? 'bg-slate-800 border-slate-600 text-white' 
                      : 'border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-slate-500 text-sm">Loading incident queue...</p>
          ) : filteredIncidents.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-lg p-12 text-center text-slate-500 text-sm">
              No incidents match this filter. Use the intake form to dispatch a diagnostic session.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIncidents.map(item => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          item.priority === 'P1' ? 'bg-red-950 text-red-400 border border-red-800' :
                          item.priority === 'P2' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          item.priority === 'P3' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {item.priority}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          ITIL: Urg={item.urgency} × Imp={item.impact}
                        </span>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-100">{item.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">{item.summary}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap gap-4 text-xs text-slate-400">
                    <div><span className="text-slate-500">OS:</span> {item.technicalContext?.operatingSystem}</div>
                    <div><span className="text-slate-500">Net:</span> {item.technicalContext?.networkType}</div>
                    <div><span className="text-slate-500">Error:</span> {item.technicalContext?.errorCode || 'None'}</div>
                    <div className="ml-auto font-mono text-emerald-400">Readiness: {item.readinessScore}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
