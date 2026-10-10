import Link from 'next/link';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { getCurrentPrincipal, sanitizeNextPath } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = sanitizeNextPath(next, '/report');
  const principal = await getCurrentPrincipal();
  if (principal) redirect(nextPath);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-14 text-slate-100">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">← Service desk home</Link>
        <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-400">Secure access</p>
          <h1 className="mt-3 text-2xl font-bold">Sign in to the IT service desk</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            We use a one-time email link, so there is no service-desk password to create or remember.
          </p>
          <LoginForm configured={isSupabaseConfigured()} nextPath={nextPath} />
          <p className="mt-5 text-xs leading-5 text-slate-400">
            Access is limited to accounts provisioned by your organization. The sign-in link can only be used once.
          </p>
        </section>
      </div>
    </main>
  );
}
