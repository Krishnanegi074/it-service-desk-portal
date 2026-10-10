import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
      <section className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-400">Access restricted</p>
        <h1 className="mt-3 text-2xl font-bold">Engineer access is required.</h1>
        <p className="mt-3 text-slate-400">Your account can report and track incidents, but it cannot open the engineering queue.</p>
        <Link href="/report" className="mt-7 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold hover:bg-indigo-500">Go to incident reporting</Link>
      </section>
    </main>
  );
}
