'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * "How it works" as a scroll-driven story: the section pins while the reader
 * scrolls, and each scroll step plays the next moment of a real intake —
 * the employee's message, the playbook questions, redaction, priority, and
 * the hand-off to Jira. Without JavaScript, on small screens, or with reduced
 * motion, the whole conversation is shown at once.
 */

type Event =
  | { kind: 'user'; text: string; typed?: boolean }
  | { kind: 'bot'; text: string }
  | { kind: 'warn'; text: string }
  | { kind: 'sys'; done: string; doing: string; detail?: string }
  | { kind: 'ticket' };

const EVENTS: { step: number; event: Event }[] = [
  { step: 0, event: { kind: 'user', text: 'VPN keeps kicking me out after I log in. Whole design team has it.', typed: true } },
  { step: 1, event: { kind: 'sys', doing: 'Matching a playbook…', done: 'Playbook matched', detail: 'Network / VPN · 3 questions' } },
  { step: 1, event: { kind: 'bot', text: 'Which operating system are you using?' } },
  { step: 1, event: { kind: 'user', text: 'macOS' } },
  { step: 1, event: { kind: 'bot', text: 'Home Wi‑Fi, office Ethernet, or a mobile hotspot?' } },
  { step: 1, event: { kind: 'user', text: 'Home Wi‑Fi' } },
  { step: 1, event: { kind: 'bot', text: 'What exact error does the VPN show?' } },
  { step: 2, event: { kind: 'user', text: 'AUTH_TIMEOUT. password: Summer2026!' } },
  { step: 2, event: { kind: 'warn', text: 'Never share passwords here. We removed it before saving your report.' } },
  { step: 2, event: { kind: 'sys', doing: 'Scoring priority…', done: 'Priority set', detail: 'Urgency 1 × Impact 3 → P2' } },
  { step: 3, event: { kind: 'ticket' } },
  { step: 3, event: { kind: 'sys', doing: 'Sending to Jira…', done: 'Delivered to Jira', detail: 'ITSD‑482 · Network team' } }
];

const STEPS = [
  { n: '01', title: 'Listen', body: 'The employee describes the problem in their own words and picks what it’s closest to.' },
  { n: '02', title: 'Guide', body: 'A playbook for that issue asks only the questions an engineer would ask first.' },
  { n: '03', title: 'Structure', body: 'Impact and urgency map to a fixed P1–P4 matrix. Passwords and keys are removed before anything is saved.' },
  { n: '04', title: 'Hand off', body: 'The ticket lands in the engineer queue and, if you use it, in Jira Service Management.' }
];

const TOTAL = EVENTS.length;

export function ScrollStory() {
  const trackRef = useRef<HTMLDivElement>(null);
  // null = static mode (everything shown); a number = scroll-driven progress in events.
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wide = window.matchMedia('(min-width: 961px)');
    let frame = 0;

    const measure = () => {
      frame = 0;
      if (reduce.matches || !wide.matches) {
        setProgress(null);
        return;
      }
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 1;
      // Leave a little room at both ends so the first message is visible on arrival
      // and the finished ticket rests on screen before the section releases.
      setProgress(1.15 + ratio * TOTAL);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    reduce.addEventListener('change', onScroll);
    wide.addEventListener('change', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      reduce.removeEventListener('change', onScroll);
      wide.removeEventListener('change', onScroll);
    };
  }, []);

  const shown = progress === null ? TOTAL : Math.floor(progress);
  const partial = progress === null ? 1 : progress - Math.floor(progress);
  const activeStep = progress === null ? -1 : EVENTS[Math.max(0, Math.min(TOTAL - 1, shown - 1))].step;
  const redacted = shown > 8; // after the warning appears, the password in the reply is replaced
  const percent = Math.round((Math.min(shown, TOTAL) / TOTAL) * 100);

  return (
    <section className="block story" id="how" aria-labelledby="how-title" data-mode={progress === null ? 'static' : 'scroll'}>
      <div className="story-track" ref={trackRef}>
        <div className="story-pin">
          <div className="rail split story-grid">
            <div>
              <span className="label">How it works</span>
              <h2 className="h2" id="how-title" data-no-reveal style={{ marginTop: '18px' }}>Four steps. <em>Zero</em> back‑and‑forth.</h2>
              <ol className="steps">
                {STEPS.map((step, index) => (
                  <li key={step.n} className={activeStep === index ? 'active' : activeStep > index ? 'done' : undefined}>
                    <span className="n">{step.n}</span>
                    <div><h3>{step.title}</h3><p>{step.body}</p></div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="aura">
            <div className="window story-window" role="img" aria-label="Example: a vague VPN report becomes a P2 ticket delivered to Jira">
              <div className="window-bar">
                <div className="dots"><i /><i /><i /></div>
                <span className="label">Report an issue · Network / VPN</span>
                <span className="label">{percent}%</span>
              </div>
              <div className="story-chat">
                <div className="story-feed">
                  {EVENTS.map(({ event }, index) => {
                    if (index >= shown) return null;
                    const isLast = index === shown - 1;
                    return <StoryEvent key={index} event={event} live={isLast && progress !== null} partial={partial} redacted={redacted && index === 7} />;
                  })}
                </div>
              </div>
              <div className="story-input">
                <span>{shown >= TOTAL ? 'Ticket sent. You can close this window.' : 'Type your answer…'}</span>
                <span className="send" aria-hidden="true">↑</span>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryEvent({ event, live, partial, redacted }: { event: Event; live: boolean; partial: number; redacted: boolean }) {
  switch (event.kind) {
    case 'user': {
      const text = redacted ? 'AUTH_TIMEOUT. password: [REDACTED_SECRET]' : event.text;
      const visible = event.typed && live ? text.slice(0, Math.max(1, Math.round(text.length * Math.min(1, partial * 1.6)))) : text;
      return <div className="msg user story-in">{visible}{event.typed && live && visible.length < text.length ? <span className="caret" /> : null}</div>;
    }
    case 'bot':
      return <div className="msg bot story-in"><span className="label">Triage Portal</span>{event.text}</div>;
    case 'warn':
      return <div className="msg warn story-in"><span className="label">Heads up</span>{event.text}</div>;
    case 'sys': {
      const done = !live || partial > 0.45;
      return (
        <div className="story-sys story-in">
          <span className={done ? 'tick' : 'spin'} aria-hidden="true" />
          <b>{done ? event.done : event.doing}</b>
          {done && event.detail ? <span className="mono">{event.detail}</span> : null}
        </div>
      );
    }
    case 'ticket':
      return (
        <div className="ticket story-in">
          <div className="ticket-head"><span className="label">TK‑20261015‑014</span><span className="pill p2">P2 · High</span></div>
          <h4>VPN disconnects after authentication</h4>
          <dl className="kv">
            <div><dt>Device</dt><dd>macOS</dd></div>
            <div><dt>Network</dt><dd>Home Wi‑Fi</dd></div>
            <div><dt>Error</dt><dd>AUTH_TIMEOUT</dd></div>
          </dl>
        </div>
      );
  }
}
