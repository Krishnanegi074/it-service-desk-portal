'use client';

import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface LoginFormProps {
  configured: boolean;
  nextPath: string;
}

export default function LoginForm({ configured, nextPath }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('next', nextPath);

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl.toString(),
          shouldCreateUser: false
        }
      });

      if (signInError) throw signInError;
      setMessage('Check your work email for a one-time sign-in link.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to send the sign-in link.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-4">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-slate-300">Work email</label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="you@company.com"
          disabled={!configured || isSubmitting}
          className="field mt-2"
        />
      </div>
      {!configured && (
        <div role="alert" className="rounded-lg border border-amber-900 bg-amber-950/30 p-3 text-sm text-amber-200">
          Authentication is not configured. Add the Supabase URL and publishable key to the environment before signing in.
        </div>
      )}
      {error && <div role="alert" className="rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
      {message && <div role="status" className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-300">{message}</div>}
      <button
        type="submit"
        disabled={!configured || isSubmitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? 'Sending secure link…' : 'Email me a sign-in link'}
      </button>
    </form>
  );
}
