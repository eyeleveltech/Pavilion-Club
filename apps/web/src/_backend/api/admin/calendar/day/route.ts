import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateSession, getDayCalendarData } from '@pavilion/db';

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
    const date = searchParams.get('date') || undefined;

    const data = await getDayCalendarData(db, date);

    return NextResponse.json({ ok: true, data, userRole: validated.user.role });
  } catch (err) {
    console.error('Day calendar API error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to fetch day calendar' }, { status: 500 });
  }
}
