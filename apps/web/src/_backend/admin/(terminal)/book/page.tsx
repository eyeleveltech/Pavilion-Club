import { cookies } from 'next/headers';
import { createDb, validateSession, getBookableCourts } from '@pavilion/db';
import { businessDate, IST_OFFSET_MINUTES } from '@pavilion/core';
import { BookSlotTerminal } from '@/components/admin/BookSlotTerminal';

export const dynamic = 'force-dynamic';

export default async function AdminBookPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('pavilion_session')?.value;
  const db = createDb();

  let userRole = 'desk';
  if (token) {
    const validated = await validateSession(db, token);
    if (validated) {
      userRole = validated.user.role;
    }
  }

  const courtsList = await getBookableCourts(db);
  const todayYmd = businessDate(new Date(), IST_OFFSET_MINUTES, 5);

  return (
    <BookSlotTerminal
      userRole={userRole}
      initialCourts={courtsList.map((c) => ({ id: c.id, name: c.name }))}
      todayDate={todayYmd}
    />
  );
}
