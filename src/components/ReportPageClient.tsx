'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { isPlaceholderName } from '@/lib/display-name';
import IncidentIntakeForm from '@/components/IncidentIntakeForm';

export default function ReportPageClient({
  currentUser
}: {
  currentUser: { fullName: string; email: string };
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(currentUser.fullName);
  const needsName = isPlaceholderName(fullName, currentUser.email);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <nav className="mb-5 flex justify-between items-center text-sm">
          <Link href="/" className="text-slate-400 hover:text-white">← Service desk home</Link>
          <div className="flex items-center gap-3">
            <Link href="/console" className="text-slate-400 hover:text-slate-200">Engineer console</Link>
            <form action="/auth/signout" method="post"><button type="submit" className="text-slate-400 hover:text-slate-200">Sign out</button></form>
          </div>
        </nav>
        {needsName ? <NamePrompt onSaved={setFullName} /> : null}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-2xl">
          <IncidentIntakeForm
            key={fullName}
            initialReporter={{ ...currentUser, fullName }}
            onSuccess={incident => router.push(`/report/${incident.id}/success`)}
          />
        </div>
      </div>
    </main>
  );
}

function NamePrompt({ onSaved }: { onSaved: (name: string) => void }) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setStatus('saving');
    setMessage('');
    try {
      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: value })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Your name could not be saved.');
      onSaved(result.data.fullName);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Your name could not be saved.');
    }
  }

  return (
    <form onSubmit={save} className="mb-4 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-4 sm:p-5">
      <label htmlFor="display-name" className="block text-sm font-semibold text-white">What should the IT team call you?</label>
      <p className="mt-1 text-sm text-slate-300">This name appears on every ticket you report. You only need to set it once.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id="display-name"
          value={value}
          onChange={event => setValue(event.target.value)}
          autoComplete="name"
          placeholder="Your full name"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          type="submit"
          disabled={status === 'saving' || value.trim().length < 2}
          className="rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
        >
          {status === 'saving' ? 'Saving…' : 'Save name'}
        </button>
      </div>
      {message ? <p role="alert" className="mt-2 text-sm text-rose-300">{message}</p> : null}
    </form>
  );
}
