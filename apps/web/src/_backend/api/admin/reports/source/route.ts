import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateSession, requirePermission, getSourceWiseReport } from '@pavilion/db';

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
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const defaultFrom = `${year}-${month}-01`;
    const defaultTo = `${year}-${month}-${new Date(year, now.getMonth() + 1, 0).getDate()}`;

    const fromDate = searchParams.get('from') || defaultFrom;
    const toDate = searchParams.get('to') || defaultTo;

    const data = await getSourceWiseReport(db, fromDate, toDate);
    return NextResponse.json({ ok: true, ...data });
  } catch (err: any) {
    if (err.statusCode === 403) return NextResponse.json({ ok: false, error: err.message }, { status: 403 });
    console.error('Source report error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
