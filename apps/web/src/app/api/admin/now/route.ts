import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, validateSession, getNowBoardData } from '@pavilion/db';

export async function GET() {
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

    const data = await getNowBoardData(db);

    return NextResponse.json({
      ok: true,
      data,
      userRole: validated.user.role,
    });
  } catch (err) {
    console.error('Failed to fetch Now board data:', err);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch live board data' },
      { status: 500 }
    );
  }
}
