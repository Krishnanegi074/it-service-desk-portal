'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { evaluateITILPriority, type Impact, type Urgency } from '@/lib/priority';

const TABS = [
  { title: 'Explainable priority', tag: 'P1–P4', body: 'Impact × urgency on a fixed ITIL matrix. Engineers can see exactly how every priority was decided. Try it on the right.' },
  { title: 'Credential redaction', tag: 'Security', body: 'Passwords, tokens, private keys and connection strings are removed on the server before storage.' },
  { title: 'Engineer queue', tag: 'Console', body: 'Search, filter by priority or assignee, assign, add internal notes, and see how complete each ticket is.' },
  { title: 'Jira delivery', tag: 'Integration', body: 'One Jira request per incident, with safe retries and status that syncs back. Optional, not required.' }
];
const URGENCY = ['Critical', 'High', 'Medium', 'Low'];
const IMPACT = ['Company', 'Department', 'Team', 'One person'];
const TOUR: [Urgency, Impact][] = [[2, 2], [1, 1], [3, 4], [4, 4], [2, 3], [1, 3]];
const LEVELS = [1, 2, 3, 4] as const;

function Bar({ left, right }: { left: string; right: React.ReactNode }) {
  return (
    <div className="window-bar">
      <div className="dots"><i /><i /><i /></div>
      <span className="label">{left}</span>
      {right}
    </div>
  );
}

function Matrix() {
  const [u, setU] = useState<Urgency>(1);
  const [im, setIm] = useState<Impact>(3);
  const touched = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    const id = window.setInterval(() => {
      if (touched.current || document.hidden) return;
      const [nu, ni] = TOUR[i++ % TOUR.length];
      setU(nu); setIm(ni);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const pick = (fn: () => void) => { touched.current = true; fn(); };
  const result = evaluateITILPriority(u, im);

  return (
    <div className="panel matrix-wrap">
      <div className="controls">
        <div>
          <span className="label">Urgency</span>
          <div className="seg" role="group" aria-label="Urgency, 1 is most urgent">
            {LEVELS.map(n => (
              <button key={n} type="button" title={URGENCY[n - 1]} aria-label={`${n} ${URGENCY[n - 1]}`} aria-pressed={u === n} onClick={() => pick(() => setU(n))}>{n}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="label">Impact</span>
          <div className="seg" role="group" aria-label="Impact, 1 is company-wide">
            {LEVELS.map(n => (
              <button key={n} type="button" title={IMPACT[n - 1]} aria-label={`${n} ${IMPACT[n - 1]}`} aria-pressed={im === n} onClick={() => pick(() => setIm(n))}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid4" aria-hidden="true">
        <div className="h">U \ I</div>
        {LEVELS.map(c => <div key={`h${c}`} className="h">{c}</div>)}
        {LEVELS.map(r => [
          <div key={`r${r}`} className="h">U{r}</div>,
          ...LEVELS.map(c => {
            const p = evaluateITILPriority(r, c).priority;
            return <div key={`${r}${c}`} className={`c ${p.toLowerCase()}${r === u && c === im ? ' on' : ''}`}>{p}</div>;
          })
        ])}
      </div>
      <div className="attrib" aria-live="polite">
        Urgency {u} ({URGENCY[u - 1]}) × Impact {im} ({IMPACT[im - 1]}) → <b>{result.priority}</b>
      </div>
    </div>
  );
}

export function ProductShowcase() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, k: number) => {
    const next = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? (k + 1) % TABS.length
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? (k + TABS.length - 1) % TABS.length : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="features">
      <div className="tabs" role="tablist" aria-label="Product features">
        {TABS.map((t, k) => (
          <button
            key={t.title}
            ref={el => { tabRefs.current[k] = el; }}
            className="tab"
            role="tab"
            id={`t-${k}`}
            aria-controls={`p-${k}`}
            aria-selected={active === k}
            tabIndex={active === k ? 0 : -1}
            onClick={() => setActive(k)}
            onKeyDown={e => onKey(e, k)}
          >
            <span className="t"><span>{t.title}</span><span>{t.tag}</span></span>
            <p>{t.body}</p>
          </button>
        ))}
      </div>

      <div className="stage annotated">

        <div className="window" id="p-0" role="tabpanel" aria-labelledby="t-0" hidden={active !== 0}>
          <Bar left="Priority matrix" right={<span className="label">ITIL 4×4</span>} />
          <Matrix />
        </div>

        <div className="window" id="p-1" role="tabpanel" aria-labelledby="t-1" hidden={active !== 1}>
          <Bar left="Sanitizer" right={<span className="pill ok">3 removed</span>} />
          <div className="panel">
            <div className="code">
              {'Error: AUTH_TIMEOUT after login\npassword: '}<span className="r">Summer2026!</span>
              {'\ntried token '}<span className="r">ghp_8f2kQxAbCd…Lm91</span>
              {'\ndb='}<span className="r">postgres://admin:hunter2@10.0.4.12</span>
            </div>
            <div className="arrow-down">↓ saved as</div>
            <div className="code">
              {'Error: AUTH_TIMEOUT after login\npassword: '}<span className="g">[REDACTED_SECRET]</span>
              {'\ntried token '}<span className="g">[REDACTED_SOURCE_CONTROL_TOKEN]</span>
              {'\ndb='}<span className="g">[REDACTED_CONNECTION_STRING]</span>
            </div>
          </div>
        </div>

        <div className="window" id="p-2" role="tabpanel" aria-labelledby="t-2" hidden={active !== 2}>
          <Bar left="Engineer console" right={<span className="label">4 open</span>} />
          <div className="panel queue">
            <div className="searchbar"><span>Search incidents…</span><span className="label">P1–P2 · Unassigned</span></div>
            {[['P1', 'SSO unavailable across Finance', '100%'], ['P2', 'VPN disconnects after authentication', '100%'], ['P3', 'Outlook search returns no results', '67%'], ['P4', 'Dock not detecting second display', '100%']].map(([p, title, ready]) => (
              <div key={title} className="row"><span className={`pill ${p.toLowerCase()}`}>{p}</span><span>{title}</span><small>{ready}</small></div>
            ))}
          </div>
        </div>

        <div className="window" id="p-3" role="tabpanel" aria-labelledby="t-3" hidden={active !== 3}>
          <Bar left="TK‑20261015‑014" right={<span className="label">Jira IT‑482</span>} />
          <div className="panel">
            <ol className="timeline">
              <li><i className="a" /><span>Incident created · P2</span><small>09:41</small></li>
              <li><i /><span>Jira request IT‑482 created</span><small>09:41</small></li>
              <li><i /><span>Assigned to Network team</span><small>09:44</small></li>
              <li><i /><span>Internal note added</span><small>09:52</small></li>
              <li><i className="g" /><span>Jira status synced · In progress</span><small>09:53</small></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
