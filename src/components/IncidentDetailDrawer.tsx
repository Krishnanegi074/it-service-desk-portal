'use client';

import React, { useState } from 'react';
import { IncidentPayload } from '@/lib/schema';

interface IncidentDetailDrawerProps {
  incident: IncidentPayload | null;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export default function IncidentDetailDrawer({
  incident,
  onClose,
  onStatusUpdated
}: IncidentDetailDrawerProps) {
  const [updating, setUpdating] = useState(false);

  if (!incident) return null;

  async function handleStatusChange(nextStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/incidents/${incident?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        onStatusUpdated();
      }
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2.5 py-0.5 rounded font-bold ${
                  incident.priority === 'P1' ? 'bg-red-950 text-red-400 border border-red-800' :
                  incident.priority === 'P2' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                  incident.priority === 'P3' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {incident.priority}
                </span>
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {incident.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">{incident.title}</h2>
              <p className="text-xs text-slate-500 font-mono mt-1">ID: {incident.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-xl font-mono"
            >
              ✕
            </button>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1">Description</h3>
            <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {incident.summary}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block mb-1">Reporter</span>
              <p className="font-semibold text-slate-200">{incident.reporter?.fullName}</p>
              <p className="text-slate-400 font-mono">{incident.reporter?.email}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block mb-1">Evaluation Matrix</span>
              <p className="text-slate-200 font-mono">Urgency: {incident.urgency} / 4</p>
              <p className="text-slate-200 font-mono">Impact: {incident.impact} / 4</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Technical Telemetry</h3>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-500">Operating System</span>
                <span className="font-mono text-slate-200">{incident.technicalContext?.operatingSystem}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-500">Network Interface</span>
                <span className="font-mono text-slate-200">{incident.technicalContext?.networkType}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Error Code / Log String</span>
                <code className="block bg-slate-900 text-amber-300 p-2 rounded text-xs font-mono break-all border border-slate-800">
                  {incident.technicalContext?.errorCode || 'None reported'}
                </code>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4 flex gap-2">
          <button
            disabled={updating || incident.status === 'in-progress'}
            onClick={() => handleStatusChange('in-progress')}
            className="flex-1 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded transition disabled:opacity-40"
          >
            Mark In-Progress
          </button>
          <button
            disabled={updating || incident.status === 'resolved'}
            onClick={() => handleStatusChange('resolved')}
            className="flex-1 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition disabled:opacity-40"
          >
            Mark Resolved
          </button>
        </div>
      </div>
    </div>
  );
}
