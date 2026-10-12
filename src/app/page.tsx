import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  KeyRound,
  LockKeyhole,
  MessageSquareText,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  TimerReset,
  UsersRound,
  Workflow
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Triage Portal — Better IT tickets start here',
  description:
    'Guided IT incident intake that turns incomplete requests into secure, prioritized, resolver-ready tickets.'
};

const workflowSteps = [
  {
    number: '01',
    label: 'Listen',
    title: 'Start with what the employee knows.',
    description: 'A simple, plain-language report captures the issue without asking people to understand IT ticket fields.'
  },
  {
    number: '02',
    label: 'Guide',
    title: 'Ask the next useful question.',
    description: 'The intake adapts to VPN, email, identity, application, and device problems to collect relevant diagnostics.'
  },
  {
    number: '03',
    label: 'Structure',
    title: 'Make priority explainable.',
    description: 'Impact and urgency produce a deterministic P1–P4 priority. Sensitive patterns are redacted before storage.'
  },
  {
    number: '04',
    label: 'Resolve',
    title: 'Hand engineers a ticket they can use.',
    description: 'The queue brings diagnostics, ownership, history, internal notes, and optional Jira delivery into one view.'
  }
];

const capabilities = [
  { icon: MessageSquareText, title: 'Adaptive intake', description: 'Focused questions change with the issue category.' },
  { icon: Route, title: 'ITIL-style priority', description: 'A visible impact × urgency matrix produces P1–P4.' },
  { icon: Search, title: 'Engineer queue', description: 'Search, filter, assign, update, and investigate.' },
  { icon: TicketCheck, title: 'Jira delivery', description: 'Create, retry, and synchronize service requests safely.' },
  { icon: ShieldCheck, title: 'Security controls', description: 'Redaction, roles, audit history, and retention controls.' },
  { icon: ClipboardCheck, title: 'Pilot evidence', description: 'Measure completeness, speed, routing, and clarifications.' }
];

const pilotMeasures = [
  'Diagnostic completeness',
  'Median assignment time',
  'Routing accuracy',
  'Clarification contacts',
  'Jira delivery health',
  'Intake completion'
];

const faqs = [
  {
    question: 'Does Triage Portal replace service-desk engineers?',
    answer: 'No. It improves intake and handoff. Engineers remain responsible for diagnosis, assignment, escalation, and resolution.'
  },
  {
    question: 'Is Jira required?',
    answer: 'No. The guided intake and engineering queue work independently. Jira Service Management can be connected when the team is ready.'
  },
  {
    question: 'How is priority decided?',
    answer: 'Employee-friendly impact and urgency questions map to a deterministic ITIL-style 4×4 matrix. Engineers can always see how the result was calculated.'
  },
  {
    question: 'Is the product ready for a company-wide rollout?',
    answer: 'It is currently designed for a controlled pilot with one internal IT team. A wider rollout should follow staging, integration, security, and restore verification.'
  }
];

