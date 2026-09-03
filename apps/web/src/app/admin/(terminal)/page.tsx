import { cookies } from 'next/headers';
import { createDb, validateSession, getNowBoardData, getDashboardData } from '@pavilion/db';
import { AdminTerminalView } from '@/components/admin/AdminTerminalView';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  let initialNowData = null;
  let initialDashboardData = null;
  let userRole = 'desk';

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;
    const db = createDb();

    if (token) {
      const validated = await validateSession(db, token);
      if (validated) {
        userRole = validated.user.role;
      }
    }

    [initialNowData, initialDashboardData] = await Promise.all([
      getNowBoardData(db).catch(() => null),
      getDashboardData(db).catch(() => null),
    ]);
  } catch (err) {
    console.error('Failed to prefetch admin terminal data on server:', err);
  }

  return (
    <AdminTerminalView
      userRole={userRole}
      initialNowData={initialNowData}
      initialDashboardData={initialDashboardData}
    />
  );
}
