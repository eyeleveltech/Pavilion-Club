import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateSession, getMonthCalendarData } from '@pavilion/db';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) {
      return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || undefined;

    const data = await getMonthCalendarData(db, month);

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('Month calendar API error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to fetch month calendar' }, { status: 500 });
  }
}
