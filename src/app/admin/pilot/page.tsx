import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentPrincipal } from '@/lib/auth';
import { getPilotMetrics } from '@/lib/db';

export const dynamic = 'force-dynamic';

function metricValue(value: number | null, suffix = '') {
  return value === null ? 'No data' : `${value}${suffix}`;
}

export default async function PilotMetricsPage() {
  const principal = await getCurrentPrincipal();
  if (!principal) redirect('/login?next=/admin/pilot');
  if (principal.role !== 'admin') redirect('/unauthorized');
  const metrics = await getPilotMetrics();
  const cards = [
    ['Submitted incidents', String(metrics.incidentCount), 'Pilot sample size'],
    ['Diagnostic completeness', metricValue(metrics.averageCompleteness, '%'), 'Average at submission'],
    ['Assigned incidents', metricValue(metrics.assignmentRate, '%'), 'Share assigned at least once'],
    ['Median assignment time', metricValue(metrics.medianAssignmentMinutes, ' min'), 'Submission to first assignment'],
    ['Resolved incidents', metricValue(metrics.resolutionRate, '%'), 'Share currently resolved'],
    ['Jira delivery failures', metricValue(metrics.deliveryFailureRate, '%'), 'Current failed delivery records'],
    ['Routing accuracy', metricValue(metrics.routingAccuracyRate, '%'), 'Engineer-confirmed accurate routing'],
    ['Clarification contacts', metricValue(metrics.averageClarifications), 'Average employee follow-ups'],
    ['Intake abandonment', metricValue(metrics.abandonmentRate, '%'), 'Started 15+ minutes ago and incomplete']
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/console" className="text-slate-400 hover:text-white">← Engineer console</Link>
          <div className="flex items-center gap-4"><Link href="/admin/retention" className="text-slate-400 hover:text-white">Retention controls</Link><span className="text-slate-400">{principal.fullName} · administrator</span></div>
        </nav>

        <header className="mt-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-400">Pilot evidence</p>
          <h1 className="mt-2 text-3xl font-bold">Service-desk outcome dashboard</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Use these measures during a controlled pilot. Routing and clarification measures appear only after engineers save quality feedback on incident records.
          </p>
        </header>

        {metrics.incidentCount < 10 && (
          <div role="note" className="mt-6 rounded-lg border border-amber-900 bg-amber-950/30 p-4 text-sm text-amber-200">
            The sample is still small. Treat these figures as operational signals, not conclusions, until at least 10 representative incidents have been reviewed.
          </div>
        )}

        <section aria-label="Pilot metrics" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(([label, value, explanation]) => (
            <article key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</h2>
              <p className="mt-3 text-3xl font-bold text-slate-100">{value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{explanation}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Priority distribution</h2>
            <dl className="mt-4 space-y-3">{Object.entries(metrics.priorityCounts).map(([key, value]) => <div key={key} className="flex justify-between border-b border-slate-800 pb-2 text-sm"><dt className="text-slate-400">{key}</dt><dd className="font-mono">{value}</dd></div>)}</dl>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Workflow distribution</h2>
            <dl className="mt-4 space-y-3">{Object.entries(metrics.statusCounts).map(([key, value]) => <div key={key} className="flex justify-between border-b border-slate-800 pb-2 text-sm"><dt className="capitalize text-slate-400">{key.replace('_', ' ')}</dt><dd className="font-mono">{value}</dd></div>)}</dl>
          </div>
        </section>

        <p className="mt-6 text-xs text-slate-400">
          Intake sessions tracked: {metrics.intakeStarted}; completed: {metrics.intakeCompleted}; incidents with engineer feedback: {metrics.feedbackCoverage}%.
        </p>
      </div>
    </main>
  );
}
