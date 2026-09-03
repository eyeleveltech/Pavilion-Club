import { cookies } from 'next/headers';
import { createDb, getDailyCloseData } from '@pavilion/db';
import { businessDate, IST_OFFSET_MINUTES } from '@pavilion/core';
import { DailyCloseView } from '@/components/admin/close/DailyCloseView';

export const dynamic = 'force-dynamic';

export default async function AdminDailyClosePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const todayYmd = businessDate(new Date(), IST_OFFSET_MINUTES, 5);
  const targetDate = params.date || todayYmd;

  const db = createDb();
  const data = await getDailyCloseData(db, targetDate);

  return <DailyCloseView initialData={data} />;
}
