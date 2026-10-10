import { redirect } from 'next/navigation';
import ReportPageClient from '@/components/ReportPageClient';
import { getCurrentPrincipal } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ReportIncidentPage() {
  const principal = await getCurrentPrincipal();
  if (!principal) redirect('/login?next=/report');

  return <ReportPageClient currentUser={principal} />;
}
