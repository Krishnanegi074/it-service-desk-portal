'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createInitialSlots, getNextMissingQuestion, PLAYBOOKS } from '@/lib/playbooks';
import { IncidentPayload, IncidentPayloadSchema } from '@/lib/schema';

interface IncidentIntakeFormProps {
  onSuccess: (incident: IncidentPayload) => void | Promise<void>;
  onCancel?: () => void;
  initialReporter?: {
    fullName: string;
    email: string;
  };
}

const urgencyOptions = [
  { value: 1, label: 'I cannot work at all' },
  { value: 2, label: 'My work is severely limited' },
  { value: 3, label: 'I can continue with a workaround' },
  { value: 4, label: 'This is a minor inconvenience' }
] as const;

const impactOptions = [
  { value: 1, label: 'The entire organization' },
  { value: 2, label: 'A department or office' },
  { value: 3, label: 'A small team or project' },
  { value: 4, label: 'Only me' }
] as const;

export default function IncidentIntakeForm({ onSuccess, onCancel, initialReporter }: IncidentIntakeFormProps) {
  const [category, setCategory] = useState('vpn');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [urgency, setUrgency] = useState<1 | 2 | 3 | 4>(2);
  const [impact, setImpact] = useState<1 | 2 | 3 | 4>(4);
  const [reporterName, setReporterName] = useState(initialReporter?.fullName ?? '');
  const [reporterEmail, setReporterEmail] = useState(initialReporter?.email ?? '');
  const [reporterDepartment, setReporterDepartment] = useState('');
  const [attemptedWorkarounds, setAttemptedWorkarounds] = useState('');
  const [slots, setSlots] = useState<Record<string, string>>(() => createInitialSlots('vpn'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [intakeSessionId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    void fetch('/api/intake-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', sessionId: intakeSessionId }),
      keepalive: true
    }).catch(() => undefined);
  }, [intakeSessionId]);

  const currentPlaybook = PLAYBOOKS[category];
  const readinessScore = useMemo(() => {
    const requiredSlots = currentPlaybook.slots.filter(slot => slot.required);
    if (requiredSlots.length === 0) return 100;
    const completed = requiredSlots.filter(slot => slots[slot.key]?.trim()).length;
    return Math.round((completed / requiredSlots.length) * 100);
  }, [currentPlaybook, slots]);
  const nextPrompt = useMemo(
    () => getNextMissingQuestion(category, slots),
    [category, slots]
  );

  function changeCategory(nextCategory: string) {
    setCategory(nextCategory);
    setSlots(createInitialSlots(nextCategory));
  }

  function changeSlot(key: string, value: string) {
    setSlots(previous => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const workarounds = attemptedWorkarounds
      .split(/\n|,/)
      .map(item => item.trim())
      .filter(Boolean);
    const payload = {
      title,
      summary,
      category: currentPlaybook.category,
      urgency,
      impact,
      reporter: {
        fullName: reporterName,
        email: reporterEmail,
        ...(reporterDepartment.trim() ? { department: reporterDepartment.trim() } : {})
      },
      technicalContext: {
        operatingSystem: slots.operatingSystem || 'Other',
        networkType: slots.networkType || 'Not applicable',
        errorCode: slots.errorCode || undefined,
        affectedApp: slots.affectedApp || currentPlaybook.affectedAppFallback,
        attemptedWorkarounds: workarounds
      },
      readinessScore
    };

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(payload)
      });
      const responseBody: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof responseBody === 'object' && responseBody !== null &&
          'error' in responseBody && typeof responseBody.error === 'string'
            ? responseBody.error
            : 'The incident could not be submitted. Please try again.';
        throw new Error(message);
      }

      const parsedIncident = IncidentPayloadSchema.safeParse(
        typeof responseBody === 'object' && responseBody !== null && 'data' in responseBody
          ? responseBody.data
          : undefined
      );
      if (!parsedIncident.success) {
        throw new Error('The server returned an invalid incident response.');
      }

      if (parsedIncident.data.id) {
        await fetch('/api/intake-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete',
            sessionId: intakeSessionId,
            incidentId: parsedIncident.data.id
          }),
          keepalive: true
        }).catch(() => undefined);
      }

      await onSuccess(parsedIncident.data);
      setIdempotencyKey(crypto.randomUUID());
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'The incident could not be submitted.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Report an IT issue</h1>
          <p className="text-sm text-slate-400 mt-1">
            Answer focused questions so the IT team receives a resolver-ready ticket.
          </p>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} aria-label="Close diagnostic intake" className="text-slate-400 hover:text-slate-200 font-mono text-lg">
            ✕
          </button>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-400">Diagnostic completeness</span>
          <span className={readinessScore === 100 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{readinessScore}%</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div className={`h-full transition-all duration-300 ${readinessScore === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${readinessScore}%` }} />
        </div>
      </div>

      <div role="note" className="rounded-lg border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
        Never enter passwords, one-time codes, recovery codes, or private access tokens.
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-200 mb-2">Your details</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="reporter-name" className="block text-slate-400 text-xs mb-1">Full name</label>
              <input id="reporter-name" required minLength={2} value={reporterName} onChange={event => setReporterName(event.target.value)} readOnly={Boolean(initialReporter)} autoComplete="name" className="field read-only:cursor-not-allowed read-only:opacity-70" />
            </div>
            <div>
              <label htmlFor="reporter-email" className="block text-slate-400 text-xs mb-1">Work email</label>
              <input id="reporter-email" type="email" required value={reporterEmail} onChange={event => setReporterEmail(event.target.value)} readOnly={Boolean(initialReporter)} autoComplete="email" className="field read-only:cursor-not-allowed read-only:opacity-70" />
            </div>
          </div>
          <div>
            <label htmlFor="reporter-department" className="block text-slate-400 text-xs mb-1">Department (optional)</label>
            <input id="reporter-department" value={reporterDepartment} onChange={event => setReporterDepartment(event.target.value)} autoComplete="organization-title" className="field" />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-200 mb-2">What is happening?</legend>
          <div>
            <label htmlFor="playbook-category" className="block text-slate-400 text-xs mb-1">Issue type</label>
            <select id="playbook-category" value={category} onChange={event => changeCategory(event.target.value)} className="field">
              {Object.entries(PLAYBOOKS).map(([key, playbook]) => <option key={key} value={key}>{playbook.category}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">{currentPlaybook.description}</p>
          </div>
          <div>
            <label htmlFor="issue-title" className="block text-slate-400 text-xs mb-1">Short title</label>
            <input id="issue-title" required minLength={5} value={title} onChange={event => setTitle(event.target.value)} placeholder="For example, VPN disconnects after signing in" className="field" />
          </div>
          <div>
            <label htmlFor="symptoms-summary" className="block text-slate-400 text-xs mb-1">Describe the problem</label>
            <textarea id="symptoms-summary" required minLength={10} value={summary} onChange={event => setSummary(event.target.value)} placeholder="What happened, when did it start, and what were you trying to do?" rows={4} className="field" />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-200 mb-2">Business impact</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="work-impact" className="block text-slate-400 text-xs mb-1">How much is your work affected?</label>
              <select id="work-impact" value={urgency} onChange={event => setUrgency(Number(event.target.value) as 1 | 2 | 3 | 4)} className="field">
                {urgencyOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="people-affected" className="block text-slate-400 text-xs mb-1">Who else is affected?</label>
              <select id="people-affected" value={impact} onChange={event => setImpact(Number(event.target.value) as 1 | 2 | 3 | 4)} className="field">
                {impactOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-slate-800 rounded-lg p-4 bg-slate-950/60 space-y-3">
          <legend className="px-1 text-xs font-semibold text-indigo-400 uppercase tracking-wider">Diagnostic questions</legend>
          {currentPlaybook.slots.map(slot => (
            <div key={slot.key}>
              <label htmlFor={`diagnostic-${slot.key}`} className="block text-slate-300 text-xs mb-1">
                {slot.question} {slot.required && <span className="text-red-400">*</span>}
              </label>
              {slot.control === 'operating-system' ? (
                <select id={`diagnostic-${slot.key}`} value={slots[slot.key] || 'macOS'} onChange={event => changeSlot(slot.key, event.target.value)} className="field text-xs">
                  <option value="macOS">macOS</option><option value="Windows">Windows</option><option value="Linux">Linux</option><option value="iOS">iOS</option><option value="Android">Android</option><option value="Other">Other</option>
                </select>
              ) : (
                <input id={`diagnostic-${slot.key}`} required={slot.required} value={slots[slot.key] || ''} onChange={event => changeSlot(slot.key, event.target.value)} placeholder={slot.placeholder} className="field text-xs" />
              )}
            </div>
          ))}
          {nextPrompt && <p className="text-xs text-amber-300 bg-amber-950/30 border border-amber-900/50 p-2 rounded">Next required detail: {nextPrompt}</p>}
        </fieldset>

        <div>
          <label htmlFor="attempted-workarounds" className="block text-slate-400 text-xs mb-1">What have you already tried? (optional)</label>
          <textarea id="attempted-workarounds" value={attemptedWorkarounds} onChange={event => setAttemptedWorkarounds(event.target.value)} placeholder="List each step on a new line" rows={3} className="field" />
        </div>

        {submitError && <div role="alert" className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">{submitError}</div>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-700 text-slate-300 text-sm font-semibold rounded hover:bg-slate-800">Cancel</button>}
          <button type="submit" disabled={isSubmitting || readinessScore < 100} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded transition">
            {isSubmitting ? 'Creating ticket…' : 'Submit incident'}
          </button>
        </div>
      </form>
    </div>
  );
}
