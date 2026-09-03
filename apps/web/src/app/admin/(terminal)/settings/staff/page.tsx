import { cookies } from 'next/headers';
import { createDb, validateSession, getStaffUsersList } from '@pavilion/db';
import { StaffSettingsView } from '@/components/admin/settings/StaffSettingsView';

export const dynamic = 'force-dynamic';

export default async function StaffSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('pavilion_session')?.value;

  const db = createDb();
  const [staff, validated] = await Promise.all([
    getStaffUsersList(db),
    token ? validateSession(db, token) : null,
  ]);

  const currentUserId = validated?.user?.id || '';

  return (
    <StaffSettingsView
      staff={staff.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        deactivatedAt: s.deactivatedAt ? s.deactivatedAt.toISOString() : null,
      }))}
      currentUserId={currentUserId}
    />
  );
}
