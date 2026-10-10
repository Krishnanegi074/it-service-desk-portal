'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import IncidentIntakeForm from '@/components/IncidentIntakeForm';

export default function ReportPageClient({
  currentUser
}: {
  currentUser: { fullName: string; email: string };
}) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <nav className="mb-5 flex justify-between items-center text-sm">
          <Link href="/" className="text-slate-400 hover:text-white">← Service desk home</Link>
          <div className="flex items-center gap-3">
            <Link href="/console" className="text-slate-400 hover:text-slate-200">Engineer console</Link>
            <form action="/auth/signout" method="post"><button type="submit" className="text-slate-400 hover:text-slate-200">Sign out</button></form>
          </div>
        </nav>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-2xl">
          <IncidentIntakeForm
            initialReporter={currentUser}
            onSuccess={incident => router.push(`/report/${incident.id}/success`)}
          />
        </div>
      </div>
    </main>
  );
}
