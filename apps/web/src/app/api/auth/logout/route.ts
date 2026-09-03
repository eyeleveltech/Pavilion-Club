import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDb, destroySession } from '@pavilion/db';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pavilion_session')?.value;

    if (token) {
      const db = createDb();
      await destroySession(db, token);
      cookieStore.delete('pavilion_session');
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
