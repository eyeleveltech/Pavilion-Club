import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateSession, searchBookings } from '@pavilion/db';

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
    const q = searchParams.get('q') || '';

    const results = await searchBookings(db, q);

    return NextResponse.json({
      ok: true,
      query: q,
      results,
    });
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to search bookings' }, { status: 500 });
  }
}
