import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-5">
      <div className="max-w-md text-center"><p className="text-sm text-indigo-400 font-semibold">Not found</p><h1 className="mt-2 text-3xl font-bold">We could not find that incident.</h1><p className="mt-3 text-slate-400">Check the ticket link or return to the service desk.</p><Link href="/" className="inline-block mt-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 font-semibold">Return home</Link></div>
    </main>
  );
}
