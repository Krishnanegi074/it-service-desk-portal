'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import type { AuthPrincipal } from '@/lib/auth';
import type { AppUserSummary, IncidentPayload, IncidentStatus } from '@/lib/schema';
import PreTriageModal from '@/components/PreTriageModal';
import IncidentDetailDrawer from '@/components/IncidentDetailDrawer';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const initialPagination: PaginationState = { page: 1, limit: 12, total: 0, totalPages: 0 };

interface QueueFilters {
  query: string;
  priority: string;
  status: string;
  assigneeId: string;
}

export default function OperationsDashboard({
  currentUser,
  initialIncidents,
  initialStaff,
  initialPagination: suppliedPagination
}: {
  currentUser: AuthPrincipal;
  initialIncidents: IncidentPayload[];
  initialStaff: AppUserSummary[];
  initialPagination: PaginationState;
}) {
  const [incidents, setIncidents] = useState<IncidentPayload[]>(initialIncidents);
  const [staff] = useState<AppUserSummary[]>(initialStaff);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [pagination, setPagination] = useState(suppliedPagination ?? initialPagination);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentPayload | null>(null);

  async function fetchIncidents(
    page = pagination.page,
    filters: QueueFilters = { query, priority, status, assigneeId }
  ) {
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(pagination.limit) });
    if (filters.query) params.set('q', filters.query);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.status) params.set('status', filters.status);
    if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);

    try {
      const response = await fetch(`/api/incidents?${params}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || 'Unable to load incidents.');
      setIncidents(body.data);
      setPagination(body.pagination);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load incidents.');
    } finally {
      setLoading(false);
    }
  }

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = queryInput.trim();
    setQuery(nextQuery);
    void fetchIncidents(1, { query: nextQuery, priority, status, assigneeId });
  }

  function resetFilters() {
    setQueryInput('');
    setQuery('');
    setPriority('');
    setStatus('');
    setAssigneeId('');
    void fetchIncidents(1, { query: '', priority: '', status: '', assigneeId: '' });
  }

  function selectFilter(key: keyof Omit<QueueFilters, 'query'>, value: string) {
    const nextFilters = { query, priority, status, assigneeId, [key]: value };
    if (key === 'priority') setPriority(value);
    if (key === 'status') setStatus(value);
    if (key === 'assigneeId') setAssigneeId(value);
    void fetchIncidents(1, nextFilters);
  }

  const activeFilters = Boolean(query || priority || status || assigneeId);

  return (
    <main className="min-h-screen bg-slate-950 p-4 font-sans text-slate-100 sm:p-8">
      <header className="mx-auto mb-8 flex max-w-7xl flex-col gap-4 border-b border-slate-800 pb-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">IT Pre-Triage Engineering Console</h1>
            <span className="rounded border border-emerald-800 bg-emerald-950 px-2 py-0.5 font-mono text-xs text-emerald-400">v2-fullstack</span>
          </div>
          <p className="mt-1 text-sm text-slate-400">Searchable queue • Audited ownership • Resolver-ready diagnostics</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs text-slate-400">{currentUser.fullName} · {currentUser.role}</span>
          <Link href="/" className="rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800">Home</Link>
          <Link href="/report" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-medium text-white shadow-md transition hover:bg-indigo-500">Employee report form</Link>
          {currentUser.role === 'admin' && <Link href="/admin/pilot" className="rounded-lg border border-indigo-700 px-4 py-2.5 text-xs font-medium text-indigo-300 transition hover:bg-indigo-950">Pilot metrics</Link>}
          {currentUser.role === 'admin' && <Link href="/admin/retention" className="rounded-lg border border-amber-800 px-4 py-2.5 text-xs font-medium text-amber-300 transition hover:bg-amber-950">Security controls</Link>}
          <button onClick={() => setIsModalOpen(true)} className="rounded-lg border border-indigo-700 px-4 py-2.5 text-xs font-medium text-indigo-300 transition hover:bg-indigo-950">+ Quick intake</button>
          <form action="/auth/signout" method="post"><button type="submit" className="rounded-lg border border-slate-800 px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-900">Sign out</button></form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-5">
        <section aria-label="Incident queue filters" className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <form onSubmit={applySearch} className="flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 gap-2">
              <input value={queryInput} onChange={event => setQueryInput(event.target.value)} aria-label="Search incidents" placeholder="Search ID, title, reporter, category…" className="field" />
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 text-sm font-semibold hover:bg-indigo-500">Search</button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-[36rem]">
              <select aria-label="Filter by priority" value={priority} onChange={event => selectFilter('priority', event.target.value)} className="field text-sm"><option value="">All priorities</option>{['P1', 'P2', 'P3', 'P4'].map(value => <option key={value} value={value}>{value}</option>)}</select>
              <select aria-label="Filter by status" value={status} onChange={event => selectFilter('status', event.target.value)} className="field text-sm"><option value="">All statuses</option>{(['open', 'in_triage', 'dispatched', 'resolved'] as IncidentStatus[]).map(value => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select>
              <select aria-label="Filter by assignee" value={assigneeId} onChange={event => selectFilter('assigneeId', event.target.value)} className="field text-sm"><option value="">All assignees</option>{staff.map(member => <option key={member.id} value={member.id}>{member.fullName}</option>)}</select>
            </div>
          </form>
          {activeFilters && <button type="button" onClick={resetFilters} className="mt-3 text-xs text-slate-400 underline underline-offset-4 hover:text-white">Clear all filters</button>}
        </section>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-lg font-semibold text-slate-200">Live Intake Queue</h2><p className="text-xs text-slate-400">{pagination.total} matching incident{pagination.total === 1 ? '' : 's'}</p></div>
          {pagination.totalPages > 1 && <div className="flex items-center gap-2 text-xs"><button type="button" disabled={pagination.page <= 1 || loading} onClick={() => void fetchIncidents(pagination.page - 1)} className="rounded border border-slate-700 px-3 py-1.5 disabled:opacity-40">Previous</button><span className="text-slate-400">Page {pagination.page} of {pagination.totalPages}</span><button type="button" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => void fetchIncidents(pagination.page + 1)} className="rounded border border-slate-700 px-3 py-1.5 disabled:opacity-40">Next</button></div>}
        </div>

        {loading ? (
          <p className="text-sm text-slate-400" role="status">Loading incident queue…</p>
        ) : loadError ? (
          <div role="alert" className="rounded-lg border border-red-900 bg-red-950/30 p-5 text-sm text-red-300"><p>{loadError}</p><button onClick={() => fetchIncidents()} className="mt-3 underline underline-offset-4">Try again</button></div>
        ) : incidents.length === 0 ? (
          <div className="space-y-3 rounded-lg border border-dashed border-slate-800 p-12 text-center text-sm text-slate-400"><p>No incidents match these filters.</p>{activeFilters ? <button type="button" onClick={resetFilters} className="text-indigo-400 underline underline-offset-4">Clear filters</button> : <button type="button" onClick={() => setIsModalOpen(true)} className="text-indigo-400 underline underline-offset-4">Launch pre-triage intake</button>}</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {incidents.map(item => (
              <button type="button" key={item.id} onClick={() => setSelectedIncident(item)} className="flex min-h-56 flex-col justify-between rounded-lg border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-indigo-500/60 focus:border-indigo-500 focus:outline-none">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2"><span className={`rounded px-2 py-0.5 text-xs font-bold ${item.priority === 'P1' ? 'border border-red-800 bg-red-950 text-red-400' : item.priority === 'P2' ? 'border border-amber-800 bg-amber-950 text-amber-400' : item.priority === 'P3' ? 'border border-blue-800 bg-blue-950 text-blue-400' : 'bg-slate-800 text-slate-300'}`}>{item.priority}</span><span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs uppercase text-slate-400">{item.status.replace('_', ' ')}</span><span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{item.category}</span></div>
                  <h3 className="font-semibold text-slate-100">{item.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-400">{item.summary}</p>
                </div>
                <div className="mt-4 space-y-2 border-t border-slate-800/60 pt-3 text-xs"><div className="flex justify-between text-slate-400"><span>{item.assignedTo ? `Assigned: ${item.assignedTo.fullName}` : 'Unassigned'}</span><span className="font-mono text-emerald-400">{item.readinessScore}% ready</span></div><div className="truncate font-mono text-slate-400">{item.id}</div></div>
              </button>
            ))}
          </div>
        )}
      </div>

      <PreTriageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onIncidentCreated={() => fetchIncidents(1)} currentUser={currentUser} />
      <IncidentDetailDrawer incident={selectedIncident} staff={staff} onClose={() => setSelectedIncident(null)} onChanged={async incident => { setSelectedIncident(incident); await fetchIncidents(); }} />
    </main>
  );
}
