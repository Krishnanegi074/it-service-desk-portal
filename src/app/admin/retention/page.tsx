import Link from 'next/link';
import { redirect } from 'next/navigation';
import SecurityRetentionPanel from '@/components/SecurityRetentionPanel';
import { getCurrentPrincipal } from '@/lib/auth';
import { previewIncidentRetention } from '@/lib/db';
import { calculateRetentionCutoff, getIncidentRetentionDays, RETENTION_CONFIRMATION } from '@/lib/retention';

export const dynamic = 'force-dynamic';

export default async function RetentionAdminPage() {
  const principal = await getCurrentPrincipal();
  if (!principal) redirect('/login?next=/admin/retention');
  if (principal.role !== 'admin') redirect('/unauthorized');
  const retentionDays = getIncidentRetentionDays();
  const preview = await previewIncidentRetention(calculateRetentionCutoff(retentionDays));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <nav className="flex items-center justify-between text-sm"><Link href="/console" className="text-slate-400 hover:text-white">← Engineer console</Link><span className="text-slate-400">{principal.fullName} · administrator</span></nav>
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-400">Security administration</p>
          <h1 className="mt-3 text-3xl font-bold">Incident data retention</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Review the active retention policy before permanently removing expired service-desk records.</p>
          <div className="mt-8"><SecurityRetentionPanel initialPreview={{ ...preview, retentionDays, confirmationPhrase: RETENTION_CONFIRMATION }} /></div>
        </section>
      </div>
    </main>
  );
}
