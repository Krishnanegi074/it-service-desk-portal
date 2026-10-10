import OperationsDashboard from '@/components/OperationsDashboard';
import { redirect } from 'next/navigation';
import { getCurrentPrincipal, isStaff } from '@/lib/auth';
import { listAssignableStaff, listIncidents } from '@/lib/db';
import type { AppUserSummary } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export default async function ConsolePage() {
  const principal = await getCurrentPrincipal();
  if (!principal) redirect('/login?next=/console');
  if (!isStaff(principal)) redirect('/unauthorized');
  const queue = await listIncidents({ page: 1, limit: 12 });
  const staff: AppUserSummary[] = principal.demo
    ? [{
        id: principal.id,
        email: principal.email,
        fullName: principal.fullName,
        role: principal.role === 'admin' ? 'admin' : 'engineer'
      }]
    : await listAssignableStaff();

  return (
    <OperationsDashboard
      currentUser={principal}
      initialIncidents={queue.items}
      initialStaff={staff}
      initialPagination={{
        page: queue.page,
        limit: queue.limit,
        total: queue.total,
        totalPages: queue.totalPages
      }}
    />
  );
}
