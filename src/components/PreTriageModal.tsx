'use client';

import React, { useState, useMemo } from 'react';
import { PLAYBOOKS, getNextMissingQuestion } from '@/lib/playbooks';

interface PreTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncidentCreated: () => void;
}

export default function PreTriageModal({ isOpen, onClose, onIncidentCreated }: PreTriageModalProps) {
  const [category, setCategory] = useState<string>('vpn');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [urgency, setUrgency] = useState<number>(2);
  const [impact, setImpact] = useState<number>(2);

  // Diagnostic slot answers keyed dynamically by slot key
  const [slots, setSlots] = useState<Record<string, string>>({
    operatingSystem: 'macOS',
    networkType: '',
    errorCode: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active playbook definition
  const currentPlaybook = PLAYBOOKS[category];

  // Calculate live diagnostic readiness score based on filled mandatory slots
  const readinessScore = useMemo(() => {
    if (!currentPlaybook) return 0;
    const requiredSlots = currentPlaybook.slots.filter(s => s.required);
    if (requiredSlots.length === 0) return 100;

    const filledCount = requiredSlots.filter(s => !!slots[s.key]?.trim()).length;
    const baseScore = Math.round((filledCount / requiredSlots.length) * 100);
    return baseScore;
  }, [category, slots, currentPlaybook]);

  // Determine next prompt required by the playbook engine
  const nextPrompt = useMemo(() => {
    return getNextMissingQuestion(category, slots);
  }, [category, slots]);

  const handleSlotChange = (key: string, value: string) => {
    setSlots(prev => ({ ...prev, [key]: value }));
  };

  const handleCategorySwitch = (newCat: string) => {
    setCategory(newCat);
    if (newCat === 'vpn') {
      setSlots({ operatingSystem: 'macOS', networkType: '', errorCode: '' });
    } else if (newCat === 'sso') {
      setSlots({ affectedApp: '', errorCode: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      title,
      summary,
      category: currentPlaybook.category,
      urgency,
      impact,
      reporter: {
        fullName: 'Self-Service Employee',
        email: 'employee@corp.internal',
        department: 'Engineering'
      },
      technicalContext: {
        operatingSystem: slots.operatingSystem || 'macOS',
        networkType: slots.networkType || 'Internal Gateway',
        errorCode: slots.errorCode || 'N/A',
        affectedApp: slots.affectedApp || category.toUpperCase(),
        attemptedWorkarounds: []
      },
      readinessScore
    };

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setTitle('');
        setSummary('');
        onIncidentCreated();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-6">
        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Guided Diagnostic Intake</h2>
            <p className="text-xs text-slate-400 mt-1">Rule-based slot collection & ITIL classification</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-300 font-mono text-lg"
          >
            ✕
          </button>
        </div>

        {/* Live Diagnostic Readiness Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Diagnostic Readiness</span>
            <span className={readinessScore >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {readinessScore}%
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              className={`h-full transition-all duration-300 ${readinessScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
              style={{ width: `${readinessScore}%` }} 
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Playbook Category</label>
              <select
                value={category}
                onChange={e => handleCategorySwitch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200"
              >
                <option value="vpn">Network / VPN</option>
                <option value="sso">Identity / SSO</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1">Issue Title</label>
              <input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Gateway auth timeout"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Symptoms Summary</label>
            <textarea
              required
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Describe what occurred prior to the interruption..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs mb-1">Urgency</label>
              <select 
                value={urgency} 
                onChange={e => setUrgency(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-slate-200"
              >
                <option value={1}>1 - Critical (Work halted)</option>
                <option value={2}>2 - High (Severe impediment)</option>
                <option value={3}>3 - Medium (Normal operation)</option>
                <option value={4}>4 - Low (Inconvenience)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1">Impact</label>
              <select 
                value={impact} 
                onChange={e => setImpact(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-slate-200"
              >
                <option value={1}>1 - Entire Org</option>
                <option value={2}>2 - Full Department</option>
                <option value={3}>3 - Project Workgroup</option>
                <option value={4}>4 - Single Person</option>
              </select>
            </div>
          </div>

          {/* Dynamic Playbook Questions */}
          <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/60 space-y-3">
            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Playbook Diagnostic Requirements
            </h4>
            
            {currentPlaybook.slots.map(slot => (
              <div key={slot.key}>
                <label className="block text-slate-300 text-xs mb-1">
                  {slot.question} {slot.required && <span className="text-red-400">*</span>}
                </label>
                {slot.key === 'operatingSystem' ? (
                  <select
                    value={slots[slot.key] || 'macOS'}
                    onChange={e => handleSlotChange(slot.key, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 text-xs"
                  >
                    <option value="macOS">macOS</option>
                    <option value="Windows">Windows</option>
                    <option value="Linux">Linux</option>
                  </select>
                ) : (
                  <input
                    required={slot.required}
                    value={slots[slot.key] || ''}
                    onChange={e => handleSlotChange(slot.key, e.target.value)}
                    placeholder={`Enter ${slot.label.toLowerCase()}...`}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>
            ))}

            {nextPrompt && (
              <p className="text-xs text-amber-400/90 font-mono bg-amber-950/30 border border-amber-900/50 p-2 rounded">
                Pending Requirement: {nextPrompt}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 text-slate-300 text-xs font-semibold rounded hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || readinessScore < 60}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded transition"
            >
              {isSubmitting ? 'Evaluating...' : 'Dispatch Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
