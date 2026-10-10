import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getIncidentById } from '@/lib/db';
import { canViewIncident, getCurrentPrincipal } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function TicketStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const principal = await getCurrentPrincipal();
  if (!principal) redirect(`/login?next=${encodeURIComponent(`/tickets/${id}`)}`);
  const incident = await getIncidentById(id);
  if (!incident || !canViewIncident(principal, incident)) notFound();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <nav className="mb-5 flex items-center justify-between"><Link href="/" className="text-sm text-slate-400 hover:text-white">← Service desk home</Link><form action="/auth/signout" method="post"><button type="submit" className="text-sm text-slate-400 hover:text-white">Sign out</button></form></nav>
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-800 pb-5">
            <div><p className="text-xs uppercase tracking-wider text-slate-400">Ticket status</p><h1 className="mt-2 text-2xl font-bold">{incident.title}</h1><p className="mt-2 font-mono text-xs text-slate-400 break-all">{incident.id}</p></div>
            <div className="flex gap-2"><span className="rounded bg-slate-800 px-3 py-1 text-sm font-bold">{incident.priority}</span><span className="rounded bg-indigo-950 border border-indigo-800 px-3 py-1 text-sm capitalize text-indigo-300">{incident.status.replace('_', ' ')}</span></div>
          </div>
          <div className="mt-6 grid sm:grid-cols-2 gap-5">
            <div><h2 className="text-xs uppercase tracking-wider text-slate-400">Description</h2><p className="mt-2 text-sm leading-6 text-slate-300">{incident.summary}</p></div>
            <div><h2 className="text-xs uppercase tracking-wider text-slate-400">Technical context</h2><dl className="mt-2 space-y-2 text-sm"><div><dt className="text-slate-400">Category</dt><dd>{incident.category}</dd></div><div><dt className="text-slate-400">System</dt><dd>{incident.technicalContext.operatingSystem}</dd></div><div><dt className="text-slate-400">Application/device</dt><dd>{incident.technicalContext.affectedApp}</dd></div></dl></div>
          </div>
          <div className="mt-7 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">Refresh this page to see the latest status. Status email notifications are planned for a later phase.</div>
        </section>
      </div>
    </main>
  );
}
