import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getIncidentById } from '@/lib/db';
import { canViewIncident, getCurrentPrincipal } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function IncidentSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const principal = await getCurrentPrincipal();
  if (!principal) redirect(`/login?next=${encodeURIComponent(`/report/${id}/success`)}`);
  const incident = await getIncidentById(id);
  if (!incident || !canViewIncident(principal, incident)) notFound();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-16">
      <div className="max-w-2xl mx-auto rounded-2xl border border-emerald-900 bg-slate-900 p-6 sm:p-9 shadow-2xl">
        <div className="h-12 w-12 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center text-xl">✓</div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-emerald-400">Incident created</p>
        <h1 className="mt-2 text-2xl font-bold">Your issue has been sent to the IT queue.</h1>
        <p className="mt-3 text-slate-400">Keep the incident ID below. You can use it to return to the status page.</p>

        <dl className="mt-7 rounded-xl border border-slate-800 bg-slate-950 divide-y divide-slate-800">
          <div className="p-4"><dt className="text-xs text-slate-400">Incident ID</dt><dd className="mt-1 font-mono text-sm break-all text-slate-200">{incident.id}</dd></div>
          <div className="p-4"><dt className="text-xs text-slate-400">Priority</dt><dd className="mt-1 font-semibold">{incident.priority}</dd></div>
          <div className="p-4"><dt className="text-xs text-slate-400">Status</dt><dd className="mt-1 capitalize">{incident.status.replace('_', ' ')}</dd></div>
          <div className="p-4"><dt className="text-xs text-slate-400">Issue</dt><dd className="mt-1 font-medium">{incident.title}</dd><dd className="mt-2 text-sm text-slate-400">{incident.summary}</dd></div>
        </dl>

        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <Link href={`/tickets/${incident.id}`} className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-center font-semibold transition">View ticket status</Link>
          <Link href="/report" className="rounded-lg border border-slate-700 hover:bg-slate-800 px-4 py-2.5 text-center text-slate-300 transition">Report another issue</Link>
        </div>
      </div>
    </main>
  );
}
