'use client';

import { useState, useEffect } from 'react';
import { IncidentPayload } from '@/lib/schema';
import PreTriageModal from '@/components/PreTriageModal';
import IncidentDetailDrawer from '@/components/IncidentDetailDrawer';

export default function OperationsDashboard() {
  const [incidents, setIncidents] = useState<IncidentPayload[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentPayload | null>(null);

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

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 font-medium text-xs px-4 py-2.5 rounded-lg text-white shadow-md transition flex items-center gap-2 cursor-pointer"
        >
          <span>+</span> Start Diagnostic Session
        </button>
      </header>

      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-slate-200">
            Live Intake Queue ({filteredIncidents.length})
          </h2>
          <div className="flex gap-1 text-xs">
            {['ALL', 'P1', 'P2', 'P3', 'P4'].map(p => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`px-3 py-1 rounded border cursor-pointer ${
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
          <div className="border border-dashed border-slate-800 rounded-lg p-16 text-center text-slate-500 text-sm space-y-3">
            <p>No incidents match the selected filter.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4 cursor-pointer"
            >
              Launch pre-triage intake session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIncidents.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedIncident(item)}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/60 transition cursor-pointer rounded-lg p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      item.priority === 'P1' ? 'bg-red-950 text-red-400 border border-red-800' :
                      item.priority === 'P2' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      item.priority === 'P3' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {item.priority}
                    </span>
                    <span className="text-xs uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {item.status || 'open'}
                    </span>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-100">{item.title}</h3>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{item.summary}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
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

      <PreTriageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onIncidentCreated={fetchIncidents}
      />

      <IncidentDetailDrawer
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onStatusUpdated={() => {
          setSelectedIncident(null);
          fetchIncidents();
        }}
      />
    </main>
  );
}
