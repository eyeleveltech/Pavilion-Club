import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateSession, getDailyCloseData } from '@pavilion/db';

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

    const data = await getDailyCloseData(db, date);

    return NextResponse.json({ ok: true, data, user: validated.user });
  } catch (err) {
    console.error('Daily close API error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to fetch daily close' }, { status: 500 });
  }
}
