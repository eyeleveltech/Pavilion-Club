import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateSession, requirePermission, getOccupancyReport } from '@pavilion/db';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = createDb();
    const validated = await validateSession(db, token);
    if (!validated) return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 });

    requirePermission(validated.user, 'reports:read');

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from') || new Date().toISOString().split('T')[0]!;
    const toDate = searchParams.get('to') || new Date().toISOString().split('T')[0]!;

    const data = await getOccupancyReport(db, fromDate, toDate);
    return NextResponse.json({ ok: true, ...data });
  } catch (err: any) {
    if (err.statusCode === 403) return NextResponse.json({ ok: false, error: err.message }, { status: 403 });
    console.error('Occupancy report error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to generate occupancy report' }, { status: 500 });
  }
}
