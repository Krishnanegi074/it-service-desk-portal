'use client';

import { useMemo, useState } from 'react';
import { PLAYBOOK_CATALOG, type PlaybookStatus } from '@/lib/playbook-catalog';
import { siteConfig } from '@/lib/site-config';

const STATUS: Record<PlaybookStatus, [label: string, cls: string]> = {
  included: ['Included', 'ok'],
  soon: ['Coming soon', 'soon'],
  pack: ['Industry pack', 'pack']
};
const STATUS_FILTERS: [PlaybookStatus | 'all', string][] = [
  ['all', 'Any status'], ['included', 'Included'], ['soon', 'Coming soon'], ['pack', 'Industry packs']
];

export function PlaybookLibrary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState<PlaybookStatus | 'all'>('all');

  const categories = useMemo(() => ['All', ...new Set(PLAYBOOK_CATALOG.map(p => p.category))], []);
  const list = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return PLAYBOOK_CATALOG.filter(p =>
      (category === 'All' || p.category === category) &&
      (status === 'all' || p.status === status) &&
      words.every(w => [p.name, p.category, p.description, p.example, ...p.questions].join(' ').toLowerCase().includes(w))
    );
  }, [query, category, status]);

  return (
    <>
      <div className="toolbar">
        <label className="search" htmlFor="pb-q">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <span className="sr-only">Search playbooks</span>
          <input id="pb-q" type="search" placeholder="Search playbooks, e.g. printer, MFA, Outlook" autoComplete="off" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <div className="chip-row" role="group" aria-label="Filter by category">
          {categories.map(c => (
            <button key={c} type="button" className="fchip" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}<small>{c === 'All' ? PLAYBOOK_CATALOG.length : PLAYBOOK_CATALOG.filter(p => p.category === c).length}</small>
            </button>
          ))}
        </div>
        <div className="chip-row" role="group" aria-label="Filter by availability">
          {STATUS_FILTERS.map(([v, l]) => (
            <button key={v} type="button" className="fchip" aria-pressed={status === v} onClick={() => setStatus(v)}>{l}</button>
          ))}
        </div>
      </div>

      <p className="count-line" aria-live="polite" style={{ marginTop: 40 }}>Showing {list.length} of {PLAYBOOK_CATALOG.length} playbooks</p>
      <div className="lib">
        {list.length ? list.map(p => {
          const [label, cls] = STATUS[p.status];
          return (
            <article className="pb" key={p.name}>
              <div className="top"><span className="label">{p.category}</span><span className={`pill ${cls}`}>{label}</span></div>
              <h3>{p.name}</h3>
              <p className="desc">{p.description}</p>
              <div className="meta"><span>{p.questions.length} questions</span><span>Usually {p.priorityRange}</span></div>
              <details>
                <summary>{p.status === 'included' ? 'See the questions' : 'See draft questions'}</summary>
                <ol>{p.questions.map(q => <li key={q}>{q}</li>)}</ol>
                <div className="sample">Example ticket: {p.example}</div>
              </details>
            </article>
          );
        }) : (
          <div className="empty">
            No playbooks match “{query}”. Try a different word, or{' '}
            <a href={siteConfig.requestPlaybookUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>request one</a>.
          </div>
        )}
      </div>
    </>
  );
}
