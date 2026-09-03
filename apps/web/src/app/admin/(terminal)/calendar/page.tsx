import { cookies } from 'next/headers';
import { createDb, validateSession, getDayCalendarData, getMonthCalendarData } from '@pavilion/db';
import { businessDate, IST_OFFSET_MINUTES } from '@pavilion/core';
import { CalendarViewContainer } from '@/components/admin/calendar/CalendarViewContainer';

export const dynamic = 'force-dynamic';

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const todayYmd = businessDate(now, IST_OFFSET_MINUTES, 5);

  const selectedDate = params.date || todayYmd;
  const selectedMonth = params.month || selectedDate.slice(0, 7);

  const db = createDb();
  let dayData = null;
  let monthData = null;

  try {
    [dayData, monthData] = await Promise.all([
      getDayCalendarData(db, selectedDate).catch(() => null),
      getMonthCalendarData(db, selectedMonth).catch(() => null),
    ]);
  } catch (err) {
    console.error('Failed to prefetch calendar data:', err);
  }

  return (
    <CalendarViewContainer
      initialViewMode={params.month && !params.date ? 'month' : 'day'}
      initialDate={selectedDate}
      initialMonth={selectedMonth}
      initialDayData={dayData}
      initialMonthData={monthData}
    />
  );
}