function BrandMark() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#11110f] text-[#f7f3e8]">
      <Workflow aria-hidden="true" size={19} strokeWidth={2.4} />
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f1e6] text-[#141411] selection:bg-[#ff694a]/35">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f6f1e6]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 py-4 md:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-3 font-bold tracking-[-0.02em]" aria-label="Triage Portal home">
            <BrandMark />
            <span>Triage Portal</span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-8 text-sm font-semibold lg:flex">
            <a href="#why" className="underline-offset-4 hover:underline">Why it matters</a>
            <a href="#workflow" className="underline-offset-4 hover:underline">How it works</a>
            <a href="#product" className="underline-offset-4 hover:underline">Inside the product</a>
            <a href="#pilot" className="underline-offset-4 hover:underline">Pilot</a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/Krishnanegi074/it-service-desk-portal"
              target="_blank"
              rel="noreferrer"
              aria-label="View Triage Portal on GitHub"
              className="hidden h-10 w-10 place-items-center rounded-full border border-black/20 transition hover:bg-white sm:grid"
            >
              <Code2 aria-hidden="true" size={18} />
            </a>
            <Link href="/console" className="rounded-full bg-[#141411] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#3157d5]">
              Open console
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="editorial-grid relative isolate overflow-hidden border-b border-black/10">
          <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20 lg:px-12 lg:pb-28">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-black/20 bg-white/60 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em]">
                <Sparkles aria-hidden="true" size={14} />
                A better front door for internal IT
              </p>
              <p className="max-w-xs text-sm leading-6 text-black/65">Built for employees who need help and engineers who need the right context.</p>
            </div>

            <div className="relative mt-12 lg:mt-16">
              <h1 className="max-w-[1200px] text-[clamp(4rem,11vw,10.5rem)] font-black leading-[0.82] tracking-[-0.075em]">
                Better tickets
                <span className="block text-[#3157d5]">start before</span>
                <span className="flex flex-wrap items-center gap-x-[0.12em]">
                  the queue
                  <span className="mt-[0.12em] inline-grid h-[0.68em] w-[0.68em] place-items-center rounded-full bg-[#ff694a] align-middle text-[0.3em] text-white" aria-hidden="true">
                    <ArrowDownRight size="1.25em" strokeWidth={2.5} />
                  </span>
                </span>
              </h1>

              <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                <div>
                  <p className="max-w-xl text-lg font-medium leading-8 text-black/70 md:text-xl">
                    Triage Portal turns “it stopped working” into a secure, prioritized, resolver-ready incident—without making employees speak like engineers.
                  </p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link href="/report" className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#ff694a] px-6 py-3.5 font-bold text-[#141411] transition hover:bg-[#ff846b]">
                      Try the guided intake
                      <ArrowRight aria-hidden="true" size={18} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                    <a href="#product" className="inline-flex items-center justify-center gap-2 rounded-full border border-black/25 bg-white/50 px-6 py-3.5 font-bold transition hover:bg-white">
                      See how it works
                    </a>
                  </div>
                </div>

                <div className="relative min-h-[330px] sm:min-h-[390px]">
                  <div className="absolute left-0 top-9 w-[82%] rotate-[-3deg] rounded-[2rem] border-2 border-[#141411] bg-[#a9dc63] p-5 shadow-[8px_10px_0_#141411] sm:p-7">
                    <div className="flex items-center justify-between gap-4 border-b border-black/25 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#141411] px-3 py-1 text-xs font-black text-white">P2</span>
                        <span className="text-xs font-bold uppercase tracking-[0.12em]">Network / VPN</span>
                      </div>
                      <span className="font-mono text-xs font-bold">100% ready</span>
                    </div>
                    <p className="mt-6 text-2xl font-black leading-tight tracking-[-0.035em] sm:text-3xl">VPN disconnects after authentication</p>
                    <p className="mt-3 text-sm font-medium text-black/65">macOS · Home Wi-Fi · AUTH_TIMEOUT</p>
                    <div className="mt-7 h-2 overflow-hidden rounded-full bg-black/15" role="progressbar" aria-label="Example ticket diagnostic completeness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={100}>
                      <div className="h-full w-full rounded-full bg-[#141411]" />
                    </div>
                  </div>

                  <div className="absolute bottom-2 right-0 w-[48%] rotate-[4deg] rounded-[1.6rem] border-2 border-[#141411] bg-[#3157d5] p-5 text-white shadow-[6px_8px_0_#141411] sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-white">Priority logic</p>
                    <p className="mt-5 font-mono text-sm leading-6">Urgency 1<br />× Impact 3</p>
                    <p className="mt-5 text-4xl font-black">P2</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-y-2 border-[#141411] bg-[#f8d24a] py-4">
            <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 text-sm font-black uppercase tracking-[0.12em] md:justify-between md:px-8 lg:px-12">
              {['Network / VPN', 'Email', 'Identity / SSO', 'Applications', 'Hardware / Device'].map((item, index) => (
                <span key={item} className="flex items-center gap-8">
                  {item}
                  {index < 4 && <span className="hidden h-2 w-2 rounded-full bg-[#141411] md:block" aria-hidden="true" />}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="why" className="scroll-mt-24 bg-[#3157d5] text-white">
          <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8 md:py-28 lg:px-12 lg:py-36">
            <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:items-start">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-white">The real intake problem</p>
              <div>
                <h2 className="text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-8xl">The first ticket rarely has what resolution needs.</h2>
                <p className="mt-8 max-w-3xl text-xl leading-8 text-white/90 sm:text-2xl sm:leading-9">Missing context creates a clarification loop. Priority becomes subjective. Employee answers and engineering notes drift apart.</p>
              </div>
            </div>

            <div className="mt-16 grid gap-5 md:grid-cols-3">
              {[
                ['01', 'Vague report', '“The VPN is broken” arrives without the device, network, error, or attempted fixes.'],
                ['02', 'Back-and-forth', 'An engineer pauses triage to ask questions the intake could have collected upfront.'],
                ['03', 'Slower action', 'Ownership, priority, and the path to resolution all take longer than they should.']
              ].map(([number, title, description]) => (
                <article key={number} className="border-t border-white/35 pt-5">
                  <span className="font-mono text-sm text-[#d7ddff]">{number}</span>
                  <h3 className="mt-8 text-2xl font-black tracking-[-0.03em]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/90">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-24 border-b border-black/10 bg-[#f6f1e6]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8 md:py-28 lg:px-12 lg:py-36">
            <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#3157d5]">One connected workflow</p>
                <h2 className="mt-5 text-5xl font-black leading-[0.93] tracking-[-0.055em] sm:text-6xl">Four moves.<br />One useful handoff.</h2>
                <p className="mt-6 max-w-md text-lg leading-8 text-black/65">Simple for the employee. Structured for the service desk. Traceable for the organization.</p>
              </div>

              <ol className="divide-y-2 divide-black border-y-2 border-black">
                {workflowSteps.map(step => (
                  <li key={step.number} className="grid gap-5 py-8 sm:grid-cols-[5rem_1fr] sm:py-10">
                    <span className="font-mono text-sm font-bold text-black/65">{step.number}</span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9d311d]">{step.label}</p>
                      <h3 className="mt-3 text-2xl font-black tracking-[-0.035em] sm:text-3xl">{step.title}</h3>
                      <p className="mt-3 max-w-2xl leading-7 text-black/65">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="product" className="scroll-mt-24 bg-[#171714] text-white">
          <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8 md:py-28 lg:px-12 lg:py-36">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#a9dc63]">Inside the product</p>
                <h2 className="mt-5 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl">Made for both sides of the ticket.</h2>
              </div>
              <p className="max-w-md text-lg leading-8 text-white/60">The employee gets guidance. The engineer gets signal. The workflow keeps both views connected.</p>
            </div>

            <div className="mt-16 grid gap-6 lg:grid-cols-2">
              <article className="rounded-[2rem] bg-[#f8d24a] p-6 text-[#141411] sm:p-9">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em]">Employee experience</p>
                    <h3 className="mt-3 text-3xl font-black tracking-[-0.04em]">A form that knows what to ask next.</h3>
                  </div>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#141411] text-white"><MessageSquareText aria-hidden="true" size={21} /></span>
                </div>
                <div className="mt-10 rounded-2xl border-2 border-[#141411] bg-[#fffaf0] p-5 shadow-[6px_7px_0_#141411] sm:p-6">
                  <div className="flex items-center justify-between border-b border-black/15 pb-4">
                    <div><p className="font-black">Report an IT issue</p><p className="mt-1 text-xs text-black/70">Network / VPN playbook</p></div>
                    <span className="font-mono text-xs font-bold">67%</span>
                  </div>
                  <div className="mt-5 space-y-4 text-sm">
                    <div><p className="font-bold">What network are you using?</p><div className="mt-2 rounded-xl border-2 border-[#3157d5] bg-white px-4 py-3 font-medium">Home Wi-Fi</div></div>
                    <div className="rounded-xl bg-[#ff694a]/15 px-4 py-3 font-medium leading-6">Next: What exact error message does the VPN display?</div>
                  </div>
                </div>
                <ul className="mt-8 grid gap-3 text-sm font-bold sm:grid-cols-2">
                  {['Plain-language questions', 'Live completeness guidance', 'Password-sharing warning', 'Trackable confirmation'].map(item => (
                    <li key={item} className="flex items-center gap-2"><Check aria-hidden="true" size={16} />{item}</li>
                  ))}
                </ul>
                <Link href="/report" className="mt-8 inline-flex items-center gap-2 border-b-2 border-[#141411] pb-1 font-black">Open employee intake <ArrowRight aria-hidden="true" size={17} /></Link>
              </article>

              <article className="rounded-[2rem] bg-[#a9dc63] p-6 text-[#141411] sm:p-9">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em]">Engineer experience</p>
                    <h3 className="mt-3 text-3xl font-black tracking-[-0.04em]">A queue built for confident action.</h3>
                  </div>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#141411] text-white"><Search aria-hidden="true" size={21} /></span>
                </div>
                <div className="mt-10 rounded-2xl border-2 border-[#141411] bg-[#fffaf0] p-5 shadow-[6px_7px_0_#141411] sm:p-6">
                  <div className="flex items-center justify-between border-b border-black/15 pb-4">
                    <div><p className="font-black">Live intake queue</p><p className="mt-1 text-xs text-black/70">3 matching incidents</p></div>
                    <span className="rounded-full border border-black/20 px-3 py-1 text-xs font-bold">Filter</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      ['P1', 'SSO unavailable across finance', '100% ready'],
                      ['P2', 'VPN disconnects after sign-in', '100% ready'],
                      ['P3', 'Outlook search returns no results', '67% ready']
                    ].map(([priority, title, readiness]) => (
                      <div key={title} className="flex items-start justify-between gap-3 rounded-xl border border-black/15 bg-white px-4 py-3">
                        <div className="flex items-start gap-3"><span className="rounded bg-[#141411] px-1.5 py-0.5 text-[10px] font-black text-white">{priority}</span><p className="text-sm font-bold">{title}</p></div>
                        <span className="shrink-0 font-mono text-[10px] font-bold">{readiness}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ul className="mt-8 grid gap-3 text-sm font-bold sm:grid-cols-2">
                  {['Search and filters', 'Audited transitions', 'Internal notes', 'Safe Jira retry'].map(item => (
                    <li key={item} className="flex items-center gap-2"><Check aria-hidden="true" size={16} />{item}</li>
                  ))}
                </ul>
                <Link href="/console" className="mt-8 inline-flex items-center gap-2 border-b-2 border-[#141411] pb-1 font-black">Open engineer console <ArrowRight aria-hidden="true" size={17} /></Link>
              </article>
            </div>

            <div className="mt-6 grid gap-px overflow-hidden rounded-[2rem] border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-3">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <article key={title} className="bg-[#171714] p-6 sm:p-8">
                  <Icon aria-hidden="true" size={20} className="text-[#ff8067]" />
                  <h3 className="mt-8 text-xl font-black tracking-[-0.025em]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="scroll-mt-24 border-b-2 border-black bg-[#ff694a]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8 md:py-28 lg:px-12 lg:py-36">
            <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <span className="grid h-14 w-14 place-items-center rounded-full bg-[#141411] text-white"><LockKeyhole aria-hidden="true" size={24} /></span>
                <p className="mt-8 text-sm font-black uppercase tracking-[0.18em]">Security and governance</p>
                <h2 className="mt-5 text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl">Sensitive by nature. Deliberate by design.</h2>
                <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-black/70">IT tickets can contain identity, device, and access information. Safeguards belong across intake, APIs, storage, and administration.</p>
              </div>
              <div className="divide-y-2 divide-black border-y-2 border-black">
                {[
                  [KeyRound, 'Credential redaction', 'Common tokens, private keys, connection strings, and credential patterns are removed before storage.'],
                  [UsersRound, 'Role-based access', 'Employee, engineer, and administrator capabilities are enforced on pages and APIs.'],
                  [ClipboardCheck, 'Audited workflow', 'Assignment, status, notes, delivery attempts, and retention actions leave an event trail.'],
                  [TimerReset, 'Retention controls', 'Administrators preview expired data before a deliberate, confirmed purge.']
                ].map(([Icon, title, description]) => {
                  const SecurityIcon = Icon as typeof KeyRound;
                  return (
                    <article key={String(title)} className="grid gap-4 py-6 sm:grid-cols-[2.5rem_1fr]">
                      <SecurityIcon aria-hidden="true" size={20} />
                      <div><h3 className="font-black">{String(title)}</h3><p className="mt-2 text-sm font-medium leading-6 text-black/80">{String(description)}</p></div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="pilot" className="scroll-mt-24 bg-[#f6f1e6]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8 md:py-28 lg:px-12 lg:py-36">
            <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#3157d5]">Built to prove value</p>
                <h2 className="mt-5 text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl">Start small.<br />Measure honestly.</h2>
              </div>
              <div>
                <p className="max-w-2xl text-xl leading-8 text-black/65">Run a controlled pilot with one internal IT team. Learn whether ticket quality improves before expanding the rollout.</p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-black/20 bg-[#f8d24a] px-4 py-2 text-sm font-bold"><CheckCircle2 aria-hidden="true" size={17} />Current stage: staging setup and pilot preparation</div>
              </div>
            </div>

            <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pilotMeasures.map((measure, index) => (
                <div key={measure} className="flex min-h-28 items-end justify-between rounded-2xl border-2 border-[#141411] bg-white/55 p-5 transition hover:-translate-y-1 hover:bg-white">
                  <span className="text-lg font-black tracking-[-0.02em]">{measure}</span>
                  <span className="font-mono text-xs font-bold text-black/65">{String(index + 1).padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y-2 border-black bg-[#a9dc63]">
          <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-8 md:py-28">
            <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em]">Good questions</p>
                <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Before you ask yours.</h2>
              </div>
              <div className="divide-y-2 divide-black border-y-2 border-black">
                {faqs.map(item => (
                  <details key={item.question} className="group py-6">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-5 text-lg font-black marker:content-none">{item.question}<span aria-hidden="true" className="text-2xl font-medium leading-none transition-transform group-open:rotate-45">+</span></summary>
                    <p className="max-w-2xl pt-4 leading-7 text-black/65">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f6f1e6]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-8 md:py-28 lg:px-12 lg:py-36">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#3157d5] px-6 py-16 text-white sm:px-10 sm:py-20 lg:px-16 lg:py-24">
              <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[3rem] border-white/10" aria-hidden="true" />
              <p className="relative text-sm font-black uppercase tracking-[0.18em] text-white">Ready to see the difference?</p>
              <h2 className="relative mt-6 max-w-5xl text-5xl font-black leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-8xl">See what a better first ticket looks like.</h2>
              <p className="relative mt-7 max-w-2xl text-lg leading-8 text-white/90">Walk through the employee intake, then inspect the same workflow from the engineer’s side.</p>
              <div className="relative mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/report" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f8d24a] px-6 py-3.5 font-black text-[#141411] transition hover:bg-white">Start with employee intake <ArrowRight aria-hidden="true" size={18} /></Link>
                <Link href="/console" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3.5 font-black transition hover:bg-white hover:text-[#141411]">Explore engineer console</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/15 bg-[#f6f1e6]">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 text-sm md:grid-cols-[1fr_auto] md:items-end md:px-8 lg:px-12">
          <div>
            <div className="flex items-center gap-3 font-black"><BrandMark /> Triage Portal</div>
            <p className="mt-4 max-w-md leading-6 text-black/70">Guided incident intake for clearer employee reports and more useful engineering handoffs.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 font-bold">
            <Link href="/report" className="underline-offset-4 hover:underline">Employee intake</Link>
            <Link href="/console" className="underline-offset-4 hover:underline">Engineer console</Link>
            <a href="https://github.com/Krishnanegi074/it-service-desk-portal" target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
