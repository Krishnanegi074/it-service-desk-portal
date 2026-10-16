'use client';

import { useEffect, useState } from 'react';
import { evaluateITILPriority, type Impact, type Urgency } from '@/lib/priority';

type FieldKey = 'cat' | 'dev' | 'err' | 'imp' | 'urg' | 'sec';
type Part = [text: string, key?: FieldKey, value?: string];
type Example = { id: string; parts: Part[]; u: Urgency; i: Impact };

const EXAMPLES: Example[] = [
  {
    id: 'TK‑20261015‑014', u: 1, i: 3,
    parts: [
      ['vpn', 'cat', 'Network / VPN'], [' keeps kicking me out after login on my '], ['macbook', 'dev', 'macOS'],
      ['. says '], ['AUTH_TIMEOUT', 'err', 'AUTH_TIMEOUT'], ['. '], ['whole design team', 'imp', 'Team · impact 3'],
      [' has it and we '], ['can’t work at all', 'urg', 'Critical · urgency 1'], ['. pwd: '], ['Summer2026!', 'sec', '1 password removed']
    ]
  },
  {
    id: 'TK‑20261015‑015', u: 1, i: 2,
    parts: [
      ['outlook', 'cat', 'Email'], [' stopped syncing on my '], ['windows laptop', 'dev', 'Windows 11'], [' this morning, '],
      ['0x800CCC0E', 'err', '0x800CCC0E'], ['. '], ['all of finance', 'imp', 'Department · impact 2'], [' has it and '],
      ['month-end close is today', 'urg', 'Critical · urgency 1']
    ]
  },
  {
    id: 'TK‑20261015‑016', u: 4, i: 4,
    parts: [
      ['zoom', 'cat', 'Applications'], [' crashes when i share my screen on '], ['mac', 'dev', 'macOS'], [', '],
      ['code 5003', 'err', '5003'], ['. '], ['only me', 'imp', 'One person · impact 4'], [', '], ['no rush', 'urg', 'Low · urgency 4']
    ]
  }
];

const FIELDS: [FieldKey, string][] = [
  ['cat', 'Category'], ['dev', 'Device'], ['err', 'Error'], ['imp', 'Who’s hit'], ['urg', 'Urgency'], ['sec', 'Secrets']
];

type State = { ex: number; typed: number; tagged: number; done: boolean };

function totalChars(ex: Example) {
  return ex.parts.reduce((n, p) => n + p[0].length, 0);
}
function taggedIndexes(ex: Example) {
  return ex.parts.map((p, i) => (p[1] ? i : -1)).filter(i => i >= 0);
}
const complete = (ex: number): State => ({ ex, typed: Infinity, tagged: Infinity, done: true });

/** Hero demo: a free-text report is read and turned into ticket fields. */
export function LiveIntake() {
  const [s, setS] = useState<State>(complete(0));

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) => new Promise<void>(r => { timers.push(window.setTimeout(r, ms)); });

    (async () => {
      await wait(3800);
      for (let n = 1; !cancelled; n++) {
        const exIndex = n % EXAMPLES.length;
        const ex = EXAMPLES[exIndex];
        const total = totalChars(ex);
        for (let c = 0; c <= total && !cancelled; c++) {
          setS({ ex: exIndex, typed: c, tagged: 0, done: false });
          await wait(24 + Math.random() * 30);
        }
        await wait(500);
        const tags = taggedIndexes(ex);
        for (let t = 1; t <= tags.length && !cancelled; t++) {
          setS({ ex: exIndex, typed: Infinity, tagged: t, done: false });
          await wait(420);
        }
        await wait(350);
        if (!cancelled) setS(complete(exIndex));
        await wait(4200);
      }
    })();

    return () => { cancelled = true; timers.forEach(t => clearTimeout(t)); };
  }, []);

  const ex = EXAMPLES[s.ex];
  const tags = taggedIndexes(ex);
  const shownTags = new Set(tags.slice(0, s.tagged === Infinity ? tags.length : s.tagged));
  const typing = s.typed !== Infinity;
  const values: Partial<Record<FieldKey, string>> = {};
  shownTags.forEach(i => { const [, k, v] = ex.parts[i]; if (k && v) values[k] = v; });
  if (s.done && !values.sec) values.sec = 'None found';
  const verdict = s.done ? evaluateITILPriority(ex.u, ex.i) : null;

  const starts = ex.parts.reduce<number[]>((acc, p, i) => [...acc, i === 0 ? 0 : acc[i - 1] + ex.parts[i - 1][0].length], []);
  return (
    <div className="window parser" aria-label="Example: a free-text report being turned into ticket fields">
      <div className="window-bar">
        <span className="label live"><i />Live intake</span>
        <span className="label">{ex.id}</span>
      </div>
      <p className="raw">
        <span className="label who">Employee wrote</span>
        <span>
          {ex.parts.map(([text, key], i) => {
            const visible = typing ? text.slice(0, Math.max(0, s.typed - starts[i])) : text;
            const on = shownTags.has(i);
            const cls = key ? `tk${key === 'urg' ? ' u' : ''}${key === 'sec' ? ' secret' : ''}${on ? ' on' : ''}` : undefined;
            return <span key={i} className={cls}>{on && key === 'sec' ? '[REDACTED_SECRET]' : visible}</span>;
          })}
          {typing && <span className="caret" />}
        </span>
      </p>
      <dl className="fields">
        {FIELDS.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd className={values[key] ? 'got' : undefined}>{values[key] ?? '—'}</dd>
          </div>
        ))}
      </dl>
      <div className="verdict">
        <span className="attrib">
          {verdict
            ? <>Urgency {ex.u} × Impact {ex.i} → <b>{verdict.priority}</b></>
            : <>Reading report <span className="thinking"><i /><i /><i /></span></>}
        </span>
        <span className={`pill ${verdict ? verdict.priority.toLowerCase() : 'wait'}`}>{verdict ? verdict.priority : 'P–'}</span>
      </div>
    </div>
  );
}
