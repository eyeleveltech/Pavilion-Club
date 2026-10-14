import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createDb, validateSession, hasPermission } from '@pavilion/db';
import { ReportsView } from '@/components/admin/reports/ReportsView';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('pavilion_session')?.value;
  if (!token) redirect('/admin/login');

  const db = createDb();
  const validated = await validateSession(db, token);
  if (!validated) redirect('/admin/login');

  if (!hasPermission(validated.user.role, 'reports:read')) {
    redirect('/admin/denied');
  }

  return <ReportsView />;
}
