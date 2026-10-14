import { cookies } from 'next/headers';
import { createDb, validateSession, getDayCalendarData, getMonthCalendarData } from '@pavilion/db';
import { CalendarViewContainer } from '@/components/admin/calendar/CalendarViewContainer';

export const dynamic = 'force-dynamic';

export default async function AdminCalendarDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const month = date.slice(0, 7);

  const db = createDb();
  let dayData = null;
  let monthData = null;

  try {
    [dayData, monthData] = await Promise.all([
      getDayCalendarData(db, date).catch(() => null),
      getMonthCalendarData(db, month).catch(() => null),
    ]);
  } catch (err) {
    console.error('Failed to prefetch calendar date data:', err);
  }

  return (
    <CalendarViewContainer
      initialViewMode="day"
      initialDate={date}
      initialMonth={month}
      initialDayData={dayData}
      initialMonthData={monthData}
    />
  );
}
