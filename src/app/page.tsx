import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="max-w-6xl mx-auto px-5 py-4 flex justify-between items-center">
          <div className="font-semibold tracking-tight">Corporate IT Services</div>
          <span className="text-xs rounded-full border border-emerald-800 bg-emerald-950 px-3 py-1 text-emerald-400">Systems operational</span>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 py-16 sm:py-24 grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">IT service desk</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">Get technical help without the back-and-forth.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            Report an issue through a guided diagnostic form. We collect the details engineers need, calculate priority consistently, and create a trackable incident.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/report" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-center font-semibold text-white transition">Report an IT issue</Link>
            <Link href="/console" className="rounded-lg border border-slate-700 hover:bg-slate-900 px-5 py-3 text-center font-semibold text-slate-300 transition">Open engineer console</Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <h2 className="font-semibold text-slate-100">What happens after you submit?</h2>
          <ol className="mt-5 space-y-5">
            {[
              ['1', 'Focused diagnostics', 'Questions adapt to VPN, email, access, application, or hardware issues.'],
              ['2', 'Consistent priority', 'Business impact is translated into a deterministic ITIL priority.'],
              ['3', 'Trackable ticket', 'You receive an incident ID and a status page for follow-up.']
            ].map(([number, title, description]) => (
              <li key={number} className="flex gap-4">
                <span className="h-8 w-8 shrink-0 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 flex items-center justify-center text-sm font-bold">{number}</span>
                <div><h3 className="font-medium text-slate-200">{title}</h3><p className="mt-1 text-sm text-slate-400">{description}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-slate-900 bg-slate-950/60">
        <div className="max-w-6xl mx-auto px-5 py-10 grid sm:grid-cols-3 gap-4">
          {[
            ['Guided intake', 'Complete tickets with fewer clarification messages.'],
            ['Security-aware', 'Credential patterns are redacted before storage.'],
            ['Human owned', 'Engineers remain responsible for diagnosis and resolution.']
          ].map(([title, description]) => (
            <div key={title} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-slate-400">{description}</p></div>
          ))}
        </div>
      </section>
    </main>
  );
}
